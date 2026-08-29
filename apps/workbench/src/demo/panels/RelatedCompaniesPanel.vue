<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { ChevronDown, ChevronUp, Network } from '@lucide/vue';

import SimulatedDataNotice from '../components/SimulatedDataNotice.vue';
import type { RelatedCompanySnapshot } from '../types';

defineProps<{
  companies: RelatedCompanySnapshot[];
  selectedTicker: string | null;
}>();

defineEmits<{
  'select-company': [ticker: string];
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
          <Network :size="18" :stroke-width="1.8" aria-hidden="true" />
        </span>
        <div>
          <h2 class="card-title text-base">Related fictional companies</h2>
          <p class="text-xs text-base-content/60">
            Possible competitors and suppliers, with the relationship made
            explicit.
          </p>
        </div>
      </header>

      <SimulatedDataNotice />

      <div v-if="companies.length" class="grid gap-3">
        <section
          v-for="company in companies"
          :key="company.ticker"
          class="rounded-box border border-base-300 p-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold">{{ company.companyName }}</h3>
              <p class="mt-1 text-xs text-base-content/60">
                {{ company.ticker }} · {{ company.roleInStory }}
              </p>
              <p class="mt-2 text-sm font-medium">
                {{ company.simulatedPrice }} · {{ company.simulatedMove }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-sm btn-outline"
              :aria-expanded="selectedTicker === company.ticker"
              :aria-label="`Review company: ${company.companyName}`"
              @click="$emit('select-company', company.ticker)"
            >
              <ChevronUp
                v-if="selectedTicker === company.ticker"
                :size="15"
                aria-hidden="true"
              />
              <ChevronDown v-else :size="15" aria-hidden="true" />
              {{
                selectedTicker === company.ticker
                  ? 'Hide context'
                  : 'Review context'
              }}
            </button>
          </div>

          <div
            v-if="selectedTicker === company.ticker"
            class="mt-3 grid gap-3 border-t border-base-300 pt-3 text-sm leading-relaxed"
          >
            <div>
              <h4 class="font-medium">Why it is related</h4>
              <p class="mt-1 text-base-content/70">
                {{ company.relationship }}
              </p>
            </div>
            <div>
              <h4 class="font-medium">How to read the simulated move</h4>
              <p class="mt-1 text-base-content/70">
                {{ company.moveExplanation }}
              </p>
            </div>
            <div v-for="metric in company.metrics" :key="metric.id">
              <h4 class="font-medium">
                {{ metric.label }}
                <span v-if="metric.abbreviation"
                  >({{ metric.abbreviation }})</span
                >
                — {{ metric.simulatedValue }}
              </h4>
              <p class="mt-1 text-base-content/70">
                {{ metric.plainEnglishMeaning }}
              </p>
            </div>
          </div>
        </section>
      </div>

      <p
        v-else
        class="rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/60"
      >
        No related fictional companies are available.
      </p>
    </div>
  </article>
</template>
