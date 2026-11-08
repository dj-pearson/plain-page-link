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
    expect(scope.style.contain).toBe('paint');
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
    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
  });

  it('renders nothing for CSS the sanitiser rejects outright', () => {
    const { container } = renderWith('h1 { color: red');
    expect(container.querySelector('style')).toBeNull();
  });
});
