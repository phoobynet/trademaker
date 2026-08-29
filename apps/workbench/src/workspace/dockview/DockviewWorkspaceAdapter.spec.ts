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

interface SerializedPanelFixture {
  contentComponent: string;
  id: string;
  params: {
    instanceId: string;
    panelParameters: Record<string, unknown>;
    panelType: string;
    title: string;
  };
  tabComponent: string;
  title: string;
}

interface SerializedGroupFixture {
  activeView?: string;
  id: string;
  views: string[];
}

type SerializedGridNodeFixture =
  | {
      data: SerializedGroupFixture;
      size?: number;
      type: 'leaf';
    }
  | {
      data: SerializedGridNodeFixture[];
      size?: number;
      type: 'branch';
    };

interface SerializedGridFixture {
  height: number;
  orientation: 'HORIZONTAL' | 'VERTICAL';
  root: SerializedGridNodeFixture;
  width: number;
}

interface SerializedLayoutFixture {
  activeGroup?: string;
  floatingGroups?: Array<{
    data?: SerializedGroupFixture;
    grid?: SerializedGridFixture;
    position: Record<string, number>;
  }>;
  panels: Record<string, SerializedPanelFixture>;
  popoutGroups?: unknown[];
  grid: SerializedGridFixture;
}

function serializedPanel(
  type: string,
  title: string,
): SerializedPanelFixture {
  const instanceId = `panel-${type}`;
  return {
    contentComponent: type,
    id: instanceId,
    params: {
      instanceId,
      panelParameters: {
        storyId: 'fictional-aurora-circuits-nimbus-x',
      },
      panelType: type,
      title,
    },
    tabComponent: 'workspace-panel-tab',
    title,
  };
}

function createValidDefaultSerializedLayout(): SerializedLayoutFixture {
  return {
    activeGroup: '3',
    grid: {
      height: 629,
      orientation: 'HORIZONTAL',
      root: {
        type: 'branch',
        size: 629,
        data: [
          {
            type: 'branch',
            size: 418,
            data: [
              {
                type: 'leaf',
                size: 314,
                data: {
                  activeView: 'panel-news-source',
                  id: '1',
                  views: ['panel-news-source'],
                },
              },
              {
                type: 'leaf',
                size: 315,
                data: {
                  activeView: 'panel-related-companies',
                  id: '4',
                  views: [
                    'panel-primary-security',
                    'panel-related-companies',
                  ],
                },
              },
            ],
          },
          {
            type: 'branch',
            size: 418,
            data: [
              {
                type: 'leaf',
                size: 314,
                data: {
                  activeView: 'panel-evidence-claims',
                  id: '2',
                  views: ['panel-evidence-claims'],
                },
              },
              {
                type: 'leaf',
                size: 315,
                data: {
                  activeView: 'panel-wider-market',
                  id: '5',
                  views: ['panel-wider-market'],
                },
              },
            ],
          },
          {
            type: 'leaf',
            size: 418,
            data: {
              activeView: 'panel-guided-interpretation',
              id: '3',
              views: ['panel-guided-interpretation'],
            },
          },
        ],
      },
      width: 1254,
    },
    panels: {
      'panel-news-source': serializedPanel('news-source', 'News source'),
      'panel-evidence-claims': serializedPanel(
        'evidence-claims',
        'Evidence and claims',
      ),
      'panel-guided-interpretation': serializedPanel(
        'guided-interpretation',
        'Guided interpretation',
      ),
      'panel-primary-security': serializedPanel(
        'primary-security',
        'Primary security',
      ),
      'panel-related-companies': serializedPanel(
        'related-companies',
        'Related companies',
      ),
      'panel-wider-market': serializedPanel(
        'wider-market',
        'Wider market',
      ),
    },
  };
}

