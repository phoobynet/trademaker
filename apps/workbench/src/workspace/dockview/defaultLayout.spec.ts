import { describe, expect, it } from 'vitest';

import type { PanelPlacement, WorkspacePanelInstance } from '../types';

interface DefaultLayoutInstruction {
  instance: WorkspacePanelInstance;
  placement?: PanelPlacement;
}

interface DefaultLayoutModule {
  createDefaultLayout(): DefaultLayoutInstruction[];
}

const layoutModules = import.meta.glob<DefaultLayoutModule>(
  './defaultLayout.ts',
  { eager: true },
);
const layoutModule = Object.values(layoutModules)[0];

describe('TradeMaker default dock layout', () => {
  it('contains every singleton panel exactly once', () => {
    expect(layoutModule).toBeDefined();
    const layout = layoutModule?.createDefaultLayout() ?? [];

    expect(layout.map(({ instance }) => instance.type)).toEqual([
      'news-source',
      'evidence-claims',
      'guided-interpretation',
      'primary-security',
      'related-companies',
      'wider-market',
    ]);
    expect(
      new Set(layout.map(({ instance }) => instance.instanceId)).size,
    ).toBe(6);
  });

  it('keeps source, evidence, and guidance readable across the upper workspace', () => {
    expect(layoutModule).toBeDefined();
    const layout = layoutModule?.createDefaultLayout() ?? [];

    expect(
      layout.slice(0, 3).map(({ instance, placement }) => ({
        placement,
        type: instance.type,
      })),
    ).toEqual([
      { type: 'news-source', placement: { kind: 'default' } },
      {
        type: 'evidence-claims',
        placement: {
          kind: 'relative',
          referenceInstanceId: 'panel-news-source',
          position: 'right',
        },
      },
      {
        type: 'guided-interpretation',
        placement: {
          kind: 'relative',
          referenceInstanceId: 'panel-evidence-claims',
          position: 'right',
        },
      },
    ]);
  });

  it('uses lower splits efficiently and begins with an obvious tabbed group', () => {
    expect(layoutModule).toBeDefined();
    const layout = layoutModule?.createDefaultLayout() ?? [];

    expect(
      layout.slice(3).map(({ instance, placement }) => ({
        placement,
        type: instance.type,
      })),
    ).toEqual([
      {
        type: 'primary-security',
        placement: {
          kind: 'relative',
          referenceInstanceId: 'panel-news-source',
          position: 'below',
        },
      },
      {
        type: 'related-companies',
        placement: {
          kind: 'relative',
          referenceInstanceId: 'panel-primary-security',
          position: 'tab',
        },
      },
      {
        type: 'wider-market',
        placement: {
          kind: 'relative',
          referenceInstanceId: 'panel-evidence-claims',
          position: 'below',
        },
      },
    ]);
  });
});
