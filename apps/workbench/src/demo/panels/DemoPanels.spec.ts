import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/vue';
import type { Component } from 'vue';
import { afterEach, describe, expect, it } from 'vitest';

import { sampleStory } from '../sampleStory';

const panelModules = import.meta.glob<{ default: Component }>('./*.vue', {
  eager: true,
});

afterEach(cleanup);

function requirePanel(name: string): Component {
  const panel = panelModules[`./${name}.vue`]?.default;

  expect(panel, `${name}.vue must provide the panel component`).toBeDefined();

  return panel as Component;
}

function expectSimulationNotice(): void {
  expect(screen.getByText('Simulated demonstration')).toBeVisible();
  expect(
    screen.getByText(
      'Fictional names, tickers, prices and market moves — not live market data.',
    ),
  ).toBeVisible();
}

describe('NewsSourcePanel', () => {
  it('explains the fictional source and emits a controlled detail intention', async () => {
    const view = render(requirePanel('NewsSourcePanel'), {
      props: { source: sampleStory.source, showSourceDetails: false },
    });

    expect(
      screen.getByRole('heading', { name: 'Fictional news source' }),
    ).toBeVisible();
    expect(screen.getByText(sampleStory.source.headline)).toBeVisible();
    expectSimulationNotice();

    await fireEvent.click(
      screen.getByRole('button', { name: 'Show source details' }),
    );

    expect(view.emitted('toggle-source-details')).toEqual([[true]]);
  });

  it('states when no fictional source is available', () => {
    render(requirePanel('NewsSourcePanel'), {
      props: { source: null, showSourceDetails: false },
    });

    expect(screen.getByText('No fictional source is available.')).toBeVisible();
    expectSimulationNotice();
  });
});

describe('EvidenceClaimsPanel', () => {
  it('selects a claim through a semantic emit and explains confidence', async () => {
    const firstClaim = sampleStory.extractedClaims[0]!;
    const view = render(requirePanel('EvidenceClaimsPanel'), {
      props: { claims: sampleStory.extractedClaims, selectedClaimId: null },
    });

    expect(
      screen.getByRole('heading', { name: 'Evidence and extracted claims' }),
    ).toBeVisible();
    expect(
      screen.getByText(
        'Confidence describes how directly the fictional source supports a claim; it does not predict whether a share price will rise.',
      ),
    ).toBeVisible();
    expectSimulationNotice();

    await fireEvent.click(
      screen.getByRole('button', {
        name: `Review claim: ${firstClaim.statement}`,
      }),
    );

    expect(view.emitted('select-claim')).toEqual([[firstClaim.id]]);
  });

  it('shows why the controlled selected claim matters', () => {
    const firstClaim = sampleStory.extractedClaims[0]!;

    render(requirePanel('EvidenceClaimsPanel'), {
      props: {
        claims: sampleStory.extractedClaims,
        selectedClaimId: firstClaim.id,
      },
    });

    expect(screen.getByText(firstClaim.sourceExcerpt)).toBeVisible();
    expect(screen.getByText(firstClaim.whyItMatters)).toBeVisible();
  });

  it('states when no claims have been extracted', () => {
    render(requirePanel('EvidenceClaimsPanel'), {
      props: { claims: [], selectedClaimId: null },
    });

    expect(
      screen.getByText('No claims have been extracted yet.'),
    ).toBeVisible();
    expectSimulationNotice();
  });
});

describe('PrimarySecurityPanel', () => {
  it('labels simulated security values and emits an explanation toggle', async () => {
    const metric = sampleStory.primarySecurity.metrics[0]!;
    const view = render(requirePanel('PrimarySecurityPanel'), {
      props: {
        security: sampleStory.primarySecurity,
        expandedMetricId: null,
      },
    });

    expect(
      screen.getByRole('heading', { name: 'Primary fictional security' }),
    ).toBeVisible();
    expect(
      screen.getByText(sampleStory.primarySecurity.simulatedPrice),
    ).toBeVisible();
    expectSimulationNotice();

    await fireEvent.click(screen.getByRole('button', { name: 'Explain P/E' }));

    expect(view.emitted('toggle-metric')).toEqual([[metric.id]]);
  });

  it('renders the expanded metric in plain English', () => {
    const metric = sampleStory.primarySecurity.metrics[0]!;

    render(requirePanel('PrimarySecurityPanel'), {
      props: {
        security: sampleStory.primarySecurity,
        expandedMetricId: metric.id,
      },
    });

    expect(screen.getByText(metric.plainEnglishMeaning)).toBeVisible();
  });

  it('states when no primary security is available', () => {
    render(requirePanel('PrimarySecurityPanel'), {
      props: { security: null, expandedMetricId: null },
    });

    expect(
      screen.getByText('No fictional primary security is available.'),
    ).toBeVisible();
    expectSimulationNotice();
  });
});

