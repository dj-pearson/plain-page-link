/**
 * Proof that the US-165 reachability gate has teeth.
 *
 * The case that matters is the one the site actually shipped: a page with a
 * good title, a good canonical, a sitemap entry — and two dozen inbound links,
 * every one of them on a noindexed page that is itself unreachable. Counting
 * inbound links alone calls that page well-linked. It was not; nothing arrived
 * there. `preUS165Graph()` reproduces the shape.
 */
import { describe, expect, it } from 'vitest';
import {
  auditInternalLinks,
  auditReachability,
  buildLinkGraph,
  outboundLinks,
  sitemapPaths,
} from './link-graph.mjs';

function page(route: string, links: string[]) {
  const body = links.map((href) => `<a href="${href}">x</a>`).join('');
  return {
    route,
    html: `<!DOCTYPE html><html><head><title>t</title><link rel="canonical" href="https://agentbio.net${route}"/></head><body><div id="root">${body}</div></body></html>`,
  };
}

/**
 * The 2026-09-10 build, reduced to the part that was broken: the homepage
 * reaches the marketing pages, the /for/{city} pages are noindexed and linked
 * from nowhere, and the only links to the tools are on those city pages.
 */
function preUS165Graph() {
  return [
    page('/', ['/pricing', '/blog']),
    page('/pricing', ['/']),
    page('/blog', ['/']),
    page('/for/miami-real-estate-agents', [
      '/tools/instagram-bio-analyzer',
      '/for/austin-real-estate-agents',
    ]),
    page('/for/austin-real-estate-agents', ['/tools/instagram-bio-analyzer']),
    page('/tools/instagram-bio-analyzer', []),
    page('/tools/real-estate-agent-bio-generator', []),
  ];
}

const ADVERTISED = new Set([
  '/',
  '/pricing',
  '/blog',
  '/tools/instagram-bio-analyzer',
  '/tools/real-estate-agent-bio-generator',
]);

describe('outboundLinks', () => {
  const routes = new Set(['/', '/pricing', '/blog']);

  it('normalises trailing slashes, queries and fragments to a route', () => {
    const html =
      '<body><a href="/pricing/">a</a><a href="/blog?x=1">b</a><a href="/#features">c</a></body>';
    expect([...outboundLinks(html, routes)].sort()).toEqual(['/', '/blog', '/pricing']);
  });

  it('ignores external links and non-http schemes', () => {
    const html =
      '<body><a href="https://linktr.ee/x">a</a><a href="mailto:x@y.z">b</a><a href="tel:+1">c</a></body>';
    expect(outboundLinks(html, routes).size).toBe(0);
  });

  it('does not count the head, where canonical and og:url live', () => {
    const html =
      '<head><link rel="canonical" href="/pricing"/><meta property="og:url" content="/blog"/></head><body></body>';
    expect(outboundLinks(html, routes).size).toBe(0);
  });
});

describe('buildLinkGraph', () => {
  it('does not let a page discover itself', () => {
    const { outbound, depth } = buildLinkGraph([
      page('/', ['/', '/pricing']),
      page('/pricing', []),
    ]);
    expect(outbound.get('/')?.has('/')).toBe(false);
    expect(depth.get('/pricing')).toBe(1);
  });

  it('reports depth from the homepage, not merely inbound counts', () => {
    const { inbound, depth } = buildLinkGraph(preUS165Graph());
    // Two inbound links, and still nothing reaches it.
    expect(inbound.get('/tools/instagram-bio-analyzer')?.size).toBe(2);
    expect(depth.has('/tools/instagram-bio-analyzer')).toBe(false);
  });
});

