import type {
  DockviewApi,
  IDockviewPanel,
  SerializedDockview as UpstreamSerializedDockview,
  VueComponent,
} from 'dockview-vue';
import { inject, provide, type Component, type InjectionKey } from 'vue';

import {
  cloneSerializableRecord,
  type PanelPlacement,
  type PanelType,
  type SerializablePanelParameters,
  type WorkspacePanelInstance,
} from '../types';
import { selectAlignedPanelPlacement } from './selectAlignedPanelPlacement';
import { validateSerializedDockview } from './validateSerializedDockview';

export interface Disposable {
  dispose(): void;
}

/**
 * Dockview's JSON stays opaque to the rest of TradeMaker. Restoration validates
 * its safe top-level shape before it crosses into the upstream API.
 */
export type SerializedDockview = Readonly<Record<string, unknown>>;

export interface WorkspaceDockPanelParameters {
  instanceId: string;
  panelParameters: SerializablePanelParameters;
  panelType: PanelType;
  title: string;
}

/**
 * Dockview Vue wraps a panel's application parameters with its own renderer
 * APIs before supplying them through the component's `params` prop.
 */
export interface WorkspaceDockviewComponentParameters {
  params: WorkspaceDockPanelParameters;
}

export type WorkspaceDockviewVueComponent = VueComponent;

type PermittedDockviewCapability =
  | 'addFloatingGroup'
  | 'addPanel'
  | 'fromJSON'
  | 'getPanel'
  | 'onDidLayoutChange'
  | 'panels'
  | 'removePanel'
  | 'toJSON'
  | 'updateOptions';

/**
 * The complete upstream API never crosses the TradeMaker attachment seam.
 * In particular, this capability object has no popout/window operation.
 */
export type WorkspaceDockviewRuntime = Pick<
  DockviewApi,
  PermittedDockviewCapability
>;

export function createWorkspaceDockviewRuntime(
  api: DockviewApi,
): WorkspaceDockviewRuntime {
  return Object.freeze({
    addFloatingGroup: api.addFloatingGroup.bind(api),
    addPanel: api.addPanel.bind(api),
    fromJSON: api.fromJSON.bind(api),
    get panels() {
      return api.panels;
    },
    getPanel: api.getPanel.bind(api),
    onDidLayoutChange: api.onDidLayoutChange.bind(api),
    removePanel: api.removePanel.bind(api),
    toJSON: api.toJSON.bind(api),
    updateOptions: api.updateOptions.bind(api),
  });
}

export function asWorkspaceDockviewComponent(
  component: Component,
): WorkspaceDockviewVueComponent {
  return component as WorkspaceDockviewVueComponent;
}

export interface WorkspaceLayoutPort {
  attach(containerApi: WorkspaceDockviewRuntime): void;
  addPanel(instance: WorkspacePanelInstance, placement?: PanelPlacement): void;
  removePanel(instanceId: string): void;
  capturePlacement(instanceId: string): PanelPlacement;
  maximize(instanceId: string): void;
  restoreMaximized(instanceId: string): void;
  float(instanceId: string): void;
  serialize(): SerializedDockview;
  restore(layout: SerializedDockview): void;
  onLayoutChanged(listener: () => void): Disposable;
}

const workspaceLayoutPortKey: InjectionKey<WorkspaceLayoutPort> = Symbol(
  'TradeMaker workspace layout port',
);

export function provideWorkspaceLayout<T extends WorkspaceLayoutPort>(
  port: T,
): T {
  provide(workspaceLayoutPortKey, port);
  return port;
}

export function useWorkspaceLayout(): WorkspaceLayoutPort {
  const port = inject(workspaceLayoutPortKey, null);
  if (!port) {
    throw new Error(
      'No TradeMaker workspace layout port was provided by the dock shell.',
    );
  }
  return port;
}

const dockviewDirection = {
  above: 'above',
  below: 'below',
  left: 'left',
  right: 'right',
} as const;

export class DockviewWorkspaceAdapter implements WorkspaceLayoutPort {
  private containerApi: WorkspaceDockviewRuntime | undefined;

  attach(containerApi: WorkspaceDockviewRuntime): void {
    this.containerApi = containerApi;
    containerApi.updateOptions({
      // Pointer DnD works consistently in embedded browser workspaces and
      // intentionally gives up Dockview's cross-window HTML5 drag path.
      dndStrategy: 'pointer',
      floatingGroupBounds: 'boundedWithinViewport',
    });
  }

