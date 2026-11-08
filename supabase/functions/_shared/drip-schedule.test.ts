import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BIO_DRIP_DAY, BIO_DRIP_SEQUENCE_NUMBERS } from './bio-drip-emails';
import {
  dripLookbackDays,
  dripOrder,
  isFinalDripEmail,
  lastDripDay,
  nextDueDripEmail,
  wholeDaysSince,
} from './drip-schedule';
import { LISTING_DRIP, LISTING_DRIP_DAY } from './listing-drip';

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf-8');

describe('nextDueDripEmail (US-479)', () => {
  it('sends nothing before the first email is due', () => {
    expect(nextDueDripEmail(BIO_DRIP_DAY, 0, [])).toBeUndefined();
  });

  it('picks the earliest due email that has not been sent', () => {
    expect(nextDueDripEmail(BIO_DRIP_DAY, 1, [])).toBe(2);
    expect(nextDueDripEmail(BIO_DRIP_DAY, 2, [2])).toBe(3);
  });

  it('never picks an email that was already sent, so a second run the same day sends nothing', () => {
    expect(nextDueDripEmail(BIO_DRIP_DAY, 2, [2, 3])).toBeUndefined();
    expect(nextDueDripEmail(LISTING_DRIP_DAY, 1, [1])).toBeUndefined();
  });

  it('catches up in order after a missed run or a failed send', () => {
    // The job did not run on days 1-3: the day-1 email still goes first.
    expect(nextDueDripEmail(BIO_DRIP_DAY, 4, [])).toBe(2);
    // Email 4 failed on day 3; on day 5 it is retried before email 5.
    expect(nextDueDripEmail(BIO_DRIP_DAY, 5, [2, 3])).toBe(4);
  });

  it('only reaches the last email once every other one is sent', () => {
    expect(nextDueDripEmail(BIO_DRIP_DAY, 30, [2, 3, 4, 5, 6])).toBe(7);
    expect(nextDueDripEmail(BIO_DRIP_DAY, 30, [2, 3, 4, 5, 6, 7])).toBeUndefined();
    expect(isFinalDripEmail(BIO_DRIP_DAY, 7)).toBe(true);
    expect(isFinalDripEmail(BIO_DRIP_DAY, 6)).toBe(false);
    expect(isFinalDripEmail(LISTING_DRIP_DAY, 7)).toBe(true);
  });
});

describe('bio drip window (US-449)', () => {
  it('looks back further than the last due day, so email 7 has whole days to send', () => {
    const maxDay = Math.max(...BIO_DRIP_SEQUENCE_NUMBERS.map((n) => BIO_DRIP_DAY[n]));
    expect(lastDripDay(BIO_DRIP_DAY)).toBe(maxDay);
    expect(dripLookbackDays(BIO_DRIP_DAY)).toBeGreaterThan(maxDay + 1);
  });

  it('a capture 7 days and a few hours old is inside the window and due email 7', () => {
    const now = new Date('2026-11-08T12:00:00Z');
    const created = new Date(now.getTime() - (7 * 24 + 3) * 3_600_000);
    const days = wholeDaysSince(created, now);
    expect(days).toBe(7);
    expect(days).toBeLessThan(dripLookbackDays(BIO_DRIP_DAY));
    expect(nextDueDripEmail(BIO_DRIP_DAY, days, [2, 3, 4, 5, 6])).toBe(7);
  });

  it('the sender uses the shared window, not a hard-coded 7 days', () => {
    const src = read('supabase/functions/send-scheduled-bio-emails/index.ts');
    expect(src).toContain('dripLookbackDays(BIO_DRIP_DAY)');
    expect(src).toContain('nextDueDripEmail(');
    expect(src).not.toMatch(/getDate\(\)\s*-\s*7/);
  });
});

describe('wholeDaysSince', () => {
  const now = new Date('2026-11-08T12:00:00Z');
  it('floors to whole days and never goes negative', () => {
    expect(wholeDaysSince('2026-11-07T12:00:01Z', now)).toBe(0);
    expect(wholeDaysSince('2026-11-07T12:00:00Z', now)).toBe(1);
    expect(wholeDaysSince('2026-11-09T00:00:00Z', now)).toBe(0);
    expect(wholeDaysSince('not a date', now)).toBe(0);
  });
});

describe('listing drip schedule (US-479)', () => {
  it('matches the sequence rows init_listing_email_sequence() creates', () => {
    const baseline = read('supabase/migrations/20260806000005_squashed_baseline.sql');
    const fn = baseline.slice(baseline.indexOf('CREATE FUNCTION public.init_listing_email_sequence()'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    const seeded = [...body.matchAll(/\(NEW\.id,\s*(\d+),/g)].map((m) => Number(m[1]));
    expect(seeded.sort((a, b) => a - b)).toEqual(dripOrder(LISTING_DRIP_DAY));
  });

  it('matches get_pending_listing_emails(): email n is due on day n', () => {
    const baseline = read('supabase/migrations/20260806000005_squashed_baseline.sql');
    const fn = baseline.slice(baseline.indexOf('CREATE FUNCTION public.get_pending_listing_emails()'));
    const body = fn.slice(0, fn.indexOf('$$;'));
    const rules = [...body.matchAll(/les\.sequence_number = (\d+) AND .*?>= (\d+)\)/g)].map((m) => [
      Number(m[1]),
      Number(m[2]),
    ]);
    expect(Object.fromEntries(rules)).toEqual(LISTING_DRIP_DAY);
  });

  it('has HTML for every scheduled email, and the sender no longer looks up by exact day', () => {
    const src = read('supabase/functions/send-scheduled-listing-emails/index.ts');
    const htmlKeys = [...src.matchAll(/^ {4}(\d+): `<!-- Email/gm)].map((m) => Number(m[1]));
    expect(htmlKeys).toEqual(dripOrder(LISTING_DRIP_DAY));
    expect(src).toContain('nextDueDripEmail(');
    expect(src).not.toContain('EMAIL_SCHEDULE[');
    for (const n of dripOrder(LISTING_DRIP_DAY)) {
      expect(LISTING_DRIP[n].subject.length).toBeGreaterThan(0);
    }
  });
});
