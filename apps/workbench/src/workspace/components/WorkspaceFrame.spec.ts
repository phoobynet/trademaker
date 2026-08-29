import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./DockWorkspace.vue', () => ({
  default: {
    template: '<div data-testid="dock-workspace" />',
  },
}));

import WorkspaceFrame from './WorkspaceFrame.vue';

afterEach(cleanup);

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

  it('mounts the dock workspace when the shell has no replacement canvas', () => {
    render(WorkspaceFrame);

    expect(screen.getByTestId('dock-workspace')).toBeInTheDocument();
  });
});
