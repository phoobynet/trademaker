import { reactive } from 'vue';

import {
  cloneSerializableRecord,
  type MinimizedPanelRecord,
  type PanelPlacement,
  type SerializablePanelState,
  type WorkspacePanelInstance,
} from './types';

export interface WorkspaceStore {
  readonly panelStateByInstanceId: Record<string, SerializablePanelState>;
  readonly minimizedPanels: MinimizedPanelRecord[];
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

export function createWorkspaceStore(): WorkspaceStore {
  const panelStateByInstanceId = reactive<
    Record<string, SerializablePanelState>
  >({});
  const minimizedPanels = reactive<MinimizedPanelRecord[]>([]);

  return {
    panelStateByInstanceId,
    minimizedPanels,

    openPanel(instance, initialState) {
      if (panelStateByInstanceId[instance.instanceId] !== undefined) {
        throw new Error(
          `Panel instance "${instance.instanceId}" already has state.`,
        );
      }
      panelStateByInstanceId[instance.instanceId] =
        cloneSerializableRecord(initialState);
    },

    getPanelState(instanceId) {
      return panelStateByInstanceId[instanceId];
    },

    replacePanelState(instanceId, state) {
      if (panelStateByInstanceId[instanceId] === undefined) return false;

      const ownedState = cloneSerializableRecord(state);
      panelStateByInstanceId[instanceId] = ownedState;
      return true;
    },

    minimizePanel(instance, restorePlacement) {
      if (panelStateByInstanceId[instance.instanceId] === undefined) {
        throw new Error(
          `Cannot minimise panel instance "${instance.instanceId}" without state.`,
        );
      }

      const existing = minimizedPanels.find(
        (record) => record.instanceId === instance.instanceId,
      );
      if (existing) return existing;

      const minimized: MinimizedPanelRecord = {
        instanceId: instance.instanceId,
        type: instance.type,
        title: instance.title,
        parameters: cloneSerializableRecord(instance.parameters),
        restorePlacement: clonePlacement(restorePlacement),
      };
      minimizedPanels.push(minimized);
      return minimizedPanels[minimizedPanels.length - 1]!;
    },

    restorePanel(instanceId) {
      const index = minimizedPanels.findIndex(
        (record) => record.instanceId === instanceId,
      );
      if (index < 0) return undefined;

      return minimizedPanels.splice(index, 1)[0];
    },

    closePanel(instanceId) {
      delete panelStateByInstanceId[instanceId];
      for (let index = minimizedPanels.length - 1; index >= 0; index -= 1) {
        if (minimizedPanels[index]?.instanceId === instanceId) {
          minimizedPanels.splice(index, 1);
        }
      }
    },

    reset() {
      for (const instanceId of Object.keys(panelStateByInstanceId)) {
        delete panelStateByInstanceId[instanceId];
      }
      minimizedPanels.splice(0);
    },
  };
}

function clonePlacement(placement: PanelPlacement): PanelPlacement {
  if (placement.kind === 'default') return { kind: 'default' };

  return {
    kind: 'relative',
    referenceInstanceId: placement.referenceInstanceId,
    position: placement.position,
  };
}
