<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { Maximize2, Minimize2, PanelTop } from '@lucide/vue';

import {
  useWorkspaceLayout,
  type WorkspaceDockviewComponentParameters,
} from '../dockview/DockviewWorkspaceAdapter';

const props = defineProps<{
  params: WorkspaceDockviewComponentParameters;
}>();
const layoutPort = useWorkspaceLayout();
const panelParameters = props.params.params;
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <div class="flex h-full min-w-0 items-center gap-1 px-2 text-xs">
    <span
      class="min-w-0 flex-1 truncate font-medium"
      :title="panelParameters.title"
    >
      {{ panelParameters.title }}
    </span>
    <div class="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        class="btn btn-ghost btn-square btn-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        :aria-label="`Maximise ${panelParameters.title}`"
        draggable="false"
        @pointerdown.stop
        @click.stop="layoutPort.maximize(panelParameters.instanceId)"
      >
        <Maximize2 :size="13" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-square btn-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        :aria-label="`Restore ${panelParameters.title} size`"
        draggable="false"
        @pointerdown.stop
        @click.stop="layoutPort.restoreMaximized(panelParameters.instanceId)"
      >
        <Minimize2 :size="13" :stroke-width="1.8" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="btn btn-ghost btn-square btn-xs focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
        :aria-label="`Float ${panelParameters.title}`"
        draggable="false"
        @pointerdown.stop
        @click.stop="layoutPort.float(panelParameters.instanceId)"
      >
        <PanelTop :size="13" :stroke-width="1.8" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
