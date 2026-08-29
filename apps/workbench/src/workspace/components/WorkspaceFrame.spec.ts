import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';

import WorkspaceFrame from './WorkspaceFrame.vue';

describe('WorkspaceFrame', () => {
  it('exposes distinct docking-canvas and taskbar regions', () => {
    render(WorkspaceFrame);

    expect(
      screen.getByRole('region', { name: 'Docking canvas' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Workspace taskbar' }),
    ).toBeInTheDocument();
  });
});
