/**
 * US-514: the dashboard editor for profiles.custom_css.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const h = vi.hoisted(() => ({
  entitled: true,
  stored: '',
  mutate: vi.fn(),
  toast: vi.fn(),
}));

vi.mock('@/hooks/usePlanUsage', () => ({
  usePlanUsage: () => ({ hasFeature: () => h.entitled, isLoading: false }),
}));
vi.mock('@/hooks/useAgentCustomCss', () => ({
  useAgentCustomCss: () => ({
    css: h.stored,
    isLoading: false,
    isError: false,
    save: { mutate: h.mutate, isPending: false },
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: h.toast }) }));

import { CustomCssEditor } from './CustomCssEditor';

const renderEditor = () =>
  render(
    <MemoryRouter>
      <CustomCssEditor />
    </MemoryRouter>
  );

beforeEach(() => {
  h.entitled = true;
  h.stored = '';
  h.mutate.mockReset();
  h.toast.mockReset();
});

describe('CustomCssEditor (US-514)', () => {
  it('lists what visitors will not get before the agent saves', () => {
    renderEditor();
    const field = screen.getByLabelText('Your CSS');
    fireEvent.change(field, {
      target: {
        value: '@import url(https://x.test/a.css); a { background: url(https://x.test/p.gif) }',
      },
    });
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Visitors will not get');
    expect(status).toHaveTextContent('@import');
    expect(status).toHaveTextContent('url() pointing at another site');
  });

  it('saves what the agent typed', () => {
    renderEditor();
    const save = screen.getByRole('button', { name: 'Save custom CSS' });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Your CSS'), { target: { value: 'h1 { color: red }' } });
    expect(screen.queryByRole('status')).toBeNull();
    fireEvent.click(save);
    expect(h.mutate).toHaveBeenCalledWith('h1 { color: red }', expect.any(Object));
  });

  it('refuses to save over the length limit', () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Your CSS'), { target: { value: 'a'.repeat(10_001) } });
    expect(screen.getByRole('button', { name: 'Save custom CSS' })).toBeDisabled();
    expect(screen.getByLabelText('Your CSS')).toHaveAttribute('aria-invalid', 'true');
  });

  it('offers removal of saved CSS', () => {
    h.stored = 'h1 { color: red }';
    renderEditor();
    expect(screen.getByLabelText('Your CSS')).toHaveValue('h1 { color: red }');
    fireEvent.click(screen.getByRole('button', { name: 'Remove custom CSS' }));
    expect(h.mutate).toHaveBeenCalledWith('', expect.any(Object));
  });

  it('points a plan without customThemes at the plans instead of an editor', () => {
    h.entitled = false;
    h.stored = 'h1 { color: red }';
    renderEditor();
    expect(screen.queryByLabelText('Your CSS')).toBeNull();
    expect(screen.getByRole('link', { name: 'See plans' })).toHaveAttribute(
      'href',
      '/dashboard/subscription'
    );
    expect(screen.getByText(/does not use it on this plan/)).toBeInTheDocument();
  });
});
