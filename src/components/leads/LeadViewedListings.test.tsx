import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const { fromMock, calls } = vi.hoisted(() => {
  const calls: Array<[string, unknown[]]> = [];
  let result: { data: unknown; error: unknown } = { data: [], error: null };
  const builder: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'lte', 'order']) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.limit = (...args: unknown[]) => {
    calls.push(['limit', args]);
    return Promise.resolve(result);
  };
  const fromMock = vi.fn((table: string) => {
    calls.push(['from', [table]]);
    return builder;
  });
  (fromMock as unknown as { setResult: (r: typeof result) => void }).setResult = (r) => {
    result = r;
  };
  return { fromMock, calls };
});

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: fromMock } }));

import { LeadViewedListings, VIEWED_LISTINGS_SHOWN } from './LeadViewedListings';

const setResult = (r: { data: unknown; error: unknown }) =>
  (fromMock as unknown as { setResult: (x: typeof r) => void }).setResult(r);

function wrap(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const VISITOR = '33333333-3333-4333-8333-333333333333';
const lead = { user_id: 'agent-1', visitor_id: VISITOR, created_at: '2026-11-08T00:00:00Z' };

describe('LeadViewedListings (US-531)', () => {
  beforeEach(() => {
    calls.length = 0;
    fromMock.mockClear();
    setResult({ data: [], error: null });
  });

  it("lists the listings this lead's browser opened before getting in touch", async () => {
    setResult({
      data: [
        { target_id: 'l1', target_label: '12 Main St', occurred_at: '2026-11-07T10:00:00Z' },
        { target_id: 'l2', target_label: '40 Oak Ave', occurred_at: '2026-11-06T10:00:00Z' },
        { target_id: 'l1', target_label: '12 Main St', occurred_at: '2026-11-05T10:00:00Z' },
      ],
      error: null,
    });
    render(wrap(<LeadViewedListings lead={lead} />));

    expect(await screen.findByText('Viewed 2 listings before contacting you')).toBeInTheDocument();
    expect(screen.getByText('12 Main St')).toBeInTheDocument();
    expect(screen.getByText('40 Oak Ave')).toBeInTheDocument();

    expect(calls).toContainEqual(['from', ['analytics_events']]);
    expect(calls).toContainEqual(['eq', ['user_id', 'agent-1']]);
    expect(calls).toContainEqual(['eq', ['visitor_id', VISITOR]]);
    expect(calls).toContainEqual(['eq', ['event_type', 'listing_view']]);
    expect(calls).toContainEqual(['lte', ['occurred_at', lead.created_at]]);
  });

  it('names the first few and counts the rest', async () => {
    const total = VIEWED_LISTINGS_SHOWN + 2;
    setResult({
      data: Array.from({ length: total }, (_, i) => ({
        target_id: `l${i}`,
        target_label: `${i + 1} Elm St`,
        occurred_at: `2026-11-0${(i % 7) + 1}T10:00:00Z`,
      })),
      error: null,
    });
    render(wrap(<LeadViewedListings lead={lead} />));
    expect(
      await screen.findByText(`Viewed ${total} listings before contacting you`)
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(VIEWED_LISTINGS_SHOWN);
    expect(screen.getByText('and 2 more')).toBeInTheDocument();
  });

  it('asks nothing and shows nothing for a lead without a visitor id', () => {
    const { container } = render(wrap(<LeadViewedListings lead={{ ...lead, visitor_id: null }} />));
    expect(container).toBeEmptyDOMElement();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('shows nothing when the read fails', async () => {
    setResult({ data: null, error: { message: 'denied' } });
    const { container } = render(wrap(<LeadViewedListings lead={lead} />));
    await waitFor(() => expect(fromMock).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
