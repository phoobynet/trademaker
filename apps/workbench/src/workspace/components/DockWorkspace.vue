<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { DockviewVue } from 'dockview-vue';

import { panelRegistry } from '../panelRegistry';
import {
  asWorkspaceDockviewComponent,
  DockviewWorkspaceAdapter,
  provideWorkspaceLayout,
  type SerializedDockview,
  type WorkspaceDockviewVueComponent,
  type WorkspaceLayoutPort,
} from '../dockview/DockviewWorkspaceAdapter';
import { createDefaultLayout } from '../dockview/defaultLayout';
import { provideWorkspace } from '../useWorkspace';
import WorkspacePanelHost from './WorkspacePanelHost.vue';
import WorkspacePanelTab from './WorkspacePanelTab.vue';

const props = defineProps<{
  layoutPort?: WorkspaceLayoutPort;
  savedLayout?: SerializedDockview | null;
}>();

const emit = defineEmits<{
  'layout-restore-failed': [error: Error];
}>();

const layoutPort = props.layoutPort ?? new DockviewWorkspaceAdapter();
const panelHostComponent = asWorkspaceDockviewComponent(WorkspacePanelHost);
const components = Object.fromEntries(
  panelRegistry.map(({ type }) => [type, panelHostComponent]),
) as Record<string, WorkspaceDockviewVueComponent>;
const tabComponents: Record<string, WorkspaceDockviewVueComponent> = {
  'workspace-panel-tab': asWorkspaceDockviewComponent(WorkspacePanelTab),
};
let initialized = false;

provideWorkspace();
provideWorkspaceLayout(layoutPort);

function onReady(event: {
  api: Parameters<WorkspaceLayoutPort['attach']>[0];
}): void {
  if (initialized) return;
  initialized = true;
  layoutPort.attach(event.api);

  if (props.savedLayout) {
    try {
      layoutPort.restore(props.savedLayout);
      return;
    } catch (error) {
      emit(
        'layout-restore-failed',
        error instanceof Error ? error : new Error('Saved layout failed.'),
      );
    }
  }

  for (const instruction of createDefaultLayout()) {
    layoutPort.addPanel(instruction.instance, instruction.placement);
  }
}
</script>

<template>
  <!-- Dockview shows no tab context menu when getTabContextMenuItems is omitted.
       The registered tab supplies only TradeMaker's bounded in-page actions. -->
  <div
    data-testid="dock-workspace"
    class="h-full min-h-0 w-full overflow-hidden bg-base-100 text-base-content"
  >
    <DockviewVue
      class="h-full min-h-0 w-full"
      :components="components"
      :tab-components="tabComponents"
      default-tab-component="workspace-panel-tab"
      floating-group-bounds="boundedWithinViewport"
      @ready="onReady"
    />
  </div>
</template>
