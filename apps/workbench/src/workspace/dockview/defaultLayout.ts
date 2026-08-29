import { createPanelInstance } from '../panelRegistry';
import type { PanelPlacement, WorkspacePanelInstance } from '../types';

export interface DefaultLayoutInstruction {
  instance: WorkspacePanelInstance;
  placement: PanelPlacement;
}

export function createDefaultLayout(): DefaultLayoutInstruction[] {
  return [
    {
      instance: createPanelInstance('news-source'),
      placement: { kind: 'default' },
    },
    {
      instance: createPanelInstance('evidence-claims'),
      placement: {
        kind: 'relative',
        referenceInstanceId: 'panel-news-source',
        position: 'right',
      },
    },
    {
      instance: createPanelInstance('guided-interpretation'),
      placement: {
        kind: 'relative',
        referenceInstanceId: 'panel-evidence-claims',
        position: 'right',
      },
    },
    {
      instance: createPanelInstance('primary-security'),
      placement: {
        kind: 'relative',
        referenceInstanceId: 'panel-news-source',
        position: 'below',
      },
    },
    {
      instance: createPanelInstance('related-companies'),
      placement: {
        kind: 'relative',
        referenceInstanceId: 'panel-primary-security',
        position: 'tab',
      },
    },
    {
      instance: createPanelInstance('wider-market'),
      placement: {
        kind: 'relative',
        referenceInstanceId: 'panel-evidence-claims',
        position: 'below',
      },
    },
  ];
}
