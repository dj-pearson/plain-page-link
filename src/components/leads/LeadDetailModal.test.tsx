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
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor, fireEvent } from '@/test/test-utils';
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

const {
  activitiesMock,
  logNoteMock,
  logCallMock,
  logEmailMock,
  logActivityMock,
  createTaskMock,
  logMeetingMock,
  deleteActivityMock,
} = vi.hoisted(() => ({
  activitiesMock: { current: [] as Record<string, unknown>[] },
  logNoteMock: vi.fn(),
  logCallMock: vi.fn(),
  logEmailMock: vi.fn(),
  logActivityMock: vi.fn(),
  createTaskMock: vi.fn(),
  logMeetingMock: vi.fn(),
  deleteActivityMock: vi.fn(),
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
      logEmail: logEmailMock,
      logActivity: logActivityMock,
      createTask: createTaskMock,
      completeTask: vi.fn(),
      isCreatingTask: false,
      logMeeting: logMeetingMock,
      isLoggingMeeting: false,
      deleteActivity: deleteActivityMock,
    }),
    useLeadsActivitySummaries: () => ({ data: [] }),
  };
});

import { LeadDetailModal } from './LeadDetailModal';
import { useAuthStore } from '@/stores/useAuthStore';
import type { User } from '@supabase/supabase-js';

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

  // US-246: a phone-only lead (US-228) got an envelope row with an empty
  // mailto: link at the top of its contact details.
  it('renders no email row for a phone-only lead', async () => {
    const phoneOnly = makeLead({ id: 'lead-phone', name: 'Cleo Phone', email: null });
    renderWithProviders(<LeadDetailModal lead={phoneOnly} open onOpenChange={noop} />);
    expect(await screen.findByText('Cleo Phone')).toBeInTheDocument();

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('a[href^="mailto:"]')).toBeNull();
    const tel = dialog.querySelector('a[href^="tel:"]');
    expect(tel).not.toBeNull();
    expect(tel).toHaveClass('min-h-[44px]');
  });
});

/**
 * US-264: the modal showed source, address and a `budget` key no form writes.
 * The buyer's price range, timeline, financing, property type and bedrooms —
 * columns and form_data alike — reached the database and were never shown,
 * and leads.listing_id was never read at all.
 */
describe('LeadDetailModal — what the form captured', () => {
  const noop = () => undefined;

  /** listings and profiles answer maybeSingle with the given rows. */
  const stubRows = (rows: Record<string, unknown>) => {
    fromMock.mockImplementation((table: string) => {
      const builder: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'update', 'insert', 'order', 'in']) {
        builder[m] = vi.fn(() => builder);
      }
      builder.maybeSingle = vi.fn(() =>
        Promise.resolve({ data: rows[table] ?? null, error: null })
      );
      builder.single = vi.fn(() => Promise.resolve({ data: { id: 'x' }, error: null }));
      builder.then = (resolve: (v: unknown) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolve);
      return builder;
    });
  };

  beforeEach(() => {
    activitiesMock.current = [];
    fromMock.mockReset();
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
    stubRows({});
  });

  it('lists every answer a buyer gave, under agent-facing labels', async () => {
    const buyer = makeLead({
      id: 'lead-buyer',
      name: 'Dana Buyer',
      lead_type: 'buyer',
      price_range: '750k-1m',
      timeline: 'immediate',
      preapproved: true,
      form_data: { propertyType: 'single-family', bedrooms: '4', preApprovalStatus: 'cash' },
    });
    renderWithProviders(<LeadDetailModal lead={buyer} open onOpenChange={noop} />);

    expect(await screen.findByText('What they told you')).toBeInTheDocument();
    expect(screen.getByText('$750k - $1M')).toBeInTheDocument();
    expect(screen.getByText('ASAP (0-30 days)')).toBeInTheDocument();
    expect(screen.getByText('Cash buyer')).toBeInTheDocument();
    expect(screen.getByText('Single Family Home')).toBeInTheDocument();
    expect(screen.getByText('4 Beds')).toBeInTheDocument();
  });

  it('shows the listing they asked about, with its status and a link to it', async () => {
    stubRows({
      listings: {
        id: 'listing-1',
        user_id: 'u1',
        address: '123 Main St',
        city: 'Austin',
        state: 'TX',
        price: '625000',
        status: 'pending',
        photos: ['https://example.com/a.jpg'],
        image: null,
      },
      profiles: { username: 'janedoe' },
    });
    const enquiry = makeLead({
      id: 'lead-listing',
      name: 'Eli Enquirer',
      lead_type: 'buyer',
      listing_id: 'listing-1',
      property_address: '123 Main St',
    });
    renderWithProviders(<LeadDetailModal lead={enquiry} open onOpenChange={noop} />);

    expect(await screen.findByText('Asked about')).toBeInTheDocument();
    expect(await screen.findByText('$625,000')).toBeInTheDocument();
    expect(screen.getByText('Austin, TX')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /123 Main St on the public page/ });
    expect(link.getAttribute('href')).toMatch(/\/janedoe\?listing=listing-1$/);
    // The address is not repeated as a loose "Property:" line.
    expect(screen.queryByText('Property:')).toBeNull();
  });

  it('says so when the listing has since been deleted', async () => {
    const enquiry = makeLead({
      id: 'lead-gone',
      name: 'Fay Gone',
      listing_id: 'listing-deleted',
      property_address: '9 Elm Rd',
    });
    renderWithProviders(<LeadDetailModal lead={enquiry} open onOpenChange={noop} />);
    expect(
      await screen.findByText('9 Elm Rd — this listing has since been removed.')
    ).toBeInTheDocument();
  });

  it('renders no answers block for a lead that gave none', async () => {
    const bare = makeLead({
      id: 'lead-bare',
      name: 'Gus Bare',
      lead_type: 'contact',
      price_range: null,
      timeline: null,
      preapproved: null,
      form_data: null,
    });
    renderWithProviders(<LeadDetailModal lead={bare} open onOpenChange={noop} />);
    expect(await screen.findByText('Gus Bare')).toBeInTheDocument();
    expect(screen.queryByText('What they told you')).toBeNull();
  });
});

