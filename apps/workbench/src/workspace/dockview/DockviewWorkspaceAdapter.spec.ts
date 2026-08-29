import { describe, expect, it, vi } from 'vitest';

import { createPanelInstance } from '../panelRegistry';
import type { PanelPlacement, WorkspacePanelInstance } from '../types';

interface Disposable {
  dispose(): void;
}

interface LayoutPort {
  attach(api: unknown): void;
  addPanel(instance: WorkspacePanelInstance, placement?: PanelPlacement): void;
  removePanel(instanceId: string): void;
  capturePlacement(instanceId: string): PanelPlacement;
  maximize(instanceId: string): void;
  restoreMaximized(instanceId: string): void;
  float(instanceId: string): void;
  serialize(): unknown;
  restore(layout: unknown): void;
  onLayoutChanged(listener: () => void): Disposable;
}

interface AdapterModule {
  DockviewWorkspaceAdapter: new () => LayoutPort;
}

const adapterModules = import.meta.glob<AdapterModule>(
  './DockviewWorkspaceAdapter.ts',
  { eager: true },
);
const Adapter = Object.values(adapterModules)[0]?.DockviewWorkspaceAdapter;

interface FakeBounds {
  height: number;
  left: number;
  top: number;
  width: number;
}

interface FakeGroup {
  api: {
    boundingBox: FakeBounds | undefined;
    exitMaximized: ReturnType<typeof vi.fn>;
    maximize: ReturnType<typeof vi.fn>;
  };
  panels: FakePanel[];
}

interface FakePanel {
  group: FakeGroup;
  id: string;
}

function createGroup(bounds?: FakeBounds): FakeGroup {
  return {
    api: {
      boundingBox: bounds,
      exitMaximized: vi.fn(),
      maximize: vi.fn(),
    },
    panels: [],
  };
}

function createFakeDockviewApi() {
  const panels = new Map<string, FakePanel>();
  const groups: FakeGroup[] = [];
  const addedOptions: Array<Record<string, unknown>> = [];
  const floatingCalls: Array<{
    item: FakePanel;
    options: Record<string, unknown> | undefined;
  }> = [];
  const updatedOptions: Array<Record<string, unknown>> = [];
  const restoredLayouts: unknown[] = [];
  const removedPanels: FakePanel[] = [];
  const layoutListeners: Array<() => void> = [];
  let popoutCalls = 0;
  let serializeCalls = 0;

  const serializedLayout = {
    grid: {
      root: { type: 'leaf', data: { views: [] } },
      height: 720,
      width: 1280,
      orientation: 'HORIZONTAL',
    },
    panels: {},
  };

  const api = {
    get groups() {
      return groups;
    },
    get panels() {
      return [...panels.values()];
    },
    addFloatingGroup(item: FakePanel, options?: Record<string, unknown>) {
      floatingCalls.push({ item, options });
    },
    addPanel(options: Record<string, unknown>) {
      addedOptions.push(options);
      const position = options.position as
        { direction?: string; referencePanel?: string } | undefined;
      const reference = position?.referencePanel
        ? panels.get(position.referencePanel)
        : undefined;
      const group =
        reference && position?.direction === undefined
          ? reference.group
          : createGroup();
      if (!groups.includes(group)) groups.push(group);
      const panel = { group, id: String(options.id) };
      group.panels.push(panel);
      panels.set(panel.id, panel);
      return panel;
    },
    addPopoutGroup() {
      popoutCalls += 1;
    },
    fromJSON(layout: unknown) {
      restoredLayouts.push(layout);
    },
    getPanel(id: string) {
      return panels.get(id);
    },
    onDidLayoutChange(listener: () => void) {
      layoutListeners.push(listener);
      return { dispose: vi.fn() };
    },
    removePanel(panel: FakePanel) {
      removedPanels.push(panel);
      panels.delete(panel.id);
    },
    toJSON() {
      serializeCalls += 1;
      return serializedLayout;
    },
    updateOptions(options: Record<string, unknown>) {
      updatedOptions.push(options);
    },
  };

  return {
    addedOptions,
    api,
    floatingCalls,
    groups,
    layoutListeners,
    panels,
    removedPanels,
    restoredLayouts,
    serializedLayout,
    updatedOptions,
    get popoutCalls() {
      return popoutCalls;
    },
    get serializeCalls() {
      return serializeCalls;
    },
  };
}

function createAttachedAdapter() {
  expect(Adapter).toBeDefined();
  const dockview = createFakeDockviewApi();
  const adapter = new Adapter!();
  adapter.attach(dockview.api);
  return { adapter, dockview };
}

