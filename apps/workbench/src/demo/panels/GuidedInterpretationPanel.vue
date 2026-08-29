<script setup lang="ts">
/* eslint-disable no-undef -- The Babel Vue parser treats type-only macro fields as runtime identifiers. */
import { Lightbulb, TriangleAlert } from '@lucide/vue';
import { computed } from 'vue';

import SimulatedDataNotice from '../components/SimulatedDataNotice.vue';
import type {
  GuidedInterpretation,
  GuidedInterpretationSection,
} from '../types';

const props = defineProps<{
  interpretation: GuidedInterpretation | null;
  activeSection: GuidedInterpretationSection;
}>();

defineEmits<{
  'select-section': [section: GuidedInterpretationSection];
}>();

const sections: Array<{
  id: GuidedInterpretationSection;
  label: string;
}> = [
  { id: 'evidence', label: 'Evidence' },
  { id: 'uncertainty', label: 'Uncertainty' },
  { id: 'research', label: 'Research next' },
];

const activeItems = computed(() => {
  if (!props.interpretation) return [];

  if (props.activeSection === 'evidence') {
    return props.interpretation.supportingEvidence;
  }

  if (props.activeSection === 'uncertainty') {
    return props.interpretation.uncertainties;
  }

  return props.interpretation.questionsToResearchNext;
});
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <article class="card card-border h-full overflow-auto bg-base-100">
    <div class="card-body gap-4 p-4 sm:p-5">
      <header class="flex items-start gap-3">
        <span
          class="grid size-9 shrink-0 place-items-center rounded-field bg-base-200 text-base-content/70"
        >
          <Lightbulb :size="18" :stroke-width="1.8" aria-hidden="true" />
        </span>
        <div>
          <h2 class="card-title text-base">Guided interpretation</h2>
          <p class="text-xs text-base-content/60">
            A novice-friendly reading that keeps facts and open questions apart.
          </p>
        </div>
      </header>

      <SimulatedDataNotice />

      <section
        v-if="interpretation"
        class="space-y-4"
        aria-label="Interpretation guide"
      >
        <p class="text-base font-medium leading-relaxed">
          {{ interpretation.plainEnglishSummary }}
        </p>

        <div
          role="tablist"
          class="tabs tabs-box tabs-sm"
          aria-label="Interpretation sections"
        >
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            role="tab"
            class="tab"
            :class="{ 'tab-active': activeSection === section.id }"
            :aria-selected="activeSection === section.id"
            @click="$emit('select-section', section.id)"
          >
            {{ section.label }}
          </button>
        </div>

        <ul class="grid gap-2" :aria-label="`${activeSection} points`">
          <li
            v-for="item in activeItems"
            :key="item"
            class="rounded-box border border-base-300 bg-base-200/40 p-3 text-sm leading-relaxed"
          >
            {{ item }}
          </li>
        </ul>

        <div
          class="flex items-start gap-2 rounded-box border border-warning/40 bg-warning/10 p-3"
        >
          <TriangleAlert
            :size="18"
            :stroke-width="1.8"
            class="mt-0.5 shrink-0 text-warning"
            aria-hidden="true"
          />
          <div>
            <p class="text-sm font-semibold">Not trading advice</p>
            <p class="mt-1 text-xs leading-relaxed text-base-content/70">
              This guide organises a fictional scenario. It does not tell you to
              buy, sell, or hold any investment.
            </p>
          </div>
        </div>
      </section>

      <p
        v-else
        class="rounded-box border border-dashed border-base-300 p-4 text-sm text-base-content/60"
      >
        No guided interpretation is available.
      </p>
    </div>
  </article>
</template>
