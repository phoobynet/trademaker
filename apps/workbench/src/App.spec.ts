import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./workspace/components/DockWorkspace.vue', () => ({
  default: {
    template: '<div data-testid="dock-workspace" />',
  },
}));

import App from './App.vue';

describe('App', () => {
  it('presents the TradeMaker workspace as a simulated demonstration', () => {
    render(App);

    expect(
      screen.getByRole('main', { name: 'TradeMaker workspace' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Simulated demonstration')).toBeVisible();
  });
});
