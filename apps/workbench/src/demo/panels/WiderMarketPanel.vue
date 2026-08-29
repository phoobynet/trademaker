<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { ChartNoAxesCombined, ChevronDown, ChevronUp } from '@lucide/vue';

import SimulatedDataNotice from '../components/SimulatedDataNotice.vue';
import type { MarketContext } from '../types';

defineProps<{
  market: MarketContext | null;
  expandedObservationId: string | null;
}>();

defineEmits<{
  'toggle-observation': [observationId: string];
}>();
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <article class="card card-border h-full overflow-auto bg-base-100">
    <div class="card-body gap-4 p-4 sm:p-5">
      <header class="flex items-start gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-field bg-base-200 text-base-content/70"
        >
          <ChartNoAxesCombined
            :size="18"
            :stroke-width="1.8"
            aria-hidden="true"
          />
        </span>
        <div>
          <h2 class="card-title text-base">Wider fictional market</h2>
          <p class="text-xs text-base-content/60">
            Compare a company move with its sector and the broader market.
          </p>
        </div>
      </header>

      <SimulatedDataNotice />

      <section v-if="market" class="space-y-4" aria-label="Market comparison">
        <div class="flex flex-wrap gap-2">
          <span class="badge badge-ghost badge-sm">{{
            market.sectorName
          }}</span>
          <span class="badge badge-ghost badge-sm">{{
            market.broadMarketName
          }}</span>
        </div>

        <p class="text-sm leading-relaxed text-base-content/70">
          {{ market.contextSummary }}
        </p>

        <div class="grid gap-3 sm:grid-cols-2">
          <section
            v-for="observation in market.observations"
            :key="observation.id"
            class="rounded-box border border-base-300 p-3"
          >
            <h3 class="text-sm font-medium">{{ observation.label }}</h3>
            <p class="mt-1 text-lg font-semibold">
              {{ observation.simulatedMove }}
            </p>
            <button
              type="button"
              class="btn btn-sm btn-ghost mt-2"
              :aria-expanded="expandedObservationId === observation.id"
              :aria-label="`Explain ${observation.label}`"
              @click="$emit('toggle-observation', observation.id)"
            >
              <ChevronUp
                v-if="expandedObservationId === observation.id"
                :size="15"
                aria-hidden="true"
              />
              <ChevronDown v-else :size="15" aria-hidden="true" />
              {{
                expandedObservationId === observation.id
                  ? 'Hide explanation'
                  : 'Explain comparison'
              }}
            </button>
            <p
              v-if="expandedObservationId === observation.id"
              class="mt-3 border-t border-base-300 pt-3 text-sm leading-relaxed text-base-content/70"
            >
              {{ observation.plainEnglishMeaning }}
            </p>
          </section>
        </div>
      </section>

      <p
        v-else
        class="rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/60"
      >
        No fictional wider-market context is available.
      </p>
    </div>
  </article>
</template>