function findSerializedGroup(
  node: SerializedGridNodeFixture,
  id: string,
): SerializedGroupFixture {
  if (node.type === 'leaf') {
    if (node.data.id === id) return node.data;
    throw new Error(`Fixture group "${id}" was not found.`);
  }

  for (const child of node.data) {
    try {
      return findSerializedGroup(child, id);
    } catch {
      // Search the next fixture branch.
    }
  }
  throw new Error(`Fixture group "${id}" was not found.`);
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
  const layoutListenerDisposals: Array<ReturnType<typeof vi.fn>> = [];
  let popoutCalls = 0;
  let serializeCalls = 0;

  const serializedLayout = {
    grid: {
      root: { type: 'leaf', data: { id: 'empty', views: [] } },
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
      const dispose = vi.fn(() => {
        const index = layoutListeners.indexOf(listener);
        if (index >= 0) layoutListeners.splice(index, 1);
      });
      layoutListenerDisposals.push(dispose);
      return { dispose };
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
    layoutListenerDisposals,
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
    subscription.dispose();
    dockview.layoutListeners[0]?.();
    adapter.removePanel(instance.instanceId);

    expect(dockview.serializeCalls).toBe(1);
    expect(dockview.restoredLayouts).toEqual([dockview.serializedLayout]);
    expect(listener).toHaveBeenCalledOnce();
    expect(dockview.layoutListenerDisposals).toHaveLength(1);
    expect(dockview.layoutListenerDisposals[0]).toHaveBeenCalledOnce();
    expect(dockview.layoutListeners).toEqual([]);
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

  it('captures deterministic aligned neighbours across the default multi-row grid', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const news = createPanelInstance('news-source');
    const evidence = createPanelInstance('evidence-claims');
    const guidance = createPanelInstance('guided-interpretation');
    const primary = createPanelInstance('primary-security');
    const related = createPanelInstance('related-companies');
    const wider = createPanelInstance('wider-market');
    adapter.addPanel(news);
    adapter.addPanel(evidence);
    adapter.addPanel(guidance);
    adapter.addPanel(primary);
    adapter.addPanel(related, {
      kind: 'relative',
      referenceInstanceId: primary.instanceId,
      position: 'tab',
    });
    adapter.addPanel(wider);
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
    dockview.panels.get(guidance.instanceId)!.group.api.boundingBox = {
      height: 600,
      left: 800,
      top: 0,
      width: 400,
    };
    dockview.panels.get(primary.instanceId)!.group.api.boundingBox = {
      height: 300,
      left: 0,
      top: 300,
      width: 400,
    };
    dockview.panels.get(wider.instanceId)!.group.api.boundingBox = {
      height: 300,
      left: 400,
      top: 300,
      width: 400,
    };

    expect(adapter.capturePlacement(wider.instanceId)).toEqual({
      kind: 'relative',
      referenceInstanceId: evidence.instanceId,
      position: 'below',
    });
    expect(adapter.capturePlacement(guidance.instanceId)).toEqual({
      kind: 'relative',
      referenceInstanceId: evidence.instanceId,
      position: 'right',
    });
    expect(adapter.capturePlacement(related.instanceId)).toEqual({
      kind: 'relative',
      referenceInstanceId: primary.instanceId,
      position: 'tab',
    });
  });

  it('falls back to default placement when no neighbour shares an axis', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const news = createPanelInstance('news-source');
    const evidence = createPanelInstance('evidence-claims');
    adapter.addPanel(news);
    adapter.addPanel(evidence);
    dockview.panels.get(news.instanceId)!.group.api.boundingBox = {
      height: 100,
      left: 0,
      top: 0,
      width: 100,
    };
    dockview.panels.get(evidence.instanceId)!.group.api.boundingBox = {
      height: 100,
      left: 200,
      top: 200,
      width: 100,
    };

    expect(adapter.capturePlacement(evidence.instanceId)).toEqual({
      kind: 'default',
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

  it('restores a validated layout with a real bounded floating-group shape and cloned parameters', () => {
    const { adapter, dockview } = createAttachedAdapter();
    const layout = createValidDefaultSerializedLayout();
    if (layout.grid.root.type !== 'branch') {
      throw new Error('The fixture root must be a branch.');
    }
    layout.grid.root.data.pop();
    layout.floatingGroups = [
      {
        data: {
          activeView: 'panel-guided-interpretation',
          id: '3',
          views: ['panel-guided-interpretation'],
        },
        position: { height: 300, left: 113, top: 162, width: 300 },
      },
    ];

    adapter.restore(layout);

    expect(dockview.restoredLayouts).toHaveLength(1);
    const restored = dockview.restoredLayouts[0] as SerializedLayoutFixture;
    expect(restored).toEqual(layout);
    expect(
      restored.panels['panel-news-source']!.params.panelParameters,
    ).not.toBe(
      layout.panels['panel-news-source']!.params.panelParameters,
    );
  });

  it.each([
    {
      name: 'unknown singleton panel key',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-unknown'] = {
          ...layout.panels['panel-news-source']!,
          id: 'panel-unknown',
          params: {
            ...layout.panels['panel-news-source']!.params,
            instanceId: 'panel-unknown',
          },
        };
      },
    },
    {
      name: 'panel key and id mismatch',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.id = 'panel-evidence-claims';
      },
    },
    {
      name: 'duplicate nested instance id',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-evidence-claims']!.params.instanceId =
          'panel-news-source';
      },
    },
    {
      name: 'unrecognized panel type',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.params.panelType = 'terminal';
      },
    },
    {
      name: 'registry title mismatch',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.title = 'Breaking news';
      },
    },
    {
      name: 'nested registry title mismatch',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.params.title = 'Breaking news';
      },
    },
    {
      name: 'unapproved content component',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.contentComponent = 'terminal';
      },
    },
    {
      name: 'unapproved tab component',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.tabComponent = 'popout-tab';
      },
    },
    {
      name: 'non-JSON-safe panel parameters',
      corrupt(layout: SerializedLayoutFixture) {
        layout.panels['panel-news-source']!.params.panelParameters.bad =
          Number.POSITIVE_INFINITY;
      },
    },
    {
      name: 'unknown grid panel reference',
      corrupt(layout: SerializedLayoutFixture) {
        findSerializedGroup(layout.grid.root, '1').views = ['panel-missing'];
      },
    },
    {
      name: 'duplicate grid panel reference',
      corrupt(layout: SerializedLayoutFixture) {
        findSerializedGroup(layout.grid.root, '5').views = [
          'panel-evidence-claims',
        ];
      },
    },
    {
      name: 'unreferenced serialized panel',
      corrupt(layout: SerializedLayoutFixture) {
        const widerGroup = findSerializedGroup(layout.grid.root, '5');
        widerGroup.views = [];
        delete widerGroup.activeView;
      },
    },
    {
      name: 'unknown floating panel reference',
      corrupt(layout: SerializedLayoutFixture) {
        layout.floatingGroups = [
          {
            data: {
              activeView: 'panel-missing',
              id: 'floating',
              views: ['panel-missing'],
            },
            position: { height: 300, left: 10, top: 10, width: 300 },
          },
        ];
      },
    },
    {
      name: 'unknown active group reference',
      corrupt(layout: SerializedLayoutFixture) {
        layout.activeGroup = 'missing-group';
      },
    },
    {
      name: 'duplicate group id',
      corrupt(layout: SerializedLayoutFixture) {
        findSerializedGroup(layout.grid.root, '5').id = '2';
      },
    },
  ])('rejects $name before upstream mutation', ({ corrupt }) => {
    const { adapter, dockview } = createAttachedAdapter();
    const layout = createValidDefaultSerializedLayout();
    corrupt(layout);

    expect(() => adapter.restore(layout)).toThrow(/saved workspace/i);
    expect(dockview.restoredLayouts).toEqual([]);
  });
});
