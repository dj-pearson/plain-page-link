/**
 * US-101: the modal showed the PREVIOUS lead's status and draft note.
 *
 * Leads.tsx keeps one instance mounted and swaps the `lead` prop, but useState
 * reads its initial value only on mount. Opening a 'converted' lead and then a
 * 'new' one showed the second as Converted, with the first lead's half-typed
 * note still in the box — and saving from there wrote one lead's note onto
 * another. Only loadNotes() re-ran.
 *
 * The rerender-with-a-different-lead sequence is the whole point of these, so
 * they mount the modal once and swap the prop, exactly as the page does.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { makeLead } from '@/test/fixtures/lead';

const { fromMock, rpcMock } = vi.hoisted(() => ({ fromMock: vi.fn(), rpcMock: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } } })) },
  },
  supabaseConfig: {
    url: 'http://localhost:54321',
    anonKey: 'test-anon-key',
    functionsUrl: 'http://localhost:54321/functions/v1',
  },
}));

vi.mock('@/hooks/useMLLeadScoring', () => ({
  useLeadScore: () => null,
  useMLLeadScoring: () => ({ scoreLeadObject: () => null }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { LeadDetailModal } from './LeadDetailModal';

/** A chainable builder that resolves to no rows and records the updates made. */
const stubClient = (updates: Record<string, unknown>[]) => {
  fromMock.mockImplementation(() => {
    const builder: Record<string, unknown> = {};
    builder.update = vi.fn((values: Record<string, unknown>) => {
      updates.push(values);
      return builder;
    });
    for (const m of ['select', 'eq', 'insert', 'order', 'in']) {
      builder[m] = vi.fn(() => builder);
    }
    builder.single = vi.fn(() => Promise.resolve({ data: { id: 'x' }, error: null }));
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(resolve);
    return builder;
  });
  rpcMock.mockResolvedValue({ data: 'activity-1', error: null });
};

const converted = makeLead({
  id: 'lead-converted',
  name: 'Ada Converted',
  status: 'converted',
  contacted_at: '2026-03-01T13:00:00.000Z',
});
const fresh = makeLead({
  id: 'lead-new',
  name: 'Bram New',
  status: 'new',
  contacted_at: null,
});

describe('LeadDetailModal', () => {
  let updates: Record<string, unknown>[];

  beforeEach(() => {
    updates = [];
    fromMock.mockReset();
    rpcMock.mockReset();
    stubClient(updates);
  });

  const noop = () => undefined;

  it('shows the second lead’s own status, not the first one’s', async () => {
    const { rerender } = renderWithProviders(
      <LeadDetailModal lead={converted} open onOpenChange={noop} />
    );
    expect(await screen.findByText('Ada Converted')).toBeInTheDocument();
    expect(screen.getByText('Converted')).toBeInTheDocument();

    rerender(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);

    expect(await screen.findByText('Bram New')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('New')).toBeInTheDocument());
    expect(screen.queryByText('Converted')).not.toBeInTheDocument();
  });

  it('does not carry a half-typed note across to the next lead', async () => {
    const { rerender } = renderWithProviders(
      <LeadDetailModal lead={converted} open onOpenChange={noop} />
    );
    const box = await screen.findByPlaceholderText(/add a note/i);
    await userEvent.type(box, 'Spoke to Ada about the Maple offer');
    expect(box).toHaveValue('Spoke to Ada about the Maple offer');

    rerender(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);

    await waitFor(() => expect(screen.getByPlaceholderText(/add a note/i)).toHaveValue(''));
  });

  it('records the response when the agent taps the phone number', async () => {
    renderWithProviders(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);

    await userEvent.click(await screen.findByText(fresh.phone!));

    await waitFor(() => expect(updates.length).toBeGreaterThan(0));
    expect(updates[0]).toMatchObject({ status: 'contacted' });
    expect(updates[0].contacted_at).toEqual(expect.any(String));
  });

  it('logs the call to the timeline through log_lead_call', async () => {
    renderWithProviders(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);

    await userEvent.click(await screen.findByText(fresh.phone!));

    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
    expect(rpcMock).toHaveBeenCalledWith(
      'log_lead_call',
      expect.objectContaining({ _lead_id: fresh.id, _outcome: 'initiated' })
    );
  });
});
