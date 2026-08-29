import { describe, expect, it } from 'vitest';

import EvidenceClaimsPanel from '../demo/panels/EvidenceClaimsPanel.vue';
import GuidedInterpretationPanel from '../demo/panels/GuidedInterpretationPanel.vue';
import NewsSourcePanel from '../demo/panels/NewsSourcePanel.vue';
import PrimarySecurityPanel from '../demo/panels/PrimarySecurityPanel.vue';
import RelatedCompaniesPanel from '../demo/panels/RelatedCompaniesPanel.vue';
import WiderMarketPanel from '../demo/panels/WiderMarketPanel.vue';

interface RegistryModule {
  createPanelInstance(type: string): {
    instanceId: string;
    parameters: Record<string, unknown>;
  };
  panelRegistry: Array<{
    type: string;
    title: string;
    component: unknown;
    createDefaultParameters(): Record<string, unknown>;
    createDefaultState(): Record<string, unknown>;
  }>;
}

const registryModules = import.meta.glob<RegistryModule>('./panelRegistry.ts', {
  eager: true,
});
const registryModule = Object.values(registryModules)[0];

const expectedPanels = [
  ['news-source', 'News source', NewsSourcePanel, { showSourceDetails: false }],
  [
    'evidence-claims',
    'Evidence and claims',
    EvidenceClaimsPanel,
    { selectedClaimId: null },
  ],
  [
    'primary-security',
    'Primary security',
    PrimarySecurityPanel,
    { expandedMetricId: null },
  ],
  [
    'related-companies',
    'Related companies',
    RelatedCompaniesPanel,
    { selectedTicker: null },
  ],
  [
    'wider-market',
    'Wider market',
    WiderMarketPanel,
    { expandedObservationId: null },
  ],
  [
    'guided-interpretation',
    'Guided interpretation',
    GuidedInterpretationPanel,
    { activeSection: 'evidence' },
  ],
] as const;

describe('panel registry', () => {
  it('registers each supported panel type exactly once with its real component', () => {
    expect(registryModule).toBeDefined();

    const registry = registryModule?.panelRegistry ?? [];
    expect(registry).toHaveLength(expectedPanels.length);

    for (const [type, title, component] of expectedPanels) {
      const matches = registry.filter((definition) => definition.type === type);
      expect(matches, `${type} should occur exactly once`).toHaveLength(1);
      expect(matches[0]?.title).toBe(title);
      expect(matches[0]?.title.trim().length).toBeGreaterThan(3);
      expect(matches[0]?.component).toBe(component);
    }
  });

  it('allocates fresh parameter and state objects from every definition', () => {
    expect(registryModule).toBeDefined();

    for (const [type, , , expectedState] of expectedPanels) {
      const definition = registryModule?.panelRegistry.find(
        (candidate) => candidate.type === type,
      );
      expect(definition).toBeDefined();

      const firstParameters = definition?.createDefaultParameters();
      const secondParameters = definition?.createDefaultParameters();
      expect(firstParameters).toEqual({
        storyId: 'fictional-aurora-circuits-nimbus-x',
      });
      expect(secondParameters).toEqual(firstParameters);
      expect(secondParameters).not.toBe(firstParameters);

      const firstState = definition?.createDefaultState();
      const secondState = definition?.createDefaultState();
      expect(firstState).toEqual(expectedState);
      expect(secondState).toEqual(firstState);
      expect(secondState).not.toBe(firstState);
    }
  });

  it('creates deterministic IDs that are unique across live singleton instances', () => {
    expect(registryModule).toBeDefined();

    const instances = expectedPanels.map(([type]) =>
      registryModule?.createPanelInstance(type),
    );
    const instanceIds = instances.map((instance) => instance?.instanceId);

    expect(new Set(instanceIds).size).toBe(expectedPanels.length);
    expect(instanceIds).toEqual(
      expectedPanels.map(([type]) => `panel-${type}`),
    );
  });

  it('recreates a closed singleton with fresh parameter ownership', () => {
    expect(registryModule).toBeDefined();

    const first = registryModule?.createPanelInstance('evidence-claims');
    const reopened = registryModule?.createPanelInstance('evidence-claims');

    expect(reopened?.instanceId).toBe(first?.instanceId);
    expect(reopened?.parameters).toEqual(first?.parameters);
    expect(reopened?.parameters).not.toBe(first?.parameters);
  });
});
