/* eslint-disable vue/one-component-per-file -- The injection contract requires a local provider and consumer harness. */
import { mount } from '@vue/test-utils';
import { defineComponent, h, isReactive } from 'vue';
import { describe, expect, it } from 'vitest';

import { createDefaultPanelState, createPanelInstance } from './panelRegistry';
import type {
  MinimizedPanelRecord,
  PanelPlacement,
  SerializablePanelState,
  WorkspacePanelInstance,
} from './types';

interface WorkspaceStore {
  panelStateByInstanceId: Record<string, SerializablePanelState>;
  minimizedPanels: MinimizedPanelRecord[];
  openPanel(
    instance: WorkspacePanelInstance,
    initialState: SerializablePanelState,
  ): void;
  getPanelState(instanceId: string): SerializablePanelState | undefined;
  replacePanelState(instanceId: string, state: SerializablePanelState): boolean;
  minimizePanel(
    instance: WorkspacePanelInstance,
    restorePlacement: PanelPlacement,
  ): MinimizedPanelRecord;
  restorePanel(instanceId: string): MinimizedPanelRecord | undefined;
  closePanel(instanceId: string): void;
  reset(): void;
}

interface StoreModule {
  createWorkspaceStore(): WorkspaceStore;
}

interface InjectionModule {
  provideWorkspace(store?: WorkspaceStore): WorkspaceStore;
  useWorkspace(): WorkspaceStore;
}

const storeModules = import.meta.glob<StoreModule>('./workspaceStore.ts', {
  eager: true,
});
const storeModule = Object.values(storeModules)[0];

const injectionModules = import.meta.glob<InjectionModule>(
  './useWorkspace.ts',
  {
    eager: true,
  },
);
const injectionModule = Object.values(injectionModules)[0];

function createOpenClaimsPanel() {
  const store = storeModule!.createWorkspaceStore();
  const instance = createPanelInstance('evidence-claims');
  store.openPanel(instance, createDefaultPanelState(instance.type));
  return { instance, store };
}

