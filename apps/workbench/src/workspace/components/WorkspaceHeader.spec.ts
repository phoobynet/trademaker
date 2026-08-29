import '@testing-library/jest-dom/vitest';

import { cleanup, render, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it } from 'vitest';

import WorkspaceHeader from './WorkspaceHeader.vue';

afterEach(cleanup);

describe('WorkspaceHeader', () => {
  it('keeps the TradeMaker identity and simulated-data status visible', () => {
    render(WorkspaceHeader);

    expect(screen.getByText('TradeMaker')).toBeVisible();
    expect(screen.getByText('Simulated demonstration')).toBeVisible();
  });

  it('names every permanent workspace control', () => {
    render(WorkspaceHeader);

    expect(screen.getByRole('button', { name: 'Panels' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Reset workspace' }),
    ).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: 'Use light theme' }),
    ).toBeVisible();
  });

  it('gives every header control a visible keyboard-focus style', () => {
    const { container } = render(WorkspaceHeader);
    const controls = container.querySelectorAll('button, input');

    expect(controls.length).toBeGreaterThan(0);
    controls.forEach((control) => {
      expect(control.className).toContain('focus-visible:');
    });
  });
});
