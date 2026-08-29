import type { SimulatedNewsStory } from './types';

export const sampleStory = {
  id: 'fictional-aurora-circuits-nimbus-x',
  simulated: true,
  source: {
    publicationName: 'The Circuit Ledger (fictional newsroom)',
    headline:
      'Aurora Circuits brings forward a fictional Nimbus-X production trial',
    byline: 'Mara Vale, simulated technology correspondent',
    publishedLabel: 'Demonstration edition — no real publication date',
    sourceDescription:
      'A made-up article created only to demonstrate how TradeMaker organises evidence. It is not a live news source.',
  },
  extractedClaims: [
    {
      id: 'claim-trial-timing',
      statement:
        'Aurora Circuits says its fictional Nimbus-X chip trial may begin one quarter earlier than the company previously modelled.',
      sourceExcerpt:
        'In this simulated scenario, Aurora Circuits expects the Nimbus-X trial line to start one quarter earlier than its internal planning case.',
      confidence: 'high',
      whyItMatters:
        'An earlier trial could let customers test the chip sooner, but a trial is not the same as reliable mass production or confirmed sales.',
    },
    {
      id: 'claim-customer-interest',
      statement:
        'Three unnamed fictional data-centre customers have requested evaluation units.',
      sourceExcerpt:
        'The fictional company reported evaluation requests from three unnamed data-centre operators; no orders or customer identities were provided.',
      confidence: 'medium',
      whyItMatters:
        'Evaluation requests suggest interest, not revenue. The missing names and order sizes make the commercial impact uncertain.',
    },
    {
      id: 'claim-yield-risk',
      statement:
        'Management has not yet shown that enough working chips can be produced consistently.',
      sourceExcerpt:
        'Aurora Circuits did not disclose a production-yield figure for the fictional Nimbus-X trial.',
      confidence: 'high',
      whyItMatters:
        'Production yield means the share of manufactured chips that work correctly. Low yield can make each sale expensive or delay delivery.',
    },
  ],
  primarySecurity: {
    companyName: 'Aurora Circuits plc (fictional)',
    ticker: 'AURC — simulated ticker',
    roleInStory: 'Designer of the fictional Nimbus-X semiconductor',
    simulatedPrice: '$48.20 (simulated price)',
    simulatedMove: '+6.8% (simulated session move)',
    moveExplanation:
      'The demonstration assumes buyers reacted positively to the earlier trial, while recognising that this is not an observed market move.',
    metrics: [
      {
        id: 'aurc-pe',
        label: 'Price-to-earnings ratio',
        abbreviation: 'P/E',
        simulatedValue: '28× (simulated)',
        plainEnglishMeaning:
          'P/E compares the share price with one year of company profit. A value of 28× means this fictional price equals 28 years of current annual profit per share, if profit stayed unchanged.',
      },
      {
        id: 'aurc-market-cap',
        label: 'Market capitalisation',
        simulatedValue: '$9.6 billion (simulated)',
        plainEnglishMeaning:
          'Market capitalisation is the imagined total value of all Aurora Circuits shares, not cash held by the company.',
      },
    ],
  },
  relatedCompanies: [
    {
      companyName: 'Lattice Harbor Systems (fictional)',
      ticker: 'LHBR — simulated ticker',
      roleInStory: 'Imagined competitor in data-centre chips',
      relationship:
        'A rival could lose evaluation attention if Nimbus-X performs well, or benefit if the news lifts interest in the whole fictional sector.',
      simulatedPrice: '$31.40 (simulated price)',
      simulatedMove: '+1.9% (simulated session move)',
      moveExplanation:
        'The smaller fictional rise represents broad sector optimism rather than company-specific evidence.',
      metrics: [
        {
          id: 'lhbr-pe',
          label: 'Price-to-earnings ratio',
          abbreviation: 'P/E',
          simulatedValue: '22× (simulated)',
          plainEnglishMeaning:
            'P/E compares the share price with annual profit per share. Here it is a fictional comparison point, not a valuation recommendation.',
        },
      ],
    },
    {
      companyName: 'Nova Materials Group (fictional)',
      ticker: 'NVMG — simulated ticker',
      roleInStory: 'Imagined supplier of specialist chip-packaging material',
      relationship:
        'A larger production run might increase demand for its fictional packaging material, but no supply agreement has been claimed.',
      simulatedPrice: '$17.85 (simulated price)',
      simulatedMove: '+3.1% (simulated session move)',
      moveExplanation:
        'The demonstration assumes traders speculated about supplier demand even though the article names no supplier contract.',
      metrics: [
        {
          id: 'nvmg-margin',
          label: 'Operating profit margin',
          simulatedValue: '14% (simulated)',
          plainEnglishMeaning:
            'Operating profit margin is the share of sales left after ordinary operating costs, before interest and tax. It helps explain how much profit a supplier keeps from each fictional sales dollar.',
        },
      ],
    },
  ],
  widerMarket: {
    sectorName: 'Imaginary Semiconductor Basket',
    broadMarketName: 'Simulated Broad Market Index',
    contextSummary:
      'The fictional semiconductor group rose more than the fictional broad market. That pattern could indicate a sector reaction, but one demonstration cannot establish cause.',
    observations: [
      {
        id: 'sector-basket',
        label: 'Imaginary Semiconductor Basket',
        simulatedMove: '+2.4% (simulated session move)',
        plainEnglishMeaning:
          'This made-up basket represents several semiconductor companies moving together, which helps compare a company-specific reaction with the sector.',
      },
      {
        id: 'broad-market',
        label: 'Simulated Broad Market Index',
        simulatedMove: '+0.3% (simulated session move)',
        plainEnglishMeaning:
          'This made-up broad index represents many industries. Its smaller move provides fictional background rather than proof that the article caused any change.',
      },
    ],
  },
  guidedInterpretation: {
    plainEnglishSummary:
      'In this fictional example, an earlier chip trial is encouraging, but customer interest has not become orders and manufacturing reliability is still unknown.',
    supportingEvidence: [
      'The fictional article directly states that the trial schedule moved forward by one quarter.',
      'It reports three evaluation requests, while clearly saying that no orders were announced.',
      'The simulated primary-company move is larger than both related-company moves and the fictional sector basket.',
    ],
    uncertainties: [
      'No production-yield figure shows how many trial chips will work correctly.',
      'The fictional customers are unnamed and their evaluation requests have no disclosed size.',
      'The demonstration cannot prove that the simulated price moves were caused by this one story.',
    ],
    questionsToResearchNext: [
      'When will Aurora Circuits publish trial results and a production-yield figure?',
      'Do evaluation customers have a timetable for turning tests into paid orders?',
      'Which suppliers would actually participate if fictional production expands?',
    ],
    notTradingAdvice: true,
  },
} satisfies SimulatedNewsStory;
