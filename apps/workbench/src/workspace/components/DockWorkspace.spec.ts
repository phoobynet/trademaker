/* eslint-disable vue/one-component-per-file -- The integration tests use small local shell harnesses. */
import '@testing-library/jest-dom/vitest';

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/vue';
import type { Component } from 'vue';
import { defineComponent, h } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { sampleStory } from '../../demo/sampleStory';
import { createWorkspaceStore, type WorkspaceStore } from '../workspaceStore';
import type { PanelPlacement, WorkspacePanelInstance } from '../types';
import { provideWorkspace } from '../useWorkspace';

const dockviewHarness = vi.hoisted(() => ({ api: {} as unknown }));

vi.mock('dockview-vue', async () => {
  const vue = await import('vue');

  return {
    DockviewVue: vue.defineComponent({
      name: 'DockviewVue',
      props: {
        components: { type: Object, default: () => ({}) },
        defaultTabComponent: { type: [String, Object], default: undefined },
        floatingGroupBounds: { type: [String, Object], default: undefined },
        tabComponents: { type: Object, default: () => ({}) },
      },
      emits: ['ready'],
      setup(props, { emit }) {
        vue.onMounted(() => emit('ready', { api: dockviewHarness.api }));
        return () =>
          vue.h('div', {
            'data-testid': 'dockview-vue',
            'data-floating-bounds': String(props.floatingGroupBounds),
          });
      },
    }),
  };
});

interface Disposable {
  dispose(): void;
}

interface LayoutPortFake {
  added: Array<{
    instance: WorkspacePanelInstance;
    placement: PanelPlacement | undefined;
  }>;
  attached: unknown[];
  floated: string[];
  maximized: string[];
  restoredLayouts: unknown[];
  restoredMaximized: string[];
  addPanel(instance: WorkspacePanelInstance, placement?: PanelPlacement): void;
  attach(api: unknown): void;
  capturePlacement(instanceId: string): PanelPlacement;
  float(instanceId: string): void;
  maximize(instanceId: string): void;
  onLayoutChanged(listener: () => void): Disposable;
  removePanel(instanceId: string): void;
  restore(layout: unknown): void;
  restoreMaximized(instanceId: string): void;
  serialize(): unknown;
}

interface ComponentModule {
  default: Component;
}

interface AdapterModule {
  provideWorkspaceLayout(port: LayoutPortFake): LayoutPortFake;
}

const componentModules = import.meta.glob<ComponentModule>('./*.vue', {
  eager: true,
});
const adapterModules = import.meta.glob<AdapterModule>(
  '../dockview/DockviewWorkspaceAdapter.ts',
  { eager: true },
);

function getComponent(name: string): Component | undefined {
  return Object.entries(componentModules).find(([path]) =>
    path.endsWith(`/${name}.vue`),
  )?.[1].default;
}

function createLayoutPort(options?: { restoreError?: Error }): LayoutPortFake {
  const added: LayoutPortFake['added'] = [];
  const attached: unknown[] = [];
  const floated: string[] = [];
  const maximized: string[] = [];
  const restoredLayouts: unknown[] = [];
  const restoredMaximized: string[] = [];

  return {
    added,
    attached,
    floated,
    maximized,
    restoredLayouts,
    restoredMaximized,
    addPanel(instance, placement) {
      added.push({ instance, placement });
    },
    attach(api) {
      attached.push(api);
    },
    capturePlacement() {
      return { kind: 'default' };
    },
    float(instanceId) {
      floated.push(instanceId);
    },
    maximize(instanceId) {
      maximized.push(instanceId);
    },
    onLayoutChanged() {
      return { dispose() {} };
    },
    removePanel() {},
    restore(layout) {
      if (options?.restoreError) throw options.restoreError;
      restoredLayouts.push(layout);
    },
    restoreMaximized(instanceId) {
      restoredMaximized.push(instanceId);
    },
    serialize() {
      return {};
    },
  };
}

function panelParams(type: WorkspacePanelInstance['type']) {
  const titleByType: Record<WorkspacePanelInstance['type'], string> = {
    'evidence-claims': 'Evidence and claims',
    'guided-interpretation': 'Guided interpretation',
    'news-source': 'News source',
    'primary-security': 'Primary security',
    'related-companies': 'Related companies',
    'wider-market': 'Wider market',
  };
  return {
    instanceId: `panel-${type}`,
    panelParameters: { storyId: sampleStory.id },
    panelType: type,
    title: titleByType[type],
  };
}

function dockviewComponentProps(type: WorkspacePanelInstance['type']) {
  return {
    params: {
      api: {},
      containerApi: {},
      params: panelParams(type),
    },
  };
}

