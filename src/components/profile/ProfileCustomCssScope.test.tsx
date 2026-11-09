/**
 * US-514: the agent's custom CSS applies inside the profile container only.
 */
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: vi.fn(async () => ({ data: null, error: null })) },
}));

import { ProfileCustomCssScope } from './ProfileCustomCssScope';
import { useProfileCustomCss } from '@/hooks/useProfileCustomCss';

/** What FullProfilePage does: the hook's output into the scope. */
function Page({ children }: { children: ReactNode }) {
  const css = useProfileCustomCss('agent-1');
  return (
    <div>
      <ProfileCustomCssScope css={css} className="space-y-4">
        {children}
      </ProfileCustomCssScope>
      <footer data-testid="compliance">Equal Housing Opportunity</footer>
    </div>
  );
}

function renderWith(stored: string | null, children: ReactNode = <h1>Jane Doe</h1>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['profile-custom-css', 'agent-1'], stored);
  return render(
    <QueryClientProvider client={client}>
      <Page>{children}</Page>
    </QueryClientProvider>
  );
}

describe('ProfileCustomCssScope (US-514)', () => {
  it('renders the sanitised, scoped stylesheet and contains the container', () => {
    const { container } = renderWith(
      '@import url(https://evil.test/a.css); body { background: #fafafa } footer { display: none }'
    );
    const style = container.querySelector('style');
    expect(style).not.toBeNull();
    expect(style!.hidden).toBe(true);
    expect(style!.textContent).toBe(
      '.ab-custom-css { background: #fafafa; }\n.ab-custom-css footer { display: none; }'
    );
    expect(style!.textContent).not.toContain('@import');

    const scope = container.querySelector('.ab-custom-css') as HTMLElement;
    // Containment lives on an unclassed wrapper no scoped selector can match.
    const boundary = scope.parentElement as HTMLElement;
    expect(boundary.style.contain).toBe('paint');
    expect(boundary.style.overflow).toBe('clip');
    expect(boundary.className).toBe('');
    expect(boundary.id).toBe('');
    expect(boundary.contains(screen.getByTestId('compliance'))).toBe(false);
    expect(scope.style.contain).toBe('');
    expect(scope.dataset.customCss).toBe('applied');
    expect(scope).toHaveClass('space-y-4');
    // The compliance footer is not inside the scope, so `.ab-custom-css footer`
    // cannot reach it.
    expect(scope.contains(screen.getByTestId('compliance'))).toBe(false);
  });

  it('renders no stylesheet and no containment when there is no CSS', () => {
    const { container } = renderWith(null);
    expect(container.querySelector('style')).toBeNull();
    const scope = container.querySelector('.ab-custom-css') as HTMLElement;
    expect(scope.style.contain).toBe('');
    expect(container.querySelector('[data-custom-css-boundary]')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('keeps the containment out of reach of the review probes', () => {
    const { container } = renderWith(
      ':root { --p: fixed; contain: none !important } h1 { position: var(--p); top: 0; z-index: 99999 } body { position: relative; z-index: 9999; margin-bottom: -400px; transform: translateY(300px) }'
    );
    const css = container.querySelector('style')!.textContent!;
    expect(css).not.toMatch(/contain|margin-bottom|transform|z-index: 9999;/);
    // Every rule is prefixed by the scope class, which the boundary does not carry,
    // so nothing the agent writes can match the element holding contain: paint.
    const boundary = container.querySelector('[data-custom-css-boundary]') as HTMLElement;
    for (const rule of css.split('\n')) {
      const selector = rule.slice(0, rule.indexOf('{')).trim();
      expect(boundary.matches(selector)).toBe(false);
    }
    expect(boundary.style.contain).toBe('paint');
  });

  it('renders nothing for CSS the sanitiser rejects outright', () => {
    const { container } = renderWith('h1 { color: red');
    expect(container.querySelector('style')).toBeNull();
  });
});
