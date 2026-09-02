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
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
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

const { activitiesMock, logNoteMock, logCallMock } = vi.hoisted(() => ({
  activitiesMock: { current: [] as Record<string, unknown>[] },
  logNoteMock: vi.fn(),
  logCallMock: vi.fn(),
}));

// The timeline comes from lead_activities via this hook now; the modal used to
// read lead_notes, a second store no trigger ever wrote to (US-102).
vi.mock('@/hooks/useLeadActivities', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useLeadActivities: () => ({
      activities: activitiesMock.current,
      isLoading: false,
      logNote: logNoteMock,
      isLoggingNote: false,
      logCall: logCallMock,
      logEmail: vi.fn(),
      logActivity: vi.fn(),
    }),
    useLeadsActivitySummaries: () => ({ data: [] }),
  };
});

import { LeadDetailModal } from './LeadDetailModal';

// Radix Select uses pointer capture and scrollIntoView, neither of which jsdom
// implements; without these stubs the listbox never opens.
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
});

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
    activitiesMock.current = [];
    logNoteMock.mockReset();
    logCallMock.mockReset();
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

    await waitFor(() => expect(logCallMock).toHaveBeenCalled());
    // 'initiated', not 'answered': the browser knows the dialer opened, not
    // that anyone picked up (US-101).
    expect(logCallMock).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: fresh.id, outcome: 'initiated' })
    );
  });

  // US-102: the modal read lead_notes while every trigger wrote
  // lead_activities, so the timeline was missing the lead's own creation,
  // every status change, and every call and email.
  describe('the activity timeline', () => {
    it('renders the events the triggers and RPCs record, not just notes', async () => {
      activitiesMock.current = [
        {
          id: 'a1',
          activity_type: 'status_change',
          previous_status: 'new',
          new_status: 'contacted',
          activity_at: '2026-09-01T10:00:00.000Z',
          is_internal: true,
        },
        {
          id: 'a2',
          activity_type: 'call',
          call_outcome: 'initiated',
          call_duration_seconds: 120,
          activity_at: '2026-09-01T11:00:00.000Z',
        },
        {
          id: 'a3',
          activity_type: 'email',
          email_subject: 'Maple Avenue',
          activity_at: '2026-09-01T12:00:00.000Z',
        },
        {
          id: 'a4',
          activity_type: 'form_submission',
          title: 'Lead created',
          activity_at: '2026-09-01T09:00:00.000Z',
        },
      ];

      renderWithProviders(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);

      // The status change carries its PREVIOUS value, which the hand-written
      // note it replaced never did.
      expect(await screen.findByText('Status: new → contacted')).toBeInTheDocument();
      expect(screen.getByText(/Call \(initiated\)/)).toBeInTheDocument();
      expect(screen.getByText('Email: Maple Avenue')).toBeInTheDocument();
      expect(screen.getByText('Lead created')).toBeInTheDocument();
    });

    it('adds a note through logNote rather than writing to a second store', async () => {
      renderWithProviders(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);

      await userEvent.type(
        await screen.findByPlaceholderText(/add a note/i),
        'Wants a weekend viewing'
      );
      await userEvent.click(screen.getByRole('button', { name: /add note/i }));

      expect(logNoteMock).toHaveBeenCalledWith({
        leadId: fresh.id,
        content: 'Wants a weekend viewing',
      });
    });

    it('does not write its own note on a status change', async () => {
      renderWithProviders(<LeadDetailModal lead={fresh} open onOpenChange={noop} />);
      await screen.findByText('Bram New');

      // Two Selects are on screen (status and quick responses); the status one
      // is first.
      await userEvent.click(screen.getAllByRole('combobox')[0]);
      await userEvent.click(await screen.findByRole('option', { name: 'Qualified' }));

      await waitFor(() => expect(updates.length).toBeGreaterThan(0));
      // auto_log_lead_status_change already records this, with the previous
      // status the note never carried.
      expect(logNoteMock).not.toHaveBeenCalled();
    });
  });
});
