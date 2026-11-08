/**
 * When a free-tool drip email is due (US-479).
 *
 * Both lead-magnet drips (the Instagram Bio Analyzer and the listing
 * description generator) used to work out "what to send now" in ways that lost
 * emails:
 *
 *   - send-scheduled-bio-emails only read captures created in the last 7 days,
 *     but email 7 is due on day 7. A capture is 7 whole days old for exactly
 *     the instant it leaves that window, so email 7 never went out and the
 *     sequence was never marked complete (US-449).
 *   - send-scheduled-listing-emails looked the email up by the exact day count
 *     (EMAIL_SCHEDULE[days_since_capture]), keyed one day later than the
 *     database's own schedule. A day on which the job did not run, or a send
 *     that failed, lost that email for good, and it never checked what had
 *     already been sent, so a second run on the same day sent the same email
 *     again.
 *
 * Both now ask the same question: of the emails that are due and have not been
 * sent, which comes first? A missed run or a failed send is picked up by the
 * next run, and an email already sent is never chosen again.
 *
 * Pure, no Deno globals, so vitest covers it.
 */

/** sequence number -> days after capture at which it becomes due. */
export type DripSchedule = Readonly<Record<number, number>>;

/**
 * How many days past the last due day a capture is still worked. A run that
 * was missed, or a send that failed, is retried within this window; after it
 * the capture is left alone rather than retried forever.
 */
export const DRIP_GRACE_DAYS = 7;

/** Sequence numbers in send order (by due day, then number). */
export function dripOrder(schedule: DripSchedule): number[] {
  return Object.keys(schedule)
    .map(Number)
    .sort((a, b) => schedule[a] - schedule[b] || a - b);
}

/** The day the last email in the schedule becomes due. */
export function lastDripDay(schedule: DripSchedule): number {
  return Math.max(...Object.values(schedule));
}

/**
 * How far back, in days, the sender must look for captures. Strictly greater
 * than the last due day, so the last email always has whole days to go out.
 */
export function dripLookbackDays(schedule: DripSchedule): number {
  return lastDripDay(schedule) + DRIP_GRACE_DAYS;
}

/** Whole days elapsed since the capture, never negative. */
export function wholeDaysSince(createdAt: string | Date, now: Date = new Date()): number {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const ms = now.getTime() - created.getTime();
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.floor(ms / 86_400_000);
}

/**
 * The first email that is due and not yet sent, or undefined when nothing is
 * due. Earlier emails go first, so a capture that fell behind catches up in
 * order, and the last email is only ever chosen once every other one is sent.
 */
export function nextDueDripEmail(
  schedule: DripSchedule,
  daysSinceCapture: number,
  sentNumbers: readonly number[]
): number | undefined {
  const sent = new Set(sentNumbers);
  return dripOrder(schedule).find((n) => daysSinceCapture >= schedule[n] && !sent.has(n));
}

/** True when this sequence number is the last one in the schedule. */
export function isFinalDripEmail(schedule: DripSchedule, sequenceNumber: number): boolean {
  const order = dripOrder(schedule);
  return order[order.length - 1] === sequenceNumber;
}
