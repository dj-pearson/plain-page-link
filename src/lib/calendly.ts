/**
 * Calendly on the public profile (US-221).
 *
 * The production CSP allowed neither Calendly's script nor its iframe, so for
 * every agent with a calendly_url, "Schedule a Showing" — which replaces the
 * lead form for them — opened an empty box. Once it loads, a booking happens
 * inside Calendly's iframe and never reached the agent's CRM. These helpers
 * build the URL (listing and campaign carried along) and recognise the
 * booking message Calendly posts back, so the profile can record the lead.
 */

export const CALENDLY_SCRIPT = 'https://assets.calendly.com/assets/external/widget.js';
export const CALENDLY_ORIGIN = 'https://calendly.com';

export interface CalendlyUrlOptions {
  name?: string;
  email?: string;
  /** Shown to the agent as the first custom answer (a1). */
  listingAddress?: string;
  utm?: { utm_source?: string; utm_medium?: string; utm_campaign?: string };
}

/**
 * The agent's Calendly link with prefill and attribution added. Anything that
 * is not an https calendly.com URL is returned unchanged — it is the agent's
 * own setting, and this is not the place to reject it.
 */
export function buildCalendlyUrl(base: string, opts: CalendlyUrlOptions = {}): string {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return base;
  }
  if (url.protocol !== 'https:' || !/(^|\.)calendly\.com$/i.test(url.hostname)) return base;

  const set = (key: string, value: string | undefined) => {
    if (value) url.searchParams.set(key, value);
  };
  set('name', opts.name);
  set('email', opts.email);
  set('a1', opts.listingAddress);
  set('utm_source', opts.utm?.utm_source);
  set('utm_medium', opts.utm?.utm_medium);
  set('utm_campaign', opts.utm?.utm_campaign);
  return url.toString();
}

/** Whether a window message is Calendly reporting a completed booking. */
export function isCalendlyBooking(event: Pick<MessageEvent, 'origin' | 'data'>): boolean {
  if (event.origin !== CALENDLY_ORIGIN) return false;
  const data = event.data as { event?: unknown } | null;
  return typeof data === 'object' && data !== null && data.event === 'calendly.event_scheduled';
}

interface CalendlyGlobal {
  initInlineWidget(options: { url: string; parentElement: HTMLElement }): void;
}

let loading: Promise<CalendlyGlobal> | null = null;

/** Loads widget.js once and resolves with window.Calendly. */
export function loadCalendly(): Promise<CalendlyGlobal> {
  const existing = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;
  if (existing) return Promise.resolve(existing);
  if (loading) return loading;

  loading = new Promise<CalendlyGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CALENDLY_SCRIPT;
    script.async = true;
    script.onload = () => {
      const calendly = (window as unknown as { Calendly?: CalendlyGlobal }).Calendly;
      if (calendly) resolve(calendly);
      else reject(new Error('Calendly loaded without defining window.Calendly'));
    };
    script.onerror = () => {
      loading = null;
      reject(new Error('Calendly could not be loaded'));
    };
    document.body.appendChild(script);
  });
  return loading;
}
