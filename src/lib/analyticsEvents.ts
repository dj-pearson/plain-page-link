/**
 * Public-page interaction tracking (US-115).
 *
 * Call, Email and Text taps were `logger.info('Contact clicked', { method })` —
 * written to the visitor's own console and nowhere else. An agent never learned
 * that thirty people tapped Call this week, which is close to the most useful
 * thing a link-in-bio page can tell them.
 *
 * Everything here is fire-and-forget: a tracking failure must never interfere
 * with the action the visitor actually took (placing the call, opening the
 * mail client, following the link).
 */
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const VISITOR_ID_KEY = 'visitor_id';

/** The event types `analytics_events.event_type` accepts (the CHECK constraint). */
export type AnalyticsEventType = 'link_click' | 'contact_call' | 'contact_email' | 'contact_text';

/** The contact methods ContactButtons and StickyActionBar report. */
export type ContactMethod = 'call' | 'phone' | 'email' | 'text' | 'sms';

const CONTACT_EVENT: Record<ContactMethod, AnalyticsEventType> = {
  call: 'contact_call',
  phone: 'contact_call',
  email: 'contact_email',
  text: 'contact_text',
  sms: 'contact_text',
};

/**
 * A stable-per-browser id, generated on the client.
 *
 * It is not an identity and never has been: it lives in localStorage, it is
 * trivially rotated, and every counter derived from it is therefore indicative
 * rather than measured. The Analytics page says so. Its real job is bucketing
 * for the rate limits that stop one visitor inflating an agent's numbers.
 *
 * Returns null rather than throwing where storage is unavailable (private
 * windows, storage disabled) — an untracked visit is better than a broken page.
 */
export function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let id = window.localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_ID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Coarse device class, matching what analytics_views records. */
export function getDeviceClass(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

interface RecordEventInput {
  /** The agent whose page the interaction happened on. */
  userId: string;
  eventType: AnalyticsEventType;
  targetId?: string | null;
  /** A human label for the dashboard — a link's title, or the contact method. */
  targetLabel?: string | null;
}

/**
 * Write one interaction. Never throws.
 *
 * The insert is bounded server-side by the same per-visitor ceiling as
 * analytics_views, and the RLS policy requires the target profile to be
 * published — so this cannot be used to write rows against private accounts.
 */
export async function recordAnalyticsEvent({
  userId,
  eventType,
  targetId = null,
  targetLabel = null,
}: RecordEventInput): Promise<void> {
  if (!userId) return;

  try {
    const { error } = await supabase.from('analytics_events').insert({
      user_id: userId,
      visitor_id: getVisitorId(),
      event_type: eventType,
      target_id: targetId,
      target_label: targetLabel,
      device: getDeviceClass(),
    });
    if (error) {
      logger.warn('Failed to record an analytics event', { eventType });
    }
  } catch (error) {
    logger.error('Error recording analytics event', error);
  }
}

/**
 * A Call / Email / Text tap on a public profile.
 *
 * An unrecognised method is not recorded rather than guessed at: the column has
 * a CHECK constraint, and an invented value would fail the insert anyway.
 */
export async function trackContactTap(userId: string | undefined, method: string): Promise<void> {
  if (!userId) return;
  const eventType = CONTACT_EVENT[method.toLowerCase() as ContactMethod];
  if (!eventType) return;

  await recordAnalyticsEvent({
    userId,
    eventType,
    targetLabel: method.toLowerCase(),
  });
}
