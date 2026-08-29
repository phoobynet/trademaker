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

export function asWorkspaceDockviewComponent(
  component: Component,
): WorkspaceDockviewVueComponent {
  return component as WorkspaceDockviewVueComponent;
}

export interface WorkspaceLayoutPort {
  attach(containerApi: DockviewApi): void;
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
  private containerApi: DockviewApi | undefined;

  attach(containerApi: DockviewApi): void {
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
    const layout = this.requireContainer().toJSON();
    validateSerializedDockview(layout);
    return layout as unknown as SerializedDockview;
  }

  restore(layout: SerializedDockview): void {
    validateSerializedDockview(layout);
    this.requireContainer().fromJSON(
      layout as unknown as UpstreamSerializedDockview,
    );
  }

  onLayoutChanged(listener: () => void): Disposable {
    return this.requireContainer().onDidLayoutChange(listener);
  }

  private requireContainer(): DockviewApi {
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

    const reference = this.requireContainer().panels.find(
      (candidate) =>
        candidate.group !== panel.group &&
        candidate.group.api.boundingBox !== undefined,
    );
    const referenceBounds = reference?.group.api.boundingBox;
    if (!reference || !referenceBounds) return { kind: 'default' };

    const targetCenterX = targetBounds.left + targetBounds.width / 2;
    const targetCenterY = targetBounds.top + targetBounds.height / 2;
    const referenceCenterX = referenceBounds.left + referenceBounds.width / 2;
    const referenceCenterY = referenceBounds.top + referenceBounds.height / 2;
    const horizontalDistance = Math.abs(targetCenterX - referenceCenterX);
    const verticalDistance = Math.abs(targetCenterY - referenceCenterY);

    let position: Exclude<
      Extract<PanelPlacement, { kind: 'relative' }>['position'],
      'tab'
    >;
    if (horizontalDistance >= verticalDistance) {
      position = targetCenterX < referenceCenterX ? 'left' : 'right';
    } else {
      position = targetCenterY < referenceCenterY ? 'above' : 'below';
    }

    return {
      kind: 'relative',
      referenceInstanceId: reference.id,
      position,
    };
  }
}

function validateSerializedDockview(
  layout: unknown,
): asserts layout is UpstreamSerializedDockview {
  if (!isRecord(layout)) {
    throw new TypeError('Saved workspace layout must be an object.');
  }
  if (!isRecord(layout.grid) || !isRecord(layout.panels)) {
    throw new TypeError(
      'Saved workspace layout must contain Dockview grid and panel records.',
    );
  }

  const popoutGroups = layout.popoutGroups;
  if (popoutGroups !== undefined && !Array.isArray(popoutGroups)) {
    throw new TypeError('Saved workspace popout groups must be an array.');
  }
  if (Array.isArray(popoutGroups) && popoutGroups.length > 0) {
    throw new TypeError(
      'Saved workspace layouts with external-window groups are not supported.',
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
