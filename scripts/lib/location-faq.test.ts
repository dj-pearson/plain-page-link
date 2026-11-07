/**
 * The /for/{city} FAQ passes the same FAQPage rule verify:seo applies (US-311).
 *
 * Before, LocationTemplate wrote its five answers twice — JSON-LD and JSX — and
 * the pricing answer drifted, so verify:seo failed all 23 city pages in a build
 * with "FAQPage answer is not on the page". This renders the real template to
 * DOM (Helmet head included, as the prerender's Chromium sees it), and runs
 * auditStructuredData over it, so a future drift fails here without a build.
 */
import { createElement } from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { describe, it, expect, afterEach } from 'vitest';
import LocationTemplate from '../../src/pages/landing/LocationTemplate';
import { buildLocationFaqs } from '../../src/pages/landing/locationFaq';
import { LOCATIONS } from '../../src/data/locations';
import { PRICING_PLANS } from '../../src/config/pricing-plans';
import { auditStructuredData, readJsonLd } from './seo-audit.mjs';

/**
 * Render in jsdom and read back the whole document, Helmet's head included.
 * Helmet writes the head after mount, so wait until the JSON-LD is there —
 * otherwise the audit would pass vacuously on a page with no schema at all.
 */
async function renderCityPage(slug: string): Promise<string> {
  const location = LOCATIONS.find((l) => l.slug === slug);
  if (!location) throw new Error(`no location ${slug}`);
  render(
    createElement(
      HelmetProvider,
      null,
      createElement(
        MemoryRouter,
        { initialEntries: [`/for/${slug}`] },
        createElement(LocationTemplate, { location })
      )
    )
  );
  await waitFor(() => {
    const ld = document.head.querySelector('script[type="application/ld+json"]');
    expect(ld?.textContent ?? '').toContain('FAQPage');
  });
  return `<!doctype html>${document.documentElement.outerHTML}`;
}

afterEach(() => cleanup());

describe('city page FAQ', () => {
  const slugs = LOCATIONS.map((l) => l.slug);

  it('covers every location', () => {
    expect(slugs.length).toBeGreaterThan(20);
  });

  it.each(slugs)('/for/%s has no FAQPage problems', async (slug) => {
    const html = await renderCityPage(slug);
    const faqProblems = auditStructuredData(`/for/${slug}`, html)
      .map(({ problem }: { problem: string }) => problem)
      .filter((problem: string) => problem.includes('FAQPage'));
    expect(faqProblems).toEqual([]);
  });

  it('puts the same answers in the schema and on the page', async () => {
    const location = LOCATIONS[0];
    const html = await renderCityPage(location.slug);
    const faqs = buildLocationFaqs(location.city);

    const { blocks, problems } = readJsonLd(html) as {
      blocks: Array<Record<string, unknown>>;
      problems: string[];
    };
    expect(problems).toEqual([]);
    const graph = blocks.flatMap((b) => (Array.isArray(b['@graph']) ? b['@graph'] : [b]));
    const faqPage = graph.find((n: { '@type'?: string }) => n['@type'] === 'FAQPage') as {
      mainEntity: Array<{ name: string; acceptedAnswer: { text: string } }>;
    };
    expect(faqPage.mainEntity.map((q) => q.name)).toEqual(faqs.map((f) => f.question));
    expect(faqPage.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(faqs.map((f) => f.answer));
    // Exactly one FAQPage: the dedupe bug US-147 describes shipped two graphs.
    expect(graph.filter((n: { '@type'?: string }) => n['@type'] === 'FAQPage')).toHaveLength(1);
  });
});

describe('buildLocationFaqs', () => {
  const faqs = buildLocationFaqs('Denver');
  const all = faqs.map((f) => f.answer).join(' ');

  it('does not claim an MLS/IDX sync the product does not have', () => {
    expect(all).not.toMatch(/integrates with (major )?MLS/i);
    expect(all).not.toMatch(/automatically sync/i);
  });

  it('does not claim unlimited listings or a free trial', () => {
    expect(all).not.toMatch(/unlimited/i);
    expect(all).not.toMatch(/free trial/i);
  });

  it('takes its plan facts from PRICING_PLANS', () => {
    const free = PRICING_PLANS.find((p) => p.id === 'free')!;
    const cheapestPaid = Math.min(
      ...PRICING_PLANS.filter((p) => p.price_monthly > 0).map((p) => p.price_monthly)
    );
    const pricing = faqs[3].answer;
    expect(pricing).toContain(`free plan with ${free.limits.listings} active listings`);
    expect(pricing).toContain(`$${cheapestPaid}/month`);
    const domainPlan = [...PRICING_PLANS]
      .sort((a, b) => a.price_monthly - b.price_monthly)
      .find((p) => p.features.customDomain)!;
    expect(pricing).toContain(`${domainPlan.name} plan adds a custom domain`);
  });

  it('names the city in every question', () => {
    for (const f of faqs) expect(f.question).toContain('Denver');
  });
});
