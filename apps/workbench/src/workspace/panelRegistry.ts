import EvidenceClaimsPanel from '../demo/panels/EvidenceClaimsPanel.vue';
import GuidedInterpretationPanel from '../demo/panels/GuidedInterpretationPanel.vue';
import NewsSourcePanel from '../demo/panels/NewsSourcePanel.vue';
import PrimarySecurityPanel from '../demo/panels/PrimarySecurityPanel.vue';
import RelatedCompaniesPanel from '../demo/panels/RelatedCompaniesPanel.vue';
import WiderMarketPanel from '../demo/panels/WiderMarketPanel.vue';
import { sampleStory } from '../demo/sampleStory';
import {
  cloneSerializableRecord,
  type PanelType,
  type SerializablePanelParameters,
  type SerializablePanelState,
  type WorkspacePanelDefinition,
  type WorkspacePanelInstance,
} from './types';

const storyParameters = (): SerializablePanelParameters => ({
  storyId: sampleStory.id,
});

export const panelRegistry: readonly WorkspacePanelDefinition[] = [
  {
    type: 'news-source',
    title: 'News source',
    component: NewsSourcePanel,
    createDefaultParameters: storyParameters,
    createDefaultState: () => ({ showSourceDetails: false }),
  },
  {
    type: 'evidence-claims',
    title: 'Evidence and claims',
    component: EvidenceClaimsPanel,
    createDefaultParameters: storyParameters,
    createDefaultState: () => ({ selectedClaimId: null }),
  },
  {
    type: 'primary-security',
    title: 'Primary security',
    component: PrimarySecurityPanel,
    createDefaultParameters: storyParameters,
    createDefaultState: () => ({ expandedMetricId: null }),
  },
  {
    type: 'related-companies',
    title: 'Related companies',
    component: RelatedCompaniesPanel,
    createDefaultParameters: storyParameters,
    createDefaultState: () => ({ selectedTicker: null }),
  },
  {
    type: 'wider-market',
    title: 'Wider market',
    component: WiderMarketPanel,
    createDefaultParameters: storyParameters,
    createDefaultState: () => ({ expandedObservationId: null }),
  },
  {
    type: 'guided-interpretation',
    title: 'Guided interpretation',
    component: GuidedInterpretationPanel,
    createDefaultParameters: storyParameters,
    createDefaultState: () => ({ activeSection: 'evidence' }),
  },
];

export function getPanelDefinition(type: PanelType): WorkspacePanelDefinition {
  const definition = panelRegistry.find((candidate) => candidate.type === type);
  if (!definition) {
    throw new Error(`No panel definition is registered for "${type}".`);
  }
  return definition;
}

export function createPanelInstance(type: PanelType): WorkspacePanelInstance {
  const definition = getPanelDefinition(type);
  return {
    instanceId: `panel-${type}`,
    type,
    title: definition.title,
    parameters: cloneSerializableRecord(definition.createDefaultParameters()),
  };
}

export function createDefaultPanelState(
  type: PanelType,
): SerializablePanelState {
  return cloneSerializableRecord(getPanelDefinition(type).createDefaultState());
}