  addPanel(
    instance: WorkspacePanelInstance,
    placement: PanelPlacement = { kind: 'default' },
  ): void {
    const containerApi = this.requireContainer();
    const position = this.translatePlacement(placement);
    const params: WorkspaceDockPanelParameters = {
      instanceId: instance.instanceId,
      panelParameters: cloneSerializableRecord(instance.parameters),
      panelType: instance.type,
      title: instance.title,
    };

    containerApi.addPanel({
      component: instance.type,
      id: instance.instanceId,
      params,
      ...(position ? { position } : {}),
      tabComponent: 'workspace-panel-tab',
      title: instance.title,
    });
  }

  removePanel(instanceId: string): void {
    const containerApi = this.requireContainer();
    containerApi.removePanel(this.requirePanel(instanceId));
  }

  capturePlacement(instanceId: string): PanelPlacement {
    const panel = this.requirePanel(instanceId);
    const tabReference = panel.group.panels.find(
      (candidate) => candidate.id !== panel.id,
    );
    if (tabReference) {
      return {
        kind: 'relative',
        referenceInstanceId: tabReference.id,
        position: 'tab',
      };
    }

    return this.captureRelativeGridPlacement(panel);
  }

  maximize(instanceId: string): void {
    this.requirePanel(instanceId).group.api.maximize();
  }

  restoreMaximized(instanceId: string): void {
    this.requirePanel(instanceId).group.api.exitMaximized();
  }

  float(instanceId: string): void {
    const containerApi = this.requireContainer();
    // Dockview's in-page floating group is deliberate here. Never replace this
    // with addPopoutGroup: TradeMaker keeps every panel inside this browser
    // workspace. See https://dockview.dev/docs/core/panels/floating-groups/.
    containerApi.addFloatingGroup(this.requirePanel(instanceId));
  }

  serialize(): SerializedDockview {
    return validateSerializedDockview(
      this.requireContainer().toJSON(),
    ) as unknown as SerializedDockview;
  }

  restore(layout: SerializedDockview): void {
    this.requireContainer().fromJSON(
      validateSerializedDockview(layout) as unknown as UpstreamSerializedDockview,
    );
  }

  onLayoutChanged(listener: () => void): Disposable {
    return this.requireContainer().onDidLayoutChange(listener);
  }

  private requireContainer(): WorkspaceDockviewRuntime {
    if (!this.containerApi) {
      throw new Error('The Dockview workspace adapter is not attached.');
    }
    return this.containerApi;
  }

  private requirePanel(instanceId: string): IDockviewPanel {
    const panel = this.requireContainer().getPanel(instanceId);
    if (!panel) {
      throw new Error(
        `Workspace panel "${instanceId}" is not attached to the layout.`,
      );
    }
    return panel;
  }

  private translatePlacement(placement: PanelPlacement) {
    if (placement.kind === 'default') return undefined;

    this.requirePanel(placement.referenceInstanceId);
    if (placement.position === 'tab') {
      return { referencePanel: placement.referenceInstanceId };
    }

    return {
      direction: dockviewDirection[placement.position],
      referencePanel: placement.referenceInstanceId,
    };
  }

  private captureRelativeGridPlacement(panel: IDockviewPanel): PanelPlacement {
    const targetBounds = panel.group.api.boundingBox;
    if (!targetBounds) return { kind: 'default' };

    const candidates = this.requireContainer().panels.flatMap((candidate) => {
      const bounds = candidate.group.api.boundingBox;
      if (candidate.group === panel.group || !bounds) return [];

      return [{ bounds, instanceId: candidate.id }];
    });

    return selectAlignedPanelPlacement(targetBounds, candidates);
  }
}

function validateMaximizedNode(
  maximizedNode: unknown,
  root: unknown,
  label: string,
): void {
  if (
    !isPlainRecord(maximizedNode) ||
    !Array.isArray(maximizedNode.location) ||
    !maximizedNode.location.every(
      (segment) => Number.isInteger(segment) && segment >= 0,
    )
  ) {
    return invalidSavedLayout(`${label} maximized node location is invalid`);
  }

  let node = root;
  for (const segment of maximizedNode.location) {
    if (
      !isPlainRecord(node) ||
      node.type !== 'branch' ||
      !Array.isArray(node.data) ||
      segment >= node.data.length
    ) {
      return invalidSavedLayout(
        `${label} maximized node does not reference the grid`,
      );
    }
    node = node.data[segment];
  }
}

function validatePopoutGroups(popoutGroups: unknown): void {
  if (popoutGroups !== undefined && !Array.isArray(popoutGroups)) {
    return invalidSavedLayout('popoutGroups must be an array');
  }
  if (Array.isArray(popoutGroups) && popoutGroups.length > 0) {
    return invalidSavedLayout(
      'layouts with external-window groups are not supported',
    );
  }
}

function invalidSavedLayout(message: string): never {
  throw new TypeError(`Saved workspace ${message}.`);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
