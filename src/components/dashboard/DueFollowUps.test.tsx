/**
 * US-240: at 6pm in Los Angeles a follow-up due tomorrow showed as overdue,
 * because the stored UTC-midnight due date is 5pm today there.
 */
process.env.TZ = 'America/Los_Angeles';

import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';

const { tasksMock } = vi.hoisted(() => ({ tasksMock: { current: [] as unknown[] } }));

vi.mock('@/hooks/useLeadActivities', () => ({
  useDueLeadTasks: () => ({ data: tasksMock.current, isLoading: false }),
  useLeadActivities: () => ({ completeTask: vi.fn() }),
}));

import { DueFollowUps } from './DueFollowUps';

// 6pm on 28 October 2026 in Los Angeles; already the 29th in UTC.
const SIX_PM_LA = new Date('2026-10-29T01:00:00.000Z');

const task = (id: string, task_due_date: string) => ({
  id,
  lead_id: `lead-${id}`,
  title: `Task ${id}`,
  content: null,
  task_due_date,
  task_priority: null,
  leads: { name: `Lead ${id}` },
});

afterEach(() => {
  vi.useRealTimers();
});

describe('DueFollowUps in Los Angeles (US-240)', () => {
  it('does not call a task due tomorrow overdue this evening', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SIX_PM_LA);
    tasksMock.current = [
      // Written before US-240: the 29th as UTC midnight.
      task('legacy', '2026-10-29T00:00:00+00:00'),
      // Written after: the end of the 29th in LA.
      task('new', '2026-10-30T06:59:59.999+00:00'),
    ];
    renderWithProviders(<DueFollowUps />);

    expect(screen.getByText('Task legacy')).toBeInTheDocument();
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });

  it('does call yesterday’s task overdue', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(SIX_PM_LA);
    tasksMock.current = [task('late', '2026-10-28T06:59:59.999+00:00')];
    renderWithProviders(<DueFollowUps />);

    expect(screen.getByText('1 overdue')).toBeInTheDocument();
  });
});
