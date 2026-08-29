export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface NewsSource {
  publicationName: string;
  headline: string;
  byline: string;
  publishedLabel: string;
  sourceDescription: string;
}

export interface ExtractedClaim {
  id: string;
  statement: string;
  sourceExcerpt: string;
  confidence: ConfidenceLevel;
  whyItMatters: string;
}

export interface ExplainedMetric {
  id: string;
  label: string;
  abbreviation?: string;
  simulatedValue: string;
  plainEnglishMeaning: string;
}

export interface SecuritySnapshot {
  companyName: string;
  ticker: string;
  roleInStory: string;
  simulatedPrice: string;
  simulatedMove: string;
  moveExplanation: string;
  metrics: ExplainedMetric[];
}

export interface RelatedCompanySnapshot extends SecuritySnapshot {
  relationship: string;
}

export interface MarketObservation {
  id: string;
  label: string;
  simulatedMove: string;
  plainEnglishMeaning: string;
}

export interface MarketContext {
  sectorName: string;
  broadMarketName: string;
  observations: MarketObservation[];
  contextSummary: string;
}

export interface GuidedInterpretation {
  plainEnglishSummary: string;
  supportingEvidence: string[];
  uncertainties: string[];
  questionsToResearchNext: string[];
  notTradingAdvice: true;
}

export interface SimulatedNewsStory {
  id: string;
  simulated: true;
  source: NewsSource;
  extractedClaims: ExtractedClaim[];
  primarySecurity: SecuritySnapshot;
  relatedCompanies: RelatedCompanySnapshot[];
  widerMarket: MarketContext;
  guidedInterpretation: GuidedInterpretation;
}

export type GuidedInterpretationSection =
  'evidence' | 'uncertainty' | 'research';
