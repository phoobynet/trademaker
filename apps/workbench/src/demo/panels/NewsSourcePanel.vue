<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { ChevronDown, ChevronUp, Newspaper } from '@lucide/vue';

import SimulatedDataNotice from '../components/SimulatedDataNotice.vue';
import type { NewsSource } from '../types';

defineProps<{
  source: NewsSource | null;
  showSourceDetails: boolean;
}>();

defineEmits<{
  'toggle-source-details': [show: boolean];
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
          <Newspaper :size="18" :stroke-width="1.8" aria-hidden="true" />
        </span>
        <div>
          <h2 class="card-title text-base">Fictional news source</h2>
          <p class="text-xs text-base-content/60">
            Start with what the made-up article actually says.
          </p>
        </div>
      </header>

      <SimulatedDataNotice />

      <section v-if="source" class="space-y-3" aria-label="Source summary">
        <div>
          <span class="badge badge-ghost badge-sm">Fictional publication</span>
          <h3 class="mt-2 text-lg font-semibold leading-snug">
            {{ source.headline }}
          </h3>
          <p class="mt-1 text-sm text-base-content/70">
            {{ source.publicationName }} · {{ source.byline }}
          </p>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-outline w-fit"
          :aria-expanded="showSourceDetails"
          @click="$emit('toggle-source-details', !showSourceDetails)"
        >
          <ChevronUp v-if="showSourceDetails" :size="16" aria-hidden="true" />
          <ChevronDown v-else :size="16" aria-hidden="true" />
          {{
            showSourceDetails ? 'Hide source details' : 'Show source details'
          }}
        </button>

        <dl
          v-if="showSourceDetails"
          class="grid gap-3 rounded-box border border-base-300 bg-base-200/40 p-3 text-sm"
        >
          <div>
            <dt class="font-medium">Demonstration timing</dt>
            <dd class="mt-1 text-base-content/70">
              {{ source.publishedLabel }}
            </dd>
          </div>
          <div>
            <dt class="font-medium">What this source is</dt>
            <dd class="mt-1 text-base-content/70">
              {{ source.sourceDescription }}
            </dd>
          </div>
        </dl>
      </section>

      <p
        v-else
        class="rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/60"
      >
        No fictional source is available.
      </p>
    </div>
  </article>
</template>
