<script setup lang="ts">
import DockWorkspace from './DockWorkspace.vue';
</script>

<template>
  <main
    aria-label="TradeMaker workspace"
    class="grid h-dvh grid-rows-[auto_minmax(0,1fr)_var(--workspace-taskbar-height)] overflow-hidden bg-base-200 text-base-content"
  >
    <slot name="header" />

    <section
      aria-label="Docking canvas"
      class="m-2 min-h-0 overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-sm sm:m-3"
    >
      <slot>
        <DockWorkspace />
      </slot>
    </section>

    <section
      aria-label="Workspace taskbar"
      class="flex min-h-0 items-center border-t border-base-300 bg-base-100 px-3 text-xs text-base-content/60"
    >
      <slot name="taskbar">
        <span class="font-medium">Workspace taskbar</span>
      </slot>
    </section>
  </main>
</template>