describe('auditReachability', () => {
  it('fails the build the site actually shipped', () => {
    const problems = auditReachability(preUS165Graph(), ADVERTISED);
    expect(problems.map((p) => p.route).sort()).toEqual([
      '/tools/instagram-bio-analyzer',
      '/tools/real-estate-agent-bio-generator',
    ]);
    expect(
      problems.find((p) => p.route === '/tools/real-estate-agent-bio-generator')?.problem
    ).toMatch(/no page on the site links to it/);
    expect(problems.find((p) => p.route === '/tools/instagram-bio-analyzer')?.problem).toMatch(
      /unreachable from \//
    );
  });

  it('passes once the homepage reaches them', () => {
    const fixed = preUS165Graph().map((p) =>
      p.route === '/'
        ? page('/', [
            '/pricing',
            '/blog',
            '/tools/instagram-bio-analyzer',
            '/tools/real-estate-agent-bio-generator',
          ])
        : p
    );
    expect(auditReachability(fixed, ADVERTISED)).toEqual([]);
  });

  it('flags a sitemap URL with no rendered page at all', () => {
    const problems = auditReachability([page('/', [])], new Set(['/', '/features']));
    expect(problems).toEqual([
      { route: '/features', problem: 'listed in sitemap.xml but no page was rendered for it' },
    ]);
  });
});

describe('sitemapPaths', () => {
  it('reads locs as paths, with the homepage normalised', () => {
    const xml =
      '<urlset><url><loc>https://agentbio.net/</loc></url><url><loc>https://agentbio.net/vs/linktree</loc></url></urlset>';
    expect([...sitemapPaths(xml)].sort()).toEqual(['/', '/vs/linktree']);
  });
});

/**
 * Proof that the US-184 rule has teeth.
 *
 * /blog rendered a card for every category in the registry, including the six
 * with no articles — and US-166 generates a route only for a category that has
 * one. So the page that exists to send people into the blog spent six of its
 * links on pages the build does not render. It was itself perfectly reachable
 * the whole time, which is why the reachability check never saw it: that one
 * asks whether a page can be reached, this asks whether a link arrives.
 */
describe('auditInternalLinks', () => {
  const none = () => false;
  const noAssets = new Set<string>();

  it('catches the six category links /blog was rendering', () => {
    const blog = page('/blog', [
      '/blog/category/real-estate-tips',
      '/blog/category/buying-guide',
      '/blog/category/investment',
    ]);
    const problems = auditInternalLinks(
      [blog, page('/blog/category/real-estate-tips', [])],
      noAssets,
      none
    );
    expect(problems.map((p) => p.problem).sort()).toEqual([
      'links to /blog/category/buying-guide, which is not a page',
      'links to /blog/category/investment, which is not a page',
    ]);
  });

  it('does not flag a route the SPA serves without prerendering it', () => {
    const servedBySpa = (path: string) => path.startsWith('/dashboard');
    const problems = auditInternalLinks(
      [page('/privacy-choices', ['/dashboard/settings'])],
      noAssets,
      servedBySpa
    );
    expect(problems).toEqual([]);
  });

  it('does not flag a link to a file the build wrote', () => {
    const problems = auditInternalLinks([page('/', ['/llms.txt'])], new Set(['/llms.txt']), none);
    expect(problems).toEqual([]);
  });

  it('ignores links out of the site and bare fragments', () => {
    const html =
      '<html><head></head><body><div id="root">' +
      '<a href="https://x.com/AgentBioApp">x</a>' +
      '<a href="mailto:support@agentbio.net">mail</a>' +
      '<a href="#main">skip</a>' +
      '</div></body></html>';
    expect(auditInternalLinks([{ route: '/', html }], noAssets, none)).toEqual([]);
  });

  it('reports a broken target once per page however many times it is linked', () => {
    const twice = page('/blog', ['/blog/category/gone', '/blog/category/gone']);
    expect(auditInternalLinks([twice], noAssets, none)).toHaveLength(1);
  });

  it('treats a trailing slash and a query as the same target', () => {
    const problems = auditInternalLinks(
      [page('/', ['/pricing/', '/pricing?plan=team'])],
      noAssets,
      none
    );
    // /pricing is not in the page set here, so both resolve to the one target.
    expect(problems).toHaveLength(1);
    expect(problems[0].problem).toBe('links to /pricing, which is not a page');
  });
});