/**
 * US-130 slice 2: quick responses only prefilled the notes box, follow-ups were
 * always 'medium', and logMeeting / deleteActivity had no UI at all.
 */
describe('LeadDetailModal — responding and keeping the timeline', () => {
  const noop = () => undefined;
  let updates: Record<string, unknown>[];
  const realLocation = window.location;
  let location: { href: string };

  beforeEach(() => {
    updates = [];
    activitiesMock.current = [];
    for (const m of [
      logNoteMock,
      logEmailMock,
      logActivityMock,
      createTaskMock,
      logMeetingMock,
      deleteActivityMock,
    ]) {
      m.mockReset();
    }
    fromMock.mockReset();
    rpcMock.mockReset();
    stubClient(updates);
    useAuthStore.setState({ user: { id: 'u1' } as User });
    location = { href: '' };
    Object.defineProperty(window, 'location', { configurable: true, value: location });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
    useAuthStore.setState({ user: null });
  });

  const lead = makeLead({
    id: 'lead-reply',
    name: 'Bram Newman',
    lead_type: 'buyer',
    status: 'new',
    contacted_at: null,
    email: 'bram@example.com',
    phone: '+1 (555) 010-2030',
  });

  const chooseTemplate = async (name: string) => {
    // Status is the first combobox, quick responses the second.
    await userEvent.click(screen.getAllByRole('combobox')[1]);
    await userEvent.click(await screen.findByRole('option', { name }));
  };

  it('previews the filled template instead of dropping it in the notes box', async () => {
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await screen.findByText('Bram Newman');
    await chooseTemplate('Buyer Follow-up');

    const body = await screen.findByLabelText('Message to Bram Newman');
    expect((body as HTMLTextAreaElement).value).toMatch(/^Hi Bram, I have some great properties/);
    expect(screen.getByPlaceholderText(/add a note/i)).toHaveValue('');
  });

  it('sends the reply by email and logs what was sent', async () => {
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await screen.findByText('Bram Newman');
    await chooseTemplate('Buyer Follow-up');
    await userEvent.click(await screen.findByRole('button', { name: /send email/i }));

    expect(location.href).toMatch(/^mailto:bram@example\.com\?subject=/);
    expect(decodeURIComponent(location.href)).toContain('Hi Bram, I have some great properties');
    await waitFor(() => expect(logEmailMock).toHaveBeenCalled());
    expect(logEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        leadId: 'lead-reply',
        recipient: 'bram@example.com',
        subject: 'Homes that match what you are looking for',
        body: expect.stringMatching(/^Hi Bram, I have some great properties/),
      })
    );
    // Same first-response handling as tapping the address.
    expect(updates[0]).toMatchObject({ status: 'contacted' });
    expect(screen.queryByTestId('quick-response-preview')).toBeNull();
  });

  it('sends the edited text by SMS to a phone-only lead and logs it', async () => {
    const phoneOnly = makeLead({ ...lead, id: 'lead-sms', email: null });
    renderWithProviders(<LeadDetailModal lead={phoneOnly} open onOpenChange={noop} />);
    await screen.findByText('Bram Newman');
    await chooseTemplate('Introduction');

    expect(screen.queryByRole('button', { name: /send email/i })).toBeNull();
    const body = await screen.findByLabelText('Message to Bram Newman');
    await userEvent.clear(body);
    await userEvent.type(body, 'Hi Bram, free Saturday?');
    await userEvent.click(screen.getByRole('button', { name: /send text/i }));

    expect(location.href).toBe(
      `sms:+15550102030?&body=${encodeURIComponent('Hi Bram, free Saturday?')}`
    );
    await waitFor(() => expect(logActivityMock).toHaveBeenCalled());
    expect(logActivityMock).toHaveBeenCalledWith(
      expect.objectContaining({ activityType: 'sms', content: 'Hi Bram, free Saturday?' })
    );
  });

  it('can still keep a template as a note', async () => {
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await screen.findByText('Bram Newman');
    await chooseTemplate('Seller Follow-up');
    await userEvent.click(await screen.findByRole('button', { name: /save as note/i }));

    expect((screen.getByPlaceholderText(/add a note/i) as HTMLTextAreaElement).value).toMatch(
      /^Hi Bram, I'd like to schedule a time to visit/
    );
    expect(logEmailMock).not.toHaveBeenCalled();
  });

  it('passes the chosen priority to createTask', async () => {
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await userEvent.type(await screen.findByLabelText(/add a follow-up/i), 'Send comps');
    fireEvent.change(screen.getByLabelText('Follow-up due date'), {
      target: { value: '2026-11-20' },
    });
    await userEvent.selectOptions(screen.getByLabelText('Follow-up priority'), 'high');
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({ leadId: 'lead-reply', title: 'Send comps', priority: 'high' })
    );
  });

  it('logs a meeting with its type, time and place', async () => {
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await userEvent.click(await screen.findByRole('button', { name: /log a meeting/i }));

    const save = screen.getByRole('button', { name: /save meeting/i });
    expect(save).toBeDisabled();

    await userEvent.selectOptions(screen.getByLabelText('Meeting type'), 'video');
    fireEvent.change(screen.getByLabelText('Meeting date and time'), {
      target: { value: '2026-11-10T14:30' },
    });
    await userEvent.type(screen.getByLabelText('Meeting location'), 'Zoom');
    await userEvent.type(screen.getByLabelText('Meeting notes'), 'Walked through financing');
    await userEvent.click(save);

    expect(logMeetingMock).toHaveBeenCalledTimes(1);
    const params = logMeetingMock.mock.calls[0][0];
    expect(params).toMatchObject({
      leadId: 'lead-reply',
      meetingType: 'video',
      location: 'Zoom',
      notes: 'Walked through financing',
    });
    expect((params.scheduledAt as Date).getTime()).toBe(new Date('2026-11-10T14:30').getTime());
    // The form closes once saved.
    expect(screen.queryByLabelText('Meeting type')).toBeNull();
  });

  it('shows a logged meeting with its time and location', async () => {
    activitiesMock.current = [
      {
        id: 'm1',
        user_id: 'u1',
        activity_type: 'meeting',
        title: 'Video meeting',
        meeting_type: 'video',
        meeting_location: 'Zoom',
        meeting_scheduled_at: new Date('2026-11-10T14:30').toISOString(),
        activity_at: '2026-11-07T10:00:00.000Z',
      },
    ];
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    expect(await screen.findByText('Video meeting · Nov 10, 2:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Zoom')).toBeInTheDocument();
  });

  it('lets the agent delete what they wrote, after a confirm, but never system rows', async () => {
    activitiesMock.current = [
      {
        id: 'note-mine',
        user_id: 'u1',
        activity_type: 'note',
        title: 'Note added',
        content: 'Wrong lead',
        activity_at: '2026-11-07T10:00:00.000Z',
      },
      {
        id: 'status-row',
        user_id: 'u1',
        activity_type: 'status_change',
        previous_status: 'new',
        new_status: 'contacted',
        activity_at: '2026-11-07T09:00:00.000Z',
      },
      {
        id: 'form-row',
        user_id: 'u1',
        activity_type: 'form_submission',
        title: 'Lead created',
        activity_at: '2026-11-07T08:00:00.000Z',
      },
      {
        id: 'note-teammate',
        user_id: 'someone-else',
        activity_type: 'note',
        title: 'Teammate note',
        activity_at: '2026-11-07T07:00:00.000Z',
      },
    ];
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await screen.findByText('Wrong lead');

    const deletes = screen.getAllByRole('button', { name: /^delete /i });
    expect(deletes).toHaveLength(1);
    expect(deletes[0]).toHaveAccessibleName('Delete Note added');

    await userEvent.click(deletes[0]);
    const confirm = await screen.findByRole('alertdialog');
    expect(confirm).toHaveTextContent('cannot be undone');
    expect(deleteActivityMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteActivityMock).toHaveBeenCalledWith('note-mine');
  });

  it('deletes nothing when the agent keeps the entry', async () => {
    activitiesMock.current = [
      {
        id: 'task-mine',
        user_id: 'u1',
        activity_type: 'task',
        title: 'Call back',
        task_due_date: '2026-11-20T08:00:00.000Z',
        activity_at: '2026-11-07T10:00:00.000Z',
      },
    ];
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={noop} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete Call back' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Keep it' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(deleteActivityMock).not.toHaveBeenCalled();
  });
});