function renderWithWorkspace(
  component: Component,
  props: Record<string, unknown>,
  store: WorkspaceStore = createWorkspaceStore(),
) {
  const Shell = defineComponent({
    setup() {
      provideWorkspace(store);
      return () => h(component, props);
    },
  });
  return { ...render(Shell), store };
}

afterEach(cleanup);

describe('DockWorkspace', () => {
  it('builds the six-panel default only after Dockview is ready', async () => {
    const DockWorkspace = getComponent('DockWorkspace');
    expect(DockWorkspace).toBeDefined();
    const layoutPort = createLayoutPort();

    render(DockWorkspace!, { props: { layoutPort } });

    await waitFor(() =>
      expect(layoutPort.attached).toEqual([dockviewHarness.api]),
    );
    expect(layoutPort.added.map(({ instance }) => instance.type)).toEqual([
      'news-source',
      'evidence-claims',
      'guided-interpretation',
      'primary-security',
      'related-companies',
      'wider-market',
    ]);
    expect(screen.getByTestId('dockview-vue')).toHaveAttribute(
      'data-floating-bounds',
      'boundedWithinViewport',
    );
  });

  it('restores a valid saved layout without also adding defaults', async () => {
    const DockWorkspace = getComponent('DockWorkspace');
    expect(DockWorkspace).toBeDefined();
    const layoutPort = createLayoutPort();
    const savedLayout = { grid: {}, panels: {} };

    render(DockWorkspace!, { props: { layoutPort, savedLayout } });

    await waitFor(() =>
      expect(layoutPort.restoredLayouts).toEqual([savedLayout]),
    );
    expect(layoutPort.added).toEqual([]);
  });

  it('falls back to deterministic defaults when saved restoration is invalid', async () => {
    const DockWorkspace = getComponent('DockWorkspace');
    expect(DockWorkspace).toBeDefined();
    const layoutPort = createLayoutPort({
      restoreError: new Error('Invalid saved layout'),
    });

    render(DockWorkspace!, {
      props: { layoutPort, savedLayout: { invalid: true } },
    });

    await waitFor(() => expect(layoutPort.added).toHaveLength(6));
  });
});

describe('WorkspacePanelHost', () => {
  it.each([
    ['news-source', 'Fictional news source'],
    ['evidence-claims', 'Evidence and extracted claims'],
    ['primary-security', 'Primary fictional security'],
    ['related-companies', 'Related fictional companies'],
    ['wider-market', 'Wider fictional market'],
    ['guided-interpretation', 'Guided interpretation'],
  ] as const)('mounts the real %s panel from the registry', (type, heading) => {
    const Host = getComponent('WorkspacePanelHost');
    expect(Host).toBeDefined();

    const result = renderWithWorkspace(Host!, dockviewComponentProps(type));

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
    result.unmount();
  });

  it('routes a semantic panel event into the TradeMaker-owned state', async () => {
    const Host = getComponent('WorkspacePanelHost');
    expect(Host).toBeDefined();
    const { store } = renderWithWorkspace(
      Host!,
      dockviewComponentProps('evidence-claims'),
    );
    const firstClaim = sampleStory.extractedClaims[0]!;

    await fireEvent.click(
      screen.getByRole('button', {
        name: `Review claim: ${firstClaim.statement}`,
      }),
    );

    expect(store.getPanelState('panel-evidence-claims')).toEqual({
      selectedClaimId: firstClaim.id,
    });
  });
});

describe('WorkspacePanelTab', () => {
  it('shows a readable title and routes every safe action through the adapter', async () => {
    const Tab = getComponent('WorkspacePanelTab');
    const adapterModule = Object.values(adapterModules)[0];
    expect(Tab).toBeDefined();
    expect(adapterModule).toBeDefined();
    const layoutPort = createLayoutPort();
    const Shell = defineComponent({
      setup() {
        adapterModule!.provideWorkspaceLayout(layoutPort);
        return () => h(Tab!, dockviewComponentProps('news-source'));
      },
    });
    render(Shell);

    expect(screen.getByText('News source')).toBeVisible();
    await fireEvent.click(
      screen.getByRole('button', { name: 'Maximise News source' }),
    );
    await fireEvent.click(
      screen.getByRole('button', { name: 'Restore News source size' }),
    );
    await fireEvent.click(
      screen.getByRole('button', { name: 'Float News source' }),
    );

    expect(layoutPort.maximized).toEqual(['panel-news-source']);
    expect(layoutPort.restoredMaximized).toEqual(['panel-news-source']);
    expect(layoutPort.floated).toEqual(['panel-news-source']);
  });
});
