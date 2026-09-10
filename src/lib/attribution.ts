/**
 * Where a lead came from.
 *
 * `leads` carries utm_source, utm_medium, utm_campaign and device, and
 * submit-lead accepts, sanitises and writes all four (index.ts:110-113,
 * 177-180). Nothing ever sent them. Every lead the platform has ever captured
 * has four NULLs where its attribution should be — so an agent boosting a post
 * on Instagram, running a Facebook lead campaign and printing a QR code on a
 * yard sign has no way to tell which of the three produced the enquiry, on a
 * product sold as turning agents into data-driven closers.
 *
 * The columns were never the missing part. Reading the URL was.
 *
 * Attribution is captured per browsing session rather than per page: a visitor
 * lands on /janedoe?utm_source=instagram, taps three listings and opens the
 * lead form ten minutes later, by which time the landing query string is long
 * gone from the address bar. sessionStorage keeps it for exactly as long as
 * that visit lasts, which is the window the attribution is about.
 */

import { getDeviceClass } from '@/lib/analyticsEvents';
import { logger } from '@/lib/logger';

const STORAGE_KEY = 'agentbio_attribution';

/** UTM parameter name -> the `leads` column it lands in. */
const UTM_PARAMS = {
  utm_source: 'utm_source',
  utm_medium: 'utm_medium',
  utm_campaign: 'utm_campaign',
} as const;

/** How long a stored touch stays authoritative, in ms. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Longest value we will store or send. submit-lead sanitises again server-side. */
const MAX_VALUE_LENGTH = 255;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  /** The referrer of the page the campaign parameters arrived on. */
  landing_referrer?: string;
}

interface StoredAttribution extends Attribution {
  capturedAt: number;
}

function readStore(): StoredAttribution | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAttribution;
    if (typeof parsed?.capturedAt !== 'number') return null;
    // A session that has been open for a day is no longer the visit the
    // campaign click started.
    if (Date.now() - parsed.capturedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    // Safari private mode throws on sessionStorage; an unattributed lead is
    // better than a lost one.
    return null;
  }
}

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_VALUE_LENGTH);
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Record the campaign parameters on `search`, if it carries any.
 *
 * A URL with no UTM parameters is not a new touch and must not erase the one
 * already stored — otherwise the internal navigation from /janedoe?utm_source=ig
 * to /janedoe?listing=<id> would throw the attribution away one click after it
 * arrived. A URL that *does* carry them is a fresh click from a fresh campaign
 * and replaces what was there: last non-empty touch wins.
 *
 * Returns what is now stored, so a caller can act on it without a second read.
 */
export function captureAttribution(
  search: string = typeof window === 'undefined' ? '' : window.location.search,
  referrer: string = typeof document === 'undefined' ? '' : document.referrer
): Attribution | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search);
  } catch {
    return getAttribution();
  }

  const touch: Attribution = {};
  for (const param of Object.keys(UTM_PARAMS) as (keyof typeof UTM_PARAMS)[]) {
    const value = clean(params.get(param));
    if (value) touch[UTM_PARAMS[param]] = value;
  }

  if (Object.keys(touch).length === 0) return getAttribution();

  const landing = clean(referrer);
  if (landing) touch.landing_referrer = landing;

  try {
    const stored: StoredAttribution = { ...touch, capturedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    // Storage is unavailable or full. The touch is still returned so a
    // submission on this very page is attributed; only the carry-over is lost.
    logger.debug('Could not persist attribution', { error: String(error) });
  }

  return touch;
}

/** What was captured for this visit, or null if this visit had no campaign. */
export function getAttribution(): Attribution | null {
  const stored = readStore();
  if (!stored) return null;
  const { capturedAt: _capturedAt, ...attribution } = stored;
  return Object.keys(attribution).length > 0 ? attribution : null;
}

/**
 * The attribution fields to send with a lead: the campaign, if there was one,
 * plus the device class, which is known for every visitor and was equally
 * never sent.
 */
export function getLeadAttribution(): {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  device?: string;
} {
  const attribution = getAttribution();
  return {
    utm_source: attribution?.utm_source,
    utm_medium: attribution?.utm_medium,
    utm_campaign: attribution?.utm_campaign,
    device: getDeviceClass(),
  };
}

/** Test seam: forget this visit's campaign. */
export function clearAttribution(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}
