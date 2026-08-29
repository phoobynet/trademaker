import { inject, provide, type InjectionKey } from 'vue';

import { createWorkspaceStore, type WorkspaceStore } from './workspaceStore';

const workspaceStoreKey: InjectionKey<WorkspaceStore> = Symbol(
  'TradeMaker workspace store',
);

export function provideWorkspace(
  store: WorkspaceStore = createWorkspaceStore(),
): WorkspaceStore {
  provide(workspaceStoreKey, store);
  return store;
}

export function useWorkspace(): WorkspaceStore {
  const store = inject(workspaceStoreKey, null);
  if (!store) {
    throw new Error(
      'No TradeMaker workspace store was provided by the workspace shell.',
    );
  }
  return store;
}
