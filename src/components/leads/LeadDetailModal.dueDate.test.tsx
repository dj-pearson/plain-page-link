/**
 * US-240: the follow-up form's date input round-trip, in Los Angeles.
 *
 * The modal stored a picked day as `new Date(day).toISOString()` — UTC
 * midnight, i.e. 5pm the day before in LA — and prefilled "today" with
 * `toISOString().slice(0, 10)`, which after 5pm LA is tomorrow.
 */
process.env.TZ = 'America/Los_Angeles';

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderWithProviders, screen, fireEvent, waitFor } from '@/test/test-utils';
import { makeLead } from '@/test/fixtures/lead';

vi.mock('@/integrations/supabase/client', () => {
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'insert', 'update', 'order', 'in']) builder[m] = () => builder;
  builder.single = () => Promise.resolve({ data: null, error: null });
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve({ data: [], error: null }).then(resolve);
  return {
    supabase: {
      from: () => builder,
      rpc: () => Promise.resolve({ data: null, error: null }),
      auth: { getUser: () => Promise.resolve({ data: { user: { id: 'u1' } } }) },
    },
    supabaseConfig: {
      url: 'http://localhost:54321',
      anonKey: 'test-anon-key',
      functionsUrl: 'http://localhost:54321/functions/v1',
    },
  };
});

vi.mock('@/hooks/useMLLeadScoring', () => ({
  useLeadScore: () => null,
  useMLLeadScoring: () => ({ scoreLeadObject: () => null }),
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/lib/leadNextStep', () => ({
  getLeadNextStep: () => ({
    action: 'task',
    label: 'Check in today',
    rationale: 'test',
    urgency: 'today',
  }),
}));

const { createTaskMock } = vi.hoisted(() => ({ createTaskMock: vi.fn() }));

vi.mock('@/hooks/useLeadActivities', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    useLeadActivities: () => ({
      activities: [],
      isLoading: false,
      logNote: vi.fn(),
      isLoggingNote: false,
      logCall: vi.fn(),
      logEmail: vi.fn(),
      logActivity: vi.fn(),
      createTask: createTaskMock,
      completeTask: vi.fn(),
      isCreatingTask: false,
    }),
    useLeadsActivitySummaries: () => ({ data: [] }),
  };
});

import { LeadDetailModal } from './LeadDetailModal';

// 6pm on 28 October 2026 in Los Angeles; already the 29th in UTC.
const SIX_PM_LA = new Date('2026-10-29T01:00:00.000Z');
const lead = makeLead({ id: 'lead-1', name: 'Cleo Due', status: 'contacted' });

afterEach(() => {
  vi.useRealTimers();
  createTaskMock.mockReset();
});

describe('LeadDetailModal follow-up due date (US-240)', () => {
  it('stores a task due tomorrow as the end of tomorrow, locally', async () => {
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={() => undefined} />);

    fireEvent.change(await screen.findByPlaceholderText(/call back about/i), {
      target: { value: 'Send comps' },
    });
    fireEvent.change(screen.getByLabelText('Follow-up due date'), {
      target: { value: '2026-10-29' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(createTaskMock).toHaveBeenCalledTimes(1);
    const { dueDate } = createTaskMock.mock.calls[0][0] as { dueDate: string };
    // Old code: '2026-10-29T00:00:00.000Z' — 5pm on the 28th here.
    expect(dueDate).toBe('2026-10-30T06:59:59.999Z');
    expect(new Date(dueDate).getDate()).toBe(29);
  });

  it('prefills "today" with the local date in the evening', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SIX_PM_LA);
    renderWithProviders(<LeadDetailModal lead={lead} open onOpenChange={() => undefined} />);

    const [nextStepButton] = await screen.findAllByRole('button', { name: 'Check in today' });
    fireEvent.click(nextStepButton);

    // Old code: '2026-10-29', the UTC date.
    await waitFor(() =>
      expect(screen.getByLabelText('Follow-up due date')).toHaveValue('2026-10-28')
    );
  });
});
