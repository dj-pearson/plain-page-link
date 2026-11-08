/**
 * One page, one WebPage node (US-480, fixes US-182).
 *
 * /features/lead-capture and /features/analytics each published two WebPage
 * nodes with no @id: the page's own and SEOHead's speakable block. The second
 * half of this file renders both pages the way the prerender does and holds
 * them to one WebPage node, named by the canonical URL, carrying the speakable
 * specification.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { getCanonicalUrl, getBaseUrl } from '@/config/seo.config';
import { websiteId } from '@/config/site-entities';
import { buildStructuredData } from './structured-data-graph';

// The hero pulls in three.js; it has nothing to do with the head.
vi.mock('@/components/hero', () => ({ HeroSectionLazy: () => null }));
vi.mock('@/components/layout/PublicHeader', () => ({ PublicHeader: () => null }));
vi.mock('@/components/layout/PublicFooter', () => ({ PublicFooter: () => null }));

type Node = Record<string, unknown>;

const url = 'https://agentbio.net/features/x';
const speakable = { '@type': 'SpeakableSpecification', cssSelector: ['h1'] };

describe('buildStructuredData', () => {
  it('returns null when there is nothing to publish', () => {
    expect(buildStructuredData({})).toBeNull();
    expect(buildStructuredData({ speakableSelectors: ['h1'] })).toBeNull();
  });

  it('names an anonymous WebPage by the canonical URL and merges speakable into it', () => {
    const out = buildStructuredData({
      schema: { '@context': 'https://schema.org', '@type': 'WebPage', name: 'X' },
      canonicalUrl: url,
      speakableSelectors: ['h1'],
    });
    expect(out).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': url,
      name: 'X',
      url,
      speakable,
    });
  });

  it('flattens an @graph document rather than nesting it inside another', () => {
    const out = buildStructuredData({
      schema: {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: 'X' },
          { '@type': 'FAQPage', mainEntity: [] },
        ],
      },
      canonicalUrl: url,
      speakableSelectors: ['h1'],
    }) as Node;
    const graph = out['@graph'] as Node[];
    expect(graph).toHaveLength(2);
    expect(graph.every((node) => !('@graph' in node) && !('@context' in node))).toBe(true);
    expect(graph[0]).toMatchObject({ '@type': 'WebPage', '@id': url, speakable });
    // A FAQPage is not given the page's id: it is a different node with its own job.
    expect(graph[1]['@id']).toBeUndefined();
  });

  it('adds a WebPage under the canonical id only when the page has none', () => {
    const out = buildStructuredData({
      schema: { '@type': 'Product', name: 'P' },
      canonicalUrl: url,
      speakableSelectors: ['h1'],
    }) as Node;
    expect(out['@graph']).toEqual([
      { '@type': 'Product', name: 'P' },
      { '@type': 'WebPage', '@id': url, url, speakable },
    ]);
  });

  it('leaves a WebPage with an id of its own alone', () => {
    const other = 'https://agentbio.net/elsewhere';
    const out = buildStructuredData({
      schema: { '@type': 'WebPage', '@id': other },
      canonicalUrl: url,
    });
    expect(out).toEqual({ '@context': 'https://schema.org', '@type': 'WebPage', '@id': other });
  });

  it('keeps an existing url on the page node', () => {
    const out = buildStructuredData({
      schema: { '@type': 'WebPage', '@id': url, url: 'https://agentbio.net/features/x?y' },
      canonicalUrl: url,
      speakableSelectors: ['h1'],
    }) as Node;
    expect(out.url).toBe('https://agentbio.net/features/x?y');
  });
});

function jsonLdOf(element: JSX.Element): Node[] {
  const context: { helmet?: HelmetServerState } = {};
  const previous = HelmetProvider.canUseDOM;
  HelmetProvider.canUseDOM = false;
  try {
    renderToStaticMarkup(
      <HelmetProvider context={context}>
        <MemoryRouter>{element}</MemoryRouter>
      </HelmetProvider>
    );
  } finally {
    HelmetProvider.canUseDOM = previous;
  }
  const html = context.helmet?.script.toString() ?? '';
  return [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]) as Node
  );
}

describe.each([
  ['/features/lead-capture', () => import('@/pages/features/LeadCapture')],
  ['/features/analytics', () => import('@/pages/features/Analytics')],
])('%s', (path, load) => {
  it('publishes one WebPage node, named by its canonical URL, with speakable', async () => {
    const { default: Page } = await load();
    // The page head's block, plus a BreadcrumbList from <Breadcrumb> on one of them.
    const blocks = jsonLdOf(<Page />);
    const head = blocks.find((block) => Array.isArray(block['@graph']));
    expect(head).toBeDefined();
    const graph = head!['@graph'] as Node[];
    expect(graph.some((node) => '@graph' in node)).toBe(false);
    const everyNode = blocks.flatMap((block) =>
      Array.isArray(block['@graph']) ? (block['@graph'] as Node[]) : [block]
    );
    expect(everyNode.filter((node) => node['@type'] === 'WebPage')).toHaveLength(1);

    const pages = graph.filter((node) => node['@type'] === 'WebPage');
    expect(pages).toHaveLength(1);
    const canonical = getCanonicalUrl(path);
    expect(pages[0]['@id']).toBe(canonical);
    expect(pages[0].url).toBe(canonical);
    expect(pages[0].isPartOf).toEqual({ '@id': websiteId(getBaseUrl()) });
    expect(pages[0].speakable).toMatchObject({ '@type': 'SpeakableSpecification' });

    // Still publishes its FAQ.
    expect(graph.some((node) => node['@type'] === 'FAQPage')).toBe(true);
  });
});