describe('workspace state lifecycle', () => {
  it('keeps a selected claim while the panel is minimised and restored', () => {
    expect(storeModule).toBeDefined();
    const { instance, store } = createOpenClaimsPanel();
    store.replacePanelState(instance.instanceId, {
      selectedClaimId: 'claim-customer-interest',
    });
    const selectedState = store.getPanelState(instance.instanceId);

    store.minimizePanel(instance, {
      kind: 'relative',
      referenceInstanceId: 'panel-news-source',
      position: 'right',
    });
    const restored = store.restorePanel(instance.instanceId);

    expect(restored?.instanceId).toBe(instance.instanceId);
    expect(store.getPanelState(instance.instanceId)).toBe(selectedState);
    expect(store.getPanelState(instance.instanceId)).toEqual({
      selectedClaimId: 'claim-customer-interest',
    });
    expect(store.minimizedPanels).toHaveLength(0);
  });

  it('clears a minimised instance on close and reopens with freshly owned defaults', () => {
    expect(storeModule).toBeDefined();
    const { instance, store } = createOpenClaimsPanel();
    store.replacePanelState(instance.instanceId, {
      selectedClaimId: 'claim-trial-timing',
    });
    const selectedState = store.getPanelState(instance.instanceId);
    store.minimizePanel(instance, {
      kind: 'relative',
      referenceInstanceId: 'panel-news-source',
      position: 'right',
    });
    expect(store.minimizedPanels).toHaveLength(1);

    store.closePanel(instance.instanceId);

    expect(store.getPanelState(instance.instanceId)).toBeUndefined();
    expect(store.minimizedPanels).toEqual([]);

    const reopened = createPanelInstance('evidence-claims');
    store.openPanel(reopened, createDefaultPanelState(reopened.type));

    expect(reopened.instanceId).toBe(instance.instanceId);
    expect(reopened.parameters).toEqual(instance.parameters);
    expect(reopened.parameters).not.toBe(instance.parameters);
    expect(store.getPanelState(reopened.instanceId)).toEqual({
      selectedClaimId: null,
    });
    expect(store.getPanelState(reopened.instanceId)).not.toBe(selectedState);
  });

  it('rejects duplicate live instance IDs without replacing existing state', () => {
    expect(storeModule).toBeDefined();
    const { instance, store } = createOpenClaimsPanel();
    const originalState = store.getPanelState(instance.instanceId);

    expect(() =>
      store.openPanel(instance, { selectedClaimId: 'claim-yield-risk' }),
    ).toThrow(/already has state/i);
    expect(store.getPanelState(instance.instanceId)).toBe(originalState);
    expect(Object.keys(store.panelStateByInstanceId)).toEqual([
      instance.instanceId,
    ]);
  });

  it('owns cloned serializable state and rejects values JSON cannot preserve', () => {
    expect(storeModule).toBeDefined();
    const store = storeModule!.createWorkspaceStore();
    const instance = createPanelInstance('news-source');
    const initialState: SerializablePanelState = {
      filters: { confidence: ['high'] },
    };
    store.openPanel(instance, initialState);

    const filters = initialState.filters as {
      confidence: SerializablePanelState[keyof SerializablePanelState][];
    };
    filters.confidence.push('low');

    expect(store.getPanelState(instance.instanceId)).toEqual({
      filters: { confidence: ['high'] },
    });
    expect(() =>
      store.replacePanelState(instance.instanceId, {
        invalid: new Date() as never,
      }),
    ).toThrow(/plain object/i);
    expect(store.getPanelState(instance.instanceId)).toEqual({
      filters: { confidence: ['high'] },
    });
  });

  it('creates a complete taskbar record with TradeMaker restore placement', () => {
    expect(storeModule).toBeDefined();
    const { instance, store } = createOpenClaimsPanel();
    const placement: PanelPlacement = {
      kind: 'relative',
      referenceInstanceId: 'panel-news-source',
      position: 'right',
    };

    const minimized = store.minimizePanel(instance, placement);

    expect(minimized).toEqual({
      instanceId: 'panel-evidence-claims',
      title: 'Evidence and claims',
      type: 'evidence-claims',
      parameters: { storyId: 'fictional-aurora-circuits-nimbus-x' },
      restorePlacement: placement,
    });
    expect(store.minimizedPanels[0]).toEqual(minimized);
    expect(store.minimizedPanels[0]?.parameters).not.toBe(instance.parameters);
    expect(store.getPanelState(instance.instanceId)).toEqual({
      selectedClaimId: null,
    });
  });

  it('exposes reactive records and resets both lifecycle collections', () => {
    expect(storeModule).toBeDefined();
    const { instance, store } = createOpenClaimsPanel();
    store.minimizePanel(instance, { kind: 'default' });

    expect(isReactive(store.panelStateByInstanceId)).toBe(true);
    expect(isReactive(store.minimizedPanels)).toBe(true);

    store.reset();

    expect(store.panelStateByInstanceId).toEqual({});
    expect(store.minimizedPanels).toEqual([]);
  });
});

describe('workspace injection boundary', () => {
  it('provides one store instance to descendants at the shell boundary', () => {
    expect(storeModule).toBeDefined();
    expect(injectionModule).toBeDefined();
    const store = storeModule!.createWorkspaceStore();
    let receivedStore: WorkspaceStore | undefined;

    const Child = defineComponent({
      setup() {
        receivedStore = injectionModule!.useWorkspace();
        return () => h('span', 'Workspace child');
      },
    });
    const Shell = defineComponent({
      setup() {
        injectionModule!.provideWorkspace(store);
        return () => h(Child);
      },
    });

    const wrapper = mount(Shell);
    expect(receivedStore).toBe(store);
    wrapper.unmount();
  });

  it('fails readably when a mounted consumer has no shell provider', () => {
    expect(injectionModule).toBeDefined();

    const UnprovidedConsumer = defineComponent({
      setup() {
        injectionModule!.useWorkspace();
        return () => h('span', 'Unreachable workspace child');
      },
    });

    expect(() => mount(UnprovidedConsumer)).toThrow(
      'No TradeMaker workspace store was provided by the workspace shell.',
    );
  });
});
