/**
 * AgentBio's own Offers never carry an expiry date that has already passed
 * (US-502).
 *
 * The homepage ProfessionalService offer, every city page and the /pricing
 * Product all said priceValidUntil '2026-12-31'. From 2027-01-01 that is in
 * the past, and an Offer whose price has expired is one search engines stop
 * showing a price for. The value is now one year from the build.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { offerPriceValidUntil } from './seo.config';
import { generateEnhancedLocalBusinessSchema, generatePricingSchema } from '@/lib/seo';

describe('offerPriceValidUntil', () => {
  it('is one year after the given day, as an ISO date', () => {
    expect(offerPriceValidUntil(new Date('2026-11-08T12:00:00Z'))).toBe('2027-11-08');
    expect(offerPriceValidUntil(new Date('2027-01-01T00:00:00Z'))).toBe('2028-01-01');
  });

  it('defaults to today, so it is never in the past', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(offerPriceValidUntil() > today).toBe(true);
  });
});

describe('the schemas that state a plan price', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('state an expiry after the day they are built, even after 2026', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-03-01T00:00:00Z'));
    const business = generateEnhancedLocalBusinessSchema();
    const product = generatePricingSchema([
      { name: 'Professional', description: 'd', price: '49', features: [] },
    ]);
    expect(business.offers.priceValidUntil).toBe('2028-03-01');
    expect(product.offers[0].priceValidUntil).toBe('2028-03-01');
  });

  it('names the site Organization as the provider, by id', () => {
    const business = generateEnhancedLocalBusinessSchema();
    expect(business.provider['@id']).toMatch(/\/#organization$/);
  });
});

describe('the source', () => {
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return files(path);
      return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
    });
  }

  it('never hard-codes a priceValidUntil date', () => {
    const offenders = files(join(process.cwd(), 'src')).filter((file) =>
      /priceValidUntil:\s*['"`]\d{4}-\d{2}-\d{2}/.test(readFileSync(file, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});
