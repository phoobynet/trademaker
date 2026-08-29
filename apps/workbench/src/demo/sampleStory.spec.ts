import { describe, expect, it } from 'vitest';

import type { SimulatedNewsStory } from './types';

const storyModules = import.meta.glob<{ sampleStory: SimulatedNewsStory }>(
  './sampleStory.ts',
  { eager: true },
);

function requireSampleStory(): SimulatedNewsStory {
  const story = storyModules['./sampleStory.ts']?.sampleStory;

  expect(story, 'sampleStory.ts must export sampleStory').toBeDefined();

  return story as SimulatedNewsStory;
}

describe('sampleStory', () => {
  it('marks the entire story as simulated and supplies all six analysis sections', () => {
    const story = requireSampleStory();

    expect(story.simulated).toBe(true);
    expect(story.source).toBeTruthy();
    expect(story.extractedClaims.length).toBeGreaterThan(0);
    expect(story.primarySecurity).toBeTruthy();
    expect(story.relatedCompanies.length).toBeGreaterThanOrEqual(2);
    expect(story.widerMarket).toBeTruthy();
    expect(story.guidedInterpretation).toBeTruthy();
  });

  it('keeps each extracted claim traceable and useful to a novice', () => {
    const story = requireSampleStory();

    for (const claim of story.extractedClaims) {
      expect(claim.sourceExcerpt.trim()).not.toBe('');
      expect(claim.whyItMatters.trim()).not.toBe('');
    }
  });

  it('explains every abbreviated security metric in plain English', () => {
    const story = requireSampleStory();
    const securities = [story.primarySecurity, ...story.relatedCompanies];

    for (const security of securities) {
      for (const metric of security.metrics) {
        if (metric.abbreviation) {
          expect(metric.plainEnglishMeaning.trim()).not.toBe('');
        }
      }
    }
  });

  it('separates evidence, uncertainty, next questions, and advice boundaries', () => {
    const story = requireSampleStory();
    const interpretation = story.guidedInterpretation;

    expect(interpretation.supportingEvidence.length).toBeGreaterThan(0);
    expect(interpretation.uncertainties.length).toBeGreaterThan(0);
    expect(interpretation.questionsToResearchNext.length).toBeGreaterThan(0);
    expect(interpretation.notTradingAdvice).toBe(true);
  });

  it('contains no runtime network URL', () => {
    const story = requireSampleStory();

    expect(JSON.stringify(story)).not.toMatch(/https?:\/\//i);
  });
});
