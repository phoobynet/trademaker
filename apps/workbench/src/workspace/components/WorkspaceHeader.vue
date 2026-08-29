<script setup lang="ts">
import {
  ChartCandlestick,
  ChevronDown,
  FlaskConical,
  Moon,
  PanelsTopLeft,
  RotateCcw,
  Sun,
} from '@lucide/vue';
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line, vue/html-self-closing -- Prettier owns Vue markup formatting. -->
  <header
    aria-label="Workspace controls"
    class="navbar min-h-0 flex-wrap gap-2 border-b border-base-300 bg-base-100 px-3 py-2 shadow-sm"
  >
    <div
      class="navbar-start w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:flex-1"
    >
      <div class="flex shrink-0 items-center gap-2" aria-label="TradeMaker">
        <span
          class="grid size-8 place-items-center rounded-field bg-neutral text-neutral-content"
        >
          <ChartCandlestick :size="17" :stroke-width="1.8" aria-hidden="true" />
        </span>
        <span class="text-sm font-semibold tracking-tight sm:text-base">
          TradeMaker
        </span>
      </div>

      <span
        role="status"
        class="badge badge-soft badge-warning badge-sm shrink-0 gap-1"
      >
        <FlaskConical :size="13" :stroke-width="2" aria-hidden="true" />
        Simulated demonstration
      </span>
    </div>

    <div
      class="navbar-end w-full grow flex-wrap justify-end gap-1 sm:w-auto sm:gap-2"
    >
      <div class="tooltip tooltip-bottom" data-tip="Manage workspace panels">
        <button
          type="button"
          class="btn btn-ghost btn-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          popovertarget="workspace-panel-menu"
          style="anchor-name: --workspace-panel-menu"
        >
          <PanelsTopLeft :size="16" :stroke-width="1.8" aria-hidden="true" />
          Panels
          <ChevronDown :size="14" :stroke-width="1.8" aria-hidden="true" />
        </button>
      </div>

      <ul
        id="workspace-panel-menu"
        class="dropdown dropdown-end menu menu-sm z-10 mt-2 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
        popover
        style="position-anchor: --workspace-panel-menu"
      >
        <li class="menu-title">Panel catalog</li>
        <li>
          <span class="text-base-content/60">No panels available yet</span>
        </li>
      </ul>

      <div class="tooltip tooltip-bottom" data-tip="Restore the default layout">
        <button
          type="button"
          aria-label="Reset workspace"
          class="btn btn-ghost btn-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <RotateCcw :size="16" :stroke-width="1.8" aria-hidden="true" />
          <span class="hidden sm:inline">Reset workspace</span>
        </button>
      </div>

      <label
        class="tooltip tooltip-bottom flex h-8 cursor-pointer items-center gap-1 rounded-field px-1 text-base-content/70"
        data-tip="Switch between light and dark themes"
      >
        <Sun :size="14" :stroke-width="1.8" aria-hidden="true" />
        <input
          type="checkbox"
          value="dark"
          aria-label="Use dark theme"
          class="theme-controller toggle toggle-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
        <Moon :size="14" :stroke-width="1.8" aria-hidden="true" />
      </label>
    </div>
  </header>
</template>
