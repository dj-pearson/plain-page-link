import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEGAL_PAGE_DATES, formatLegalDate, legalPageLastmod } from './legal-dates';

const ROOT = resolve(__dirname, '../..');
const LEGAL_DIR = join(ROOT, 'src/pages/legal');
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const legalPageFiles = readdirSync(LEGAL_DIR).filter(
  (f) => f.endsWith('.tsx') && !f.includes('.test.')
);

describe('LEGAL_PAGE_DATES', () => {
  it.each(Object.entries(LEGAL_PAGE_DATES))('%s has real ISO dates in order', (_key, d) => {
    for (const value of [d.published, d.modified]) {
      expect(value).toMatch(ISO_DATE);
      // A real calendar day, not 2026-02-30.
      expect(new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10)).toBe(value);
    }
    expect(d.modified >= d.published).toBe(true);
    // The repository was created 2025-10-29; nothing was published before it.
    expect(d.published >= '2025-10-29').toBe(true);
  });

  it('names each legal route once, and each is a route in App.tsx', () => {
    const app = readFileSync(join(ROOT, 'src/App.tsx'), 'utf8');
    const paths = Object.values(LEGAL_PAGE_DATES).map((d) => d.path);
    expect(new Set(paths).size).toBe(paths.length);
    for (const path of paths) {
      expect(app, `${path} should be routed`).toContain(`path="${path}"`);
    }
  });

  it('covers every page in src/pages/legal', () => {
    expect(legalPageFiles.length).toBe(Object.keys(LEGAL_PAGE_DATES).length);
  });
});

describe('legal page sources', () => {
  it.each(legalPageFiles)('%s takes its dates from legal-dates, not the clock', (file) => {
    const source = readFileSync(join(LEGAL_DIR, file), 'utf8');
    // The defect: "Last updated" was new Date().toLocaleDateString(), so the
    // policy claimed to have changed on every visit.
    expect(source).not.toMatch(/new Date\(/);
    expect(source).not.toMatch(/toLocaleDateString/);
    expect(source).toMatch(/LEGAL_PAGE_DATES\.\w+/);
    expect(source).toContain('dateModified: dates.modified');
    expect(source).toContain('datePublished: dates.published');
    expect(source).toContain('<time dateTime={dates.modified}>');
  });
});

describe('formatLegalDate', () => {
  it('formats in a fixed locale and in UTC', () => {
    expect(formatLegalDate('2026-07-23')).toBe('July 23, 2026');
    // The first of a month is where a local-time parse slips to the day before
    // in any time zone west of UTC.
    expect(formatLegalDate('2025-11-01')).toBe('November 1, 2025');
  });
});

describe('legalPageLastmod', () => {
  it('returns the text-last-changed date for a legal route', () => {
    expect(legalPageLastmod('/privacy')).toBe(LEGAL_PAGE_DATES.privacy.modified);
    expect(legalPageLastmod('/cookies')).toBe(LEGAL_PAGE_DATES.cookies.modified);
  });

  it('returns null for any other route, which has no truthful date', () => {
    expect(legalPageLastmod('/pricing')).toBeNull();
    expect(legalPageLastmod('/')).toBeNull();
  });
});