describe('DockviewWorkspaceAdapter', () => {
  it('translates TradeMaker identity, component type, parameters, and placement', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const news = createPanelInstance('news-source');
    const evidence = createPanelInstance('evidence-claims');

    adapter.addPanel(news);
    adapter.addPanel(evidence, {
      kind: 'relative',
      referenceInstanceId: news.instanceId,
      position: 'right',
    });

    expect(dockview.addedOptions).toEqual([
      {
        component: 'news-source',
        id: 'panel-news-source',
        params: {
          instanceId: 'panel-news-source',
          panelParameters: {
            storyId: 'fictional-aurora-circuits-nimbus-x',
          },
          panelType: 'news-source',
          title: 'News source',
        },
        tabComponent: 'workspace-panel-tab',
        title: 'News source',
      },
      {
        component: 'evidence-claims',
        id: 'panel-evidence-claims',
        params: {
          instanceId: 'panel-evidence-claims',
          panelParameters: {
            storyId: 'fictional-aurora-circuits-nimbus-x',
          },
          panelType: 'evidence-claims',
          title: 'Evidence and claims',
        },
        position: {
          direction: 'right',
          referencePanel: 'panel-news-source',
        },
        tabComponent: 'workspace-panel-tab',
        title: 'Evidence and claims',
      },
    ]);
  });

  it('uses native group maximize, bounded in-page floating, and never popout', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const instance = createPanelInstance('guided-interpretation');
    adapter.addPanel(instance);
    const panel = dockview.panels.get(instance.instanceId)!;

    adapter.maximize(instance.instanceId);
    adapter.restoreMaximized(instance.instanceId);
    adapter.float(instance.instanceId);

    expect(panel.group.api.maximize).toHaveBeenCalledOnce();
    expect(panel.group.api.exitMaximized).toHaveBeenCalledOnce();
    expect(dockview.updatedOptions).toContainEqual({
      dndStrategy: 'pointer',
      floatingGroupBounds: 'boundedWithinViewport',
    });
    expect(dockview.floatingCalls).toEqual([
      { item: panel, options: undefined },
    ]);
    expect(dockview.popoutCalls).toBe(0);
  });

  it('delegates serialization, safe restoration, removal, and layout events once', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const instance = createPanelInstance('primary-security');
    adapter.addPanel(instance);
    const listener = vi.fn();

    const subscription = adapter.onLayoutChanged(listener);
    const layout = adapter.serialize();
    adapter.restore(layout);
    dockview.layoutListeners[0]?.();
    adapter.removePanel(instance.instanceId);

    expect(dockview.serializeCalls).toBe(1);
    expect(dockview.restoredLayouts).toEqual([dockview.serializedLayout]);
    expect(listener).toHaveBeenCalledOnce();
    expect(subscription.dispose).toEqual(expect.any(Function));
    expect(dockview.removedPanels).toHaveLength(1);
  });

  it('captures a tab relationship in TradeMaker terms', () => {
    const { adapter } = createAttachedAdapter();
    const news = createPanelInstance('news-source');
    const evidence = createPanelInstance('evidence-claims');
    adapter.addPanel(news);
    adapter.addPanel(evidence, {
      kind: 'relative',
      referenceInstanceId: news.instanceId,
      position: 'tab',
    });

    expect(adapter.capturePlacement(evidence.instanceId)).toEqual({
      kind: 'relative',
      referenceInstanceId: news.instanceId,
      position: 'tab',
    });
  });

  it('captures a split relationship from Dockview left/top bounds', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const news = createPanelInstance('news-source');
    const evidence = createPanelInstance('evidence-claims');
    adapter.addPanel(news);
    adapter.addPanel(evidence);
    dockview.panels.get(news.instanceId)!.group.api.boundingBox = {
      height: 300,
      left: 0,
      top: 0,
      width: 400,
    };
    dockview.panels.get(evidence.instanceId)!.group.api.boundingBox = {
      height: 300,
      left: 400,
      top: 0,
      width: 400,
    };

    expect(adapter.capturePlacement(evidence.instanceId)).toEqual({
      kind: 'relative',
      referenceInstanceId: news.instanceId,
      position: 'right',
    });
  });

  it('rejects unknown instances and layouts that could open external windows readably', () => {
    const { adapter, dockview } = createAttachedAdapter();

    expect(() => adapter.maximize('panel-missing')).toThrow(
      'Workspace panel "panel-missing" is not attached to the layout.',
    );
    expect(() =>
      adapter.restore({
        ...dockview.serializedLayout,
        popoutGroups: [{ position: null }],
      }),
    ).toThrow(/external-window groups are not supported/i);
    expect(dockview.restoredLayouts).toHaveLength(0);
    expect(dockview.popoutCalls).toBe(0);
  });
});
