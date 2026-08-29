<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { ListChecks } from '@lucide/vue';
import { computed } from 'vue';

import SimulatedDataNotice from '../components/SimulatedDataNotice.vue';
import type { ExtractedClaim } from '../types';

const props = defineProps<{
  claims: ExtractedClaim[];
  selectedClaimId: string | null;
}>();

defineEmits<{
  'select-claim': [claimId: string];
}>();

const selectedClaim = computed(() =>
  props.claims.find((claim) => claim.id === props.selectedClaimId),
);
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <article class="card card-border h-full overflow-auto bg-base-100">
    <div class="card-body gap-4 p-4 sm:p-5">
      <header class="flex items-start gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-field bg-base-200 text-base-content/70"
        >
          <ListChecks :size="18" :stroke-width="1.8" aria-hidden="true" />
        </span>
        <div>
          <h2 class="card-title text-base">Evidence and extracted claims</h2>
          <p class="text-xs text-base-content/60">
            Separate quoted support from the conclusion drawn from it.
          </p>
        </div>
      </header>

      <SimulatedDataNotice />

      <p class="text-sm leading-relaxed text-base-content/70">
        Confidence describes how directly the fictional source supports a claim;
        it does not predict whether a share price will rise.
      </p>

      <div v-if="claims.length" class="grid gap-2">
        <button
          v-for="claim in claims"
          :key="claim.id"
          type="button"
          class="btn h-auto min-h-10 justify-start whitespace-normal px-3 py-2 text-left"
          :class="{ 'btn-active': claim.id === selectedClaimId }"
          :aria-pressed="claim.id === selectedClaimId"
          :aria-label="`Review claim: ${claim.statement}`"
          @click="$emit('select-claim', claim.id)"
        >
          <span class="min-w-0 flex-1">{{ claim.statement }}</span>
          <span class="badge badge-ghost badge-sm shrink-0 capitalize">
            {{ claim.confidence }} confidence
          </span>
        </button>
      </div>

      <section
        v-if="selectedClaim"
        class="grid gap-3 rounded-box border border-base-300 bg-base-200/40 p-3"
        aria-label="Selected claim evidence"
      >
        <div>
          <h3
            class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
          >
            Fictional source text
          </h3>
          <blockquote
            class="mt-1 border-l-2 border-primary pl-3 text-sm leading-relaxed"
          >
            {{ selectedClaim.sourceExcerpt }}
          </blockquote>
        </div>
        <div>
          <h3
            class="text-xs font-semibold uppercase tracking-wide text-base-content/60"
          >
            Why it matters
          </h3>
          <p class="mt-1 text-sm leading-relaxed">
            {{ selectedClaim.whyItMatters }}
          </p>
        </div>
      </section>

      <p
        v-if="!claims.length"
        class="rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/60"
      >
        No claims have been extracted yet.
      </p>
    </div>
  </article>
</template>
