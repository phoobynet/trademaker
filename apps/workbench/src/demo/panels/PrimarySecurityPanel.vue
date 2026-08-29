<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { Building2, ChevronDown, ChevronUp } from '@lucide/vue';

import SimulatedDataNotice from '../components/SimulatedDataNotice.vue';
import type { SecuritySnapshot } from '../types';

defineProps<{
  security: SecuritySnapshot | null;
  expandedMetricId: string | null;
}>();

defineEmits<{
  'toggle-metric': [metricId: string];
}>();
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/html-indent, vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <article class="card card-border h-full overflow-auto bg-base-100">
    <div class="card-body gap-4 p-4 sm:p-5">
      <header class="flex items-start gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-field bg-base-200 text-base-content/70"
        >
          <Building2 :size="18" :stroke-width="1.8" aria-hidden="true" />
        </span>
        <div>
          <h2 class="card-title text-base">Primary fictional security</h2>
          <p class="text-xs text-base-content/60">
            The company most directly connected to the demonstration story.
          </p>
        </div>
      </header>

      <SimulatedDataNotice />

      <section v-if="security" class="space-y-4" aria-label="Security summary">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold">{{ security.companyName }}</h3>
            <span class="badge badge-ghost badge-sm">{{
              security.ticker
            }}</span>
          </div>
          <p class="mt-1 text-sm text-base-content/70">
            {{ security.roleInStory }}
          </p>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <div class="rounded-box border border-base-300 p-3">
            <p class="text-xs font-medium text-base-content/60">Share price</p>
            <p class="mt-1 text-xl font-semibold">
              {{ security.simulatedPrice }}
            </p>
          </div>
          <div class="rounded-box border border-base-300 p-3">
            <p class="text-xs font-medium text-base-content/60">
              One-session change
            </p>
            <p class="mt-1 text-xl font-semibold">
              {{ security.simulatedMove }}
            </p>
          </div>
        </div>

        <p class="text-sm leading-relaxed text-base-content/70">
          {{ security.moveExplanation }}
        </p>

        <div class="grid gap-2">
          <section
            v-for="metric in security.metrics"
            :key="metric.id"
            class="rounded-box border border-base-300 p-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 class="text-sm font-medium">
                  {{ metric.label }}
                  <span v-if="metric.abbreviation"
                    >({{ metric.abbreviation }})</span
                  >
                </h3>
                <p class="mt-1 text-base font-semibold">
                  {{ metric.simulatedValue }}
                </p>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-ghost"
                :aria-expanded="expandedMetricId === metric.id"
                @click="$emit('toggle-metric', metric.id)"
              >
                <ChevronUp
                  v-if="expandedMetricId === metric.id"
                  :size="15"
                  aria-hidden="true"
                />
                <ChevronDown v-else :size="15" aria-hidden="true" />
                Explain {{ metric.abbreviation ?? metric.label }}
              </button>
            </div>
            <p
              v-if="expandedMetricId === metric.id"
              class="mt-3 border-t border-base-300 pt-3 text-sm leading-relaxed text-base-content/70"
            >
              {{ metric.plainEnglishMeaning }}
            </p>
          </section>
        </div>
      </section>

      <p
        v-else
        class="rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/60"
      >
        No fictional primary security is available.
      </p>
    </div>
  </article>
</template>
