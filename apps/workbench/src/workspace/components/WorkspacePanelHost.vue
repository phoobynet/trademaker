<script setup lang="ts">
/* eslint-disable no-undef, no-unused-vars -- The Babel Vue parser treats TypeScript-only Vue setup fields as runtime identifiers. */
import { computed } from 'vue';

import { sampleStory } from '../../demo/sampleStory';
import type { GuidedInterpretationSection } from '../../demo/types';
import { createDefaultPanelState, getPanelDefinition } from '../panelRegistry';
import type { WorkspaceDockviewComponentParameters } from '../dockview/DockviewWorkspaceAdapter';
import type {
  SerializablePanelState,
  SerializableValue,
  WorkspacePanelInstance,
} from '../types';
import { useWorkspace } from '../useWorkspace';

const props = defineProps<{
  params: WorkspaceDockviewComponentParameters;
}>();
const panelParameters = props.params.params;

if (panelParameters.panelParameters.storyId !== sampleStory.id) {
  throw new Error(
    `No simulated story is available for panel "${panelParameters.instanceId}".`,
  );
}

const definition = getPanelDefinition(panelParameters.panelType);
const store = useWorkspace();
const instance: WorkspacePanelInstance = {
  instanceId: panelParameters.instanceId,
  parameters: panelParameters.panelParameters,
  title: panelParameters.title,
  type: panelParameters.panelType,
};

if (!store.getPanelState(instance.instanceId)) {
  store.openPanel(instance, createDefaultPanelState(instance.type));
}

const panelBindings = computed<Record<string, unknown>>(() => {
  const state = currentState();

  switch (instance.type) {
    case 'news-source':
      return {
        onToggleSourceDetails: (show: boolean) =>
          replaceState({ showSourceDetails: show }),
        showSourceDetails: state.showSourceDetails === true,
        source: sampleStory.source,
      };
    case 'evidence-claims':
      return {
        claims: sampleStory.extractedClaims,
        onSelectClaim: (claimId: string) =>
          replaceState({ selectedClaimId: claimId }),
        selectedClaimId: nullableString(state.selectedClaimId),
      };
    case 'primary-security':
      return {
        expandedMetricId: nullableString(state.expandedMetricId),
        onToggleMetric: (metricId: string) =>
          replaceState({
            expandedMetricId: toggleValue(state, 'expandedMetricId', metricId),
          }),
        security: sampleStory.primarySecurity,
      };
    case 'related-companies':
      return {
        companies: sampleStory.relatedCompanies,
        onSelectCompany: (ticker: string) =>
          replaceState({
            selectedTicker: toggleValue(state, 'selectedTicker', ticker),
          }),
        selectedTicker: nullableString(state.selectedTicker),
      };
    case 'wider-market':
      return {
        expandedObservationId: nullableString(state.expandedObservationId),
        market: sampleStory.widerMarket,
        onToggleObservation: (observationId: string) =>
          replaceState({
            expandedObservationId: toggleValue(
              state,
              'expandedObservationId',
              observationId,
            ),
          }),
      };
    case 'guided-interpretation':
      return {
        activeSection: guidedSection(state.activeSection),
        interpretation: sampleStory.guidedInterpretation,
        onSelectSection: (section: GuidedInterpretationSection) =>
          replaceState({ activeSection: section }),
      };
  }

  throw new Error(`No panel bindings exist for "${instance.type}".`);
});

function currentState(): SerializablePanelState {
  const state = store.getPanelState(instance.instanceId);
  if (!state) {
    throw new Error(
      `Workspace panel "${instance.instanceId}" has no TradeMaker state.`,
    );
  }
  return state;
}

function replaceState(patch: SerializablePanelState): void {
  const replaced = store.replacePanelState(instance.instanceId, {
    ...currentState(),
    ...patch,
  });
  if (!replaced) {
    throw new Error(
      `Workspace panel "${instance.instanceId}" cannot update missing state.`,
    );
  }
}

function nullableString(value: SerializableValue | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

function toggleValue(
  state: SerializablePanelState,
  key: string,
  nextValue: string,
): string | null {
  return state[key] === nextValue ? null : nextValue;
}

function guidedSection(
  value: SerializableValue | undefined,
): GuidedInterpretationSection {
  return value === 'uncertainty' || value === 'research' ? value : 'evidence';
}
</script>

<template>
  <!-- eslint-disable vue/max-attributes-per-line -- Prettier owns Vue markup formatting. -->
  <div class="h-full min-h-0 overflow-hidden">
    <component :is="definition.component" v-bind="panelBindings" />
  </div>
</template>
