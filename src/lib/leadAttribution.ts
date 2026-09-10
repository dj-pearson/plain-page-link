/**
 * Reading a lead's origin back out.
 *
 * US-188 started filling utm_source, utm_medium, utm_campaign and device on
 * every public lead. Nothing in the dashboard read any of them — the lead
 * detail showed `source`, a string the *form* chose ('contact_form',
 * 'listing_inquiry'), which says which button the visitor pressed and nothing
 * about how they found the page.
 *
 * This module answers the question an agent actually has: was that lead worth
 * the ad spend. It is deliberately conservative — it reports what the lead
 * recorded and says so plainly when the lead recorded nothing, rather than
 * inventing a channel. Every lead captured before US-188 has nothing to
 * report, and pretending otherwise would make the first month of the report a
 * lie.
 */

import type { Lead } from '@/types/lead';

/** The lead fields this module reads. Loose so an analytics row works too. */
export interface LeadOriginFields {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_url?: string | null;
  device?: string | null;
  source?: string | null;
}

export type OriginConfidence =
  /** The visit carried UTM parameters: the campaign said where it came from. */
  | 'campaign'
  /** No campaign, but a referring site: inferred from the referrer's host. */
  | 'referral'
  /** A visit with neither. Typed, bookmarked, or a referrer the browser hid. */
  | 'direct'
  /** Captured before attribution existed. Not the same as 'direct'. */
  | 'unrecorded';

export interface LeadOrigin {
  /**
   * A stable key to group by. Lower case, so 'Instagram' and 'instagram'
   * are one channel in a breakdown.
   */
  channel: string;
  /** The channel, written for a human. */
  label: string;
  /** How much the channel is worth trusting. */
  confidence: OriginConfidence;
  /** The campaign, when there was one. */
  campaign: string | null;
  /** The medium, when there was one. */
  medium: string | null;
  /** The referring site's host, when the browser sent one. */
  referrerHost: string | null;
  /** 'mobile' | 'desktop' as recorded, or null for a lead captured before US-188. */
  device: string | null;
}

/** Hosts worth naming rather than showing as a bare domain. */
const KNOWN_HOSTS: Record<string, string> = {
  'instagram.com': 'Instagram',
  'l.instagram.com': 'Instagram',
  'facebook.com': 'Facebook',
  'l.facebook.com': 'Facebook',
  'm.facebook.com': 'Facebook',
  'linkedin.com': 'LinkedIn',
  'lnkd.in': 'LinkedIn',
  'tiktok.com': 'TikTok',
  'youtube.com': 'YouTube',
  'zillow.com': 'Zillow',
  'realtor.com': 'Realtor.com',
  'google.com': 'Google',
  'bing.com': 'Bing',
  't.co': 'X',
  'x.com': 'X',
};

/** Campaign sources worth naming rather than echoing back verbatim. */
const KNOWN_SOURCES: Record<string, string> = {
  instagram: 'Instagram',
  ig: 'Instagram',
  facebook: 'Facebook',
  fb: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  google: 'Google',
  bing: 'Bing',
  email: 'Email',
  newsletter: 'Newsletter',
  qr: 'QR code',
  sms: 'Text message',
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * The host of `referrer_url`, with a leading `www.` dropped, or null if it is
 * absent, unparseable, or points back at this site.
 */
export function referrerHost(url: string | null | undefined, selfHost?: string): string | null {
  const raw = clean(url);
  if (!raw) return null;
  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase();
  } catch {
    return null;
  }
  host = host.replace(/^www\./, '');
  // ContactBlock sends window.location.href as referrer_url, so a lead from a
  // page-builder page names this site. That is not a referral.
  if (selfHost && host === selfHost.toLowerCase().replace(/^www\./, '')) return null;
  return host || null;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Where a lead came from, as far as the lead itself can say.
 *
 * `selfHost` lets the caller exclude its own domain from being read as a
 * referral; it defaults to the current page's host in a browser.
 */
export function describeLeadOrigin(
  lead: LeadOriginFields,
  selfHost: string | undefined = typeof window === 'undefined'
    ? undefined
    : window.location.hostname
): LeadOrigin {
  const utmSource = clean(lead.utm_source);
  const medium = clean(lead.utm_medium);
  const campaign = clean(lead.utm_campaign);
  const host = referrerHost(lead.referrer_url, selfHost);
  const device = clean(lead.device);

  if (utmSource) {
    const channel = utmSource.toLowerCase();
    return {
      channel,
      label: KNOWN_SOURCES[channel] ?? titleCase(utmSource),
      confidence: 'campaign',
      campaign,
      medium,
      referrerHost: host,
      device,
    };
  }

  // A campaign named only by medium or campaign name is still a campaign; it
  // just cannot say which source. Reporting it as 'direct' would credit the
  // wrong channel, which is worse than admitting the source is missing.
  if (medium || campaign) {
    return {
      channel: (medium ?? campaign ?? 'campaign').toLowerCase(),
      label: medium ? titleCase(medium) : `Campaign: ${campaign}`,
      confidence: 'campaign',
      campaign,
      medium,
      referrerHost: host,
      device,
    };
  }

  if (host) {
    return {
      channel: host,
      label: KNOWN_HOSTS[host] ?? host,
      confidence: 'referral',
      campaign: null,
      medium: null,
      referrerHost: host,
      device,
    };
  }

  // Nothing at all. A lead captured before US-188 and a genuinely direct visit
  // look identical in the row, and `device` is the one thing US-188 always
  // sends — so its absence is what tells them apart. This is a guess about
  // vintage, not about channel, and it only ever changes the wording.
  return {
    channel: device ? 'direct' : 'unrecorded',
    label: device ? 'Direct' : 'Not recorded',
    confidence: device ? 'direct' : 'unrecorded',
    campaign: null,
    medium: null,
    referrerHost: null,
    device,
  };
}

/** Count leads per channel, most first. Ties break alphabetically so the order is stable. */
export function groupLeadsByChannel(
  leads: LeadOriginFields[],
  selfHost?: string
): { channel: string; label: string; count: number }[] {
  const buckets = new Map<string, { channel: string; label: string; count: number }>();

  for (const lead of leads) {
    const origin = describeLeadOrigin(lead, selfHost);
    const existing = buckets.get(origin.channel);
    if (existing) existing.count += 1;
    else buckets.set(origin.channel, { channel: origin.channel, label: origin.label, count: 1 });
  }

  return [...buckets.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/** One line for a CSV cell or a table row. */
export function formatOrigin(lead: Lead | LeadOriginFields, selfHost?: string): string {
  const origin = describeLeadOrigin(lead, selfHost);
  const parts = [origin.label];
  if (origin.campaign) parts.push(origin.campaign);
  return parts.join(' · ');
}
