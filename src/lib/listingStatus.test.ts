/**
 * US-107: there were three status lists. The Add and Edit forms offered five
 * statuses, the Listings filter chips the same five, and QuickStatusUpdate a
 * sixth — off_market — that neither of the others knew about. A listing set to
 * Off Market matched no filter chip and rendered an empty status dropdown, and
 * `draft` had the mirror problem in QuickStatusUpdate.
 */
import { describe, it, expect } from 'vitest';
import {
  LISTING_STATUSES,
  CLOSED_LISTING_STATUSES,
  listingStatusLabel,
  isPublicListingStatus,
  listingStatusBadgeClass,
} from './listingStatus';

describe('LISTING_STATUSES', () => {
  it('includes every status any surface used to offer on its own', () => {
    const values = LISTING_STATUSES.map((s) => s.value);
    // The five the forms had, plus off_market, which only QuickStatusUpdate had.
    for (const v of ['active', 'pending', 'under_contract', 'sold', 'draft', 'off_market']) {
      expect(values).toContain(v);
    }
  });

  it('has no duplicate values', () => {
    const values = LISTING_STATUSES.map((s) => s.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('labels every status, so no dropdown can render empty', () => {
    for (const status of LISTING_STATUSES) {
      expect(status.label.trim()).not.toBe('');
      expect(listingStatusLabel(status.value)).toBe(status.label);
    }
  });

  it('falls back rather than showing a blank label for an unknown value', () => {
    expect(listingStatusLabel('something_else')).toBe('Active');
    expect(listingStatusLabel(null)).toBe('Active');
  });
});

describe('visibility', () => {
  it('keeps drafts and off-market listings off the public page', () => {
    expect(isPublicListingStatus('draft')).toBe(false);
    expect(isPublicListingStatus('off_market')).toBe(false);
  });

  it('shows the four states a buyer should see', () => {
    for (const v of ['active', 'pending', 'under_contract', 'sold']) {
      expect(isPublicListingStatus(v)).toBe(true);
    }
  });

  it('treats an unknown status as not public', () => {
    expect(isPublicListingStatus('invented')).toBe(false);
  });
});

describe('CLOSED_LISTING_STATUSES', () => {
  it('marks sold as the state that records a close date', () => {
    expect(CLOSED_LISTING_STATUSES.has('sold')).toBe(true);
    expect(CLOSED_LISTING_STATUSES.has('active')).toBe(false);
  });
});

/**
 * US-167: every status pill in the app failed WCAG AA, on the surface where the
 * word matters most.
 *
 * ListingCard and ListingDetailModal each kept a private `statusColors` map
 * instead of following this list — the divergence US-107 wrote this file to end
 * — and both used the 500 weights under white text. On the public profile,
 * "Active" ran at 2.27:1 and "Pending" at 1.92:1 against a required 4.5:1.
 *
 * Both components now read `badge` from here, so this is the one place a status
 * colour is chosen, and these assertions are what keep the choice legible.
 */
const TAILWIND_HEX: Record<string, string> = {
  'green-700': '#15803d',
  'amber-700': '#b45309',
  'orange-700': '#c2410c',
  'blue-600': '#2563eb',
  'gray-600': '#4b5563',
  'slate-600': '#475569',
  white: '#ffffff',
};

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Resolve `bg-green-700 text-white` to the two hex values it renders as. */
function badgeColors(badge: string): { background: string; foreground: string } {
  const background = badge.match(/bg-([a-z]+-\d+)/)?.[1];
  const foreground = badge.match(/text-([a-z]+(?:-\d+)?)/)?.[1];
  expect(background, `no bg- class in "${badge}"`).toBeDefined();
  expect(foreground, `no text- class in "${badge}"`).toBeDefined();
  expect(TAILWIND_HEX[background!], `add ${background} to TAILWIND_HEX`).toBeDefined();
  expect(TAILWIND_HEX[foreground!], `add ${foreground} to TAILWIND_HEX`).toBeDefined();
  return { background: TAILWIND_HEX[background!], foreground: TAILWIND_HEX[foreground!] };
}

describe('status colours meet WCAG AA (US-167)', () => {
  it.each(LISTING_STATUSES)('$label badge is readable', (status) => {
    const { background, foreground } = badgeColors(status.badge);
    const ratio = contrastRatio(foreground, background);

    expect(
      ratio,
      `The "${status.label}" pill renders ${status.badge} at ${ratio.toFixed(2)}:1. ` +
        `WCAG AA needs 4.5:1 for text this size. Pick a darker weight — and note ` +
        `that yellow has none dark enough that still reads as yellow, which is ` +
        `why Pending is amber.`
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('every status has a badge, so none falls through to a bare colour', () => {
    for (const status of LISTING_STATUSES) {
      expect(status.badge, `${status.value} has no badge`).toBeTruthy();
    }
  });

  it('detects a failing colour rather than passing whatever it is given', () => {
    // The real pre-fix values. If this stops failing, the check is broken.
    expect(contrastRatio('#ffffff', '#22c55e')).toBeLessThan(4.5); // bg-green-500, was Active
    expect(contrastRatio('#ffffff', '#eab308')).toBeLessThan(4.5); // bg-yellow-500, was Pending
    expect(contrastRatio('#ffffff', '#3b82f6')).toBeLessThan(4.5); // bg-blue-500, was Sold
    // And a passing one, so it is not simply asserting everything fails.
    expect(contrastRatio('#ffffff', '#15803d')).toBeGreaterThanOrEqual(4.5);
  });

  it('falls back to a readable badge for an unknown status', () => {
    const { background, foreground } = badgeColors(listingStatusBadgeClass('invented'));
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