describe('RelatedCompaniesPanel', () => {
  it('emits the selected fictional company and explains its relationship', async () => {
    const company = sampleStory.relatedCompanies[0]!;
    const view = render(requirePanel('RelatedCompaniesPanel'), {
      props: { companies: sampleStory.relatedCompanies, selectedTicker: null },
    });

    expect(
      screen.getByRole('heading', { name: 'Related fictional companies' }),
    ).toBeVisible();
    expectSimulationNotice();

    await fireEvent.click(
      screen.getByRole('button', {
        name: `Review company: ${company.companyName}`,
      }),
    );

    expect(view.emitted('select-company')).toEqual([[company.ticker]]);
  });

  it('shows novice context for the controlled selected company', () => {
    const company = sampleStory.relatedCompanies[0]!;

    render(requirePanel('RelatedCompaniesPanel'), {
      props: {
        companies: sampleStory.relatedCompanies,
        selectedTicker: company.ticker,
      },
    });

    expect(screen.getByText(company.relationship)).toBeVisible();
    expect(
      screen.getByText(company.metrics[0]!.plainEnglishMeaning),
    ).toBeVisible();
  });

  it('states when no related fictional companies are available', () => {
    render(requirePanel('RelatedCompaniesPanel'), {
      props: { companies: [], selectedTicker: null },
    });

    expect(
      screen.getByText('No related fictional companies are available.'),
    ).toBeVisible();
    expectSimulationNotice();
  });
});

describe('WiderMarketPanel', () => {
  it('emits an observation toggle and explains comparison with a broad market', async () => {
    const observation = sampleStory.widerMarket.observations[0]!;
    const view = render(requirePanel('WiderMarketPanel'), {
      props: {
        market: sampleStory.widerMarket,
        expandedObservationId: null,
      },
    });

    expect(
      screen.getByRole('heading', { name: 'Wider fictional market' }),
    ).toBeVisible();
    expect(
      screen.getByText(sampleStory.widerMarket.contextSummary),
    ).toBeVisible();
    expectSimulationNotice();

    await fireEvent.click(
      screen.getByRole('button', {
        name: `Explain ${observation.label}`,
      }),
    );

    expect(view.emitted('toggle-observation')).toEqual([[observation.id]]);
  });

  it('renders the controlled expanded observation in plain English', () => {
    const observation = sampleStory.widerMarket.observations[0]!;

    render(requirePanel('WiderMarketPanel'), {
      props: {
        market: sampleStory.widerMarket,
        expandedObservationId: observation.id,
      },
    });

    expect(screen.getByText(observation.plainEnglishMeaning)).toBeVisible();
  });

  it('states when wider-market context is unavailable', () => {
    render(requirePanel('WiderMarketPanel'), {
      props: { market: null, expandedObservationId: null },
    });

    expect(
      screen.getByText('No fictional wider-market context is available.'),
    ).toBeVisible();
    expectSimulationNotice();
  });
});

describe('GuidedInterpretationPanel', () => {
  it('separates evidence from uncertainty and emits the requested section', async () => {
    const view = render(requirePanel('GuidedInterpretationPanel'), {
      props: {
        interpretation: sampleStory.guidedInterpretation,
        activeSection: 'evidence',
      },
    });

    expect(
      screen.getByRole('heading', { name: 'Guided interpretation' }),
    ).toBeVisible();
    expect(
      screen.getByText(sampleStory.guidedInterpretation.plainEnglishSummary),
    ).toBeVisible();
    expect(screen.getByText('Not trading advice')).toBeVisible();
    expectSimulationNotice();

    await fireEvent.click(screen.getByRole('tab', { name: 'Uncertainty' }));

    expect(view.emitted('select-section')).toEqual([['uncertainty']]);
  });

  it('renders only the controlled interpretation section', () => {
    render(requirePanel('GuidedInterpretationPanel'), {
      props: {
        interpretation: sampleStory.guidedInterpretation,
        activeSection: 'uncertainty',
      },
    });

    expect(
      screen.getByText(sampleStory.guidedInterpretation.uncertainties[0]!),
    ).toBeVisible();
    expect(
      screen.queryByText(
        sampleStory.guidedInterpretation.supportingEvidence[0]!,
      ),
    ).not.toBeInTheDocument();
  });

  it('states when guided interpretation is unavailable', () => {
    render(requirePanel('GuidedInterpretationPanel'), {
      props: { interpretation: null, activeSection: 'evidence' },
    });

    expect(
      screen.getByText('No guided interpretation is available.'),
    ).toBeVisible();
    expectSimulationNotice();
  });
});
