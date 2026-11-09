/**
 * When each legal page was first published and when its text last changed.
 *
 * Four of these pages used to compute their "Last updated" date as
 * `new Date().toLocaleDateString()`. The Privacy Policy and the Terms of
 * Service therefore told every visitor they had changed today, and the
 * prerendered copy told crawlers they had changed on the build date. Two of the
 * pages promise to announce changes by "updating the Last Updated date", a
 * promise that means nothing when the date moves on every visit. The JSON-LD
 * `dateModified` was the same locale-formatted string ("11/8/2026"), which is
 * not ISO 8601. The three pages with a fixed date also put the display string
 * in `dateModified`. `datePublished` on four pages was "2024-01-01", which is
 * earlier than the repository (created 2025-10-29).
 *
 * The dates below come from the git history of each page's text (GitHub commit
 * history, because local clones are shallow). Commits that only changed markup,
 * quote style, contrast or link underlines do not count as a change of text:
 *
 * - privacy: created 2025-10-30 (8343829); text last changed 2026-07-23
 *   (6dfe838, CCPA rights no longer gated on thresholds).
 * - terms: created 2025-10-30 (8343829); text last changed 2025-11-05
 *   (eb374a4, rewritten for a national platform).
 * - dmca: created 2025-11-05 (a332054); text last changed 2025-11-05 (eb374a4).
 * - acceptableUse: created 2025-11-05 (a332054); 6eb00c2 the same day added the
 *   header and footer only.
 * - cookies: published 2026-05-17 (3eccce8); text changed 2026-07-23 (c7b17e1,
 *   new instructions for withdrawing consent) without the date being moved.
 * - privacyChoices: created 2026-07-23 (c7b17e1, 7ca3312 the same day).
 * - accessibility: created 2026-01-12 (bd9e95f).
 *
 * Changing a policy's wording? Move its `modified` date here in the same
 * commit. legal-dates.test.ts holds the format and ordering rules.
 */

export interface LegalPageDates {
  /** ISO 8601 date (YYYY-MM-DD) the page was first published. */
  readonly published: string;
  /** ISO 8601 date (YYYY-MM-DD) the page's text last changed. */
  readonly modified: string;
  /** The route the page is served at, used for the sitemap lastmod. */
  readonly path: string;
}

export const LEGAL_PAGE_DATES = {
  privacy: { path: '/privacy', published: '2025-10-30', modified: '2026-07-23' },
  terms: { path: '/terms', published: '2025-10-30', modified: '2025-11-05' },
  dmca: { path: '/dmca', published: '2025-11-05', modified: '2025-11-05' },
  acceptableUse: { path: '/acceptable-use', published: '2025-11-05', modified: '2025-11-05' },
  cookies: { path: '/cookies', published: '2026-05-17', modified: '2026-07-23' },
  privacyChoices: { path: '/privacy-choices', published: '2026-07-23', modified: '2026-07-23' },
  accessibility: { path: '/accessibility', published: '2026-01-12', modified: '2026-01-12' },
} as const satisfies Record<string, LegalPageDates>;

export type LegalPageKey = keyof typeof LEGAL_PAGE_DATES;

const DISPLAY_FORMAT = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * "2026-07-23" -> "July 23, 2026". Formatted in UTC with a fixed locale, so the
 * prerendered HTML and every visitor's browser show the same day, whatever the
 * visitor's time zone.
 */
export function formatLegalDate(isoDate: string): string {
  return DISPLAY_FORMAT.format(new Date(`${isoDate}T00:00:00Z`));
}

/** The text-last-changed date for a legal route, or null for any other path. */
export function legalPageLastmod(path: string): string | null {
  const entry = Object.values(LEGAL_PAGE_DATES).find((d) => d.path === path);
  return entry ? entry.modified : null;
}
