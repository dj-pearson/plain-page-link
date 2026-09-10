/**
 * Proof that the US-150 gate has teeth.
 *
 * The interesting case is not that today's output passes — it does, and
 * scripts/prerender.mts would have refused to write it otherwise. It is that
 * the output the site actually shipped for a year FAILS. `preUS147Output()`
 * below reproduces that shape: every URL answering with index.html's single
 * hardcoded title, index.html's single description, no canonical, and an empty
 * <div id="root">. If a future change to this module lets that through, the
 * gate has stopped being worth running.
 */
import { describe, expect, it } from 'vitest';
import {
  auditPages,
  auditStructuredData,
  readCanonical,
  readDescription,
  readTitle,
} from './seo-audit.mjs';

const ORIGIN = 'https://agentbio.net';

const SHELL_TITLE =
  'Real Estate Agent Bio Page Builder | Turn Instagram Followers into Leads – AgentBio';
const SHELL_DESCRIPTION =
  'Purpose-built link-in-bio for real estate agents. Showcase properties, capture leads, and book appointments from Instagram.';

/** What every URL on agentbio.net returned before US-147. */
function preUS147Output() {
  const shell = `<!DOCTYPE html>
<html lang="en"><head>
<title>${SHELL_TITLE}</title>
<meta name="description" content="${SHELL_DESCRIPTION}" />
</head><body><div id="root"></div><script src="/assets/index.js"></script></body></html>`;
  return [
    { route: '/', html: shell },
    { route: '/pricing', html: shell },
    { route: '/vs/linktree', html: shell },
    { route: '/for/miami-real-estate-agents', html: shell },
  ];
}

/** A page as the prerender writes it now. */
function goodPage(route: string, title: string, description: string, body = 'x'.repeat(900)) {
  return {
    route,
    html: `<!DOCTYPE html>
<html lang="en"><head>
<title>${title}</title>
<meta data-rh="true" name="description" content="${description}" />
<link data-rh="true" rel="canonical" href="${ORIGIN}${route === '/' ? '/' : route}" />
</head><body><div id="root">${body}</div><script src="/assets/index.js"></script></body></html>`,
  };
}

describe('seo-audit', () => {
  describe('the output that shipped before US-147', () => {
    const problems = auditPages(preUS147Output(), { origin: ORIGIN });
    const forRoute = (route: string) =>
      problems.filter((p) => p.route === route).map((p) => p.problem);

    it('is rejected', () => {
      expect(problems.length).toBeGreaterThan(0);
    });

    it('flags every non-home page for carrying the homepage title', () => {
      for (const route of ['/pricing', '/vs/linktree', '/for/miami-real-estate-agents']) {
        expect(forRoute(route).some((p) => p.includes('homepage title'))).toBe(true);
      }
    });

    it('flags the shared description', () => {
      expect(forRoute('/pricing').some((p) => p.includes('shares its description'))).toBe(true);
    });

    it('flags the missing canonical on every page', () => {
      for (const route of ['/', '/pricing', '/vs/linktree']) {
        expect(forRoute(route).some((p) => p.includes('canonical'))).toBe(true);
      }
    });

    it('flags the empty body on every page', () => {
      for (const route of ['/', '/pricing', '/vs/linktree']) {
        expect(forRoute(route).some((p) => p.includes('essentially empty'))).toBe(true);
      }
    });
  });

  describe('output as the prerender writes it now', () => {
    it('passes', () => {
      const pages = [
        goodPage('/', SHELL_TITLE, SHELL_DESCRIPTION),
        goodPage('/pricing', 'Pricing - AgentBio Professional Plans', 'Plans and pricing.'),
        goodPage('/vs/linktree', 'AgentBio vs Linktree', 'How the two compare.'),
      ];
      expect(auditPages(pages, { origin: ORIGIN })).toEqual([]);
    });
  });

  describe('individual defects', () => {
    it('catches a canonical pointing at the homepage', () => {
      const page = goodPage('/pricing', 'Pricing', 'Plans.');
      page.html = page.html.replace(`${ORIGIN}/pricing`, `${ORIGIN}/`);
      const problems = auditPages([goodPage('/', 'Home', 'Home page.'), page], { origin: ORIGIN });
      expect(problems.some((p) => p.problem.includes('points at the homepage'))).toBe(true);
    });

    it('catches a canonical left pointing at the preview server', () => {
      const page = goodPage('/pricing', 'Pricing', 'Plans.');
      page.html = page.html.replace(`${ORIGIN}/pricing`, 'http://127.0.0.1:4319/pricing');
      const problems = auditPages([page], { origin: ORIGIN });
      expect(problems.some((p) => p.problem.includes('local preview server'))).toBe(true);
    });

    it('catches two pages sharing a title even when neither is the homepage', () => {
      const problems = auditPages(
        [goodPage('/a', 'Same Title', 'One.'), goodPage('/b', 'Same Title', 'Two.')],
        { origin: ORIGIN }
      );
      expect(problems.some((p) => p.problem.includes('shares its <title>'))).toBe(true);
    });

    it('catches the duplicate description tag that a naive snapshot produces', () => {
      const page = goodPage('/pricing', 'Pricing', 'Plans.');
      page.html = page.html.replace(
        '</head>',
        `<meta name="description" content="${SHELL_DESCRIPTION}" /></head>`
      );
      const problems = auditPages([page], { origin: ORIGIN });
      expect(problems.some((p) => p.problem.includes('2 description tags'))).toBe(true);
    });

    it('catches the 404 page shipped under a real route', () => {
      const page = goodPage('/features', 'Not Found', 'Missing.');
      page.html = page.html.replace('<div id="root">', '<div id="root"><h1>404</h1>');
      const problems = auditPages([page], { origin: ORIGIN });
      expect(problems.some((p) => p.problem.includes('404'))).toBe(true);
    });

    it('does not demand a canonical from a noindexed page', () => {
      const page = goodPage('/auth/login', 'Log in', 'Sign in to AgentBio.');
      page.html = page.html
        .replace(/<link data-rh="true" rel="canonical"[^>]*>/, '')
        .replace('</head>', '<meta name="robots" content="noindex, follow" /></head>');
      expect(auditPages([page], { origin: ORIGIN })).toEqual([]);
    });
  });

  describe('readers', () => {
    it('reads tags regardless of attribute order', () => {
      const html =
        '<head><title>T</title><meta content="D" name="description" />' +
        '<link href="https://x/y" rel="canonical" /></head>';
      expect(readTitle(html)).toBe('T');
      expect(readDescription(html).value).toBe('D');
      expect(readCanonical(html).value).toBe('https://x/y');
    });
  });
});

/**
 * Proof that the US-167/US-168 breadcrumb rules have teeth.
 *
 * Each fixture is a trail the site actually shipped, read out of dist on
 * 2026-09-10. The interesting one is `siblingParent`: it has no duplicate URL,
 * no relative URL, and ends at its own canonical, so every cheaper check passes
 * it. What it claims is that /tools/instagram-bio-analyzer is the parent of
 * /tools/real-estate-agent-bio-generator, which is the tool next to it.
 */
describe('BreadcrumbList', () => {
  const page = (canonical: string, list: unknown, extra: unknown[] = []) => {
    const blocks = [list, ...extra]
      .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
      .join('');
    return `<!DOCTYPE html><html><head><title>t</title><meta name="description" content="d"/><link rel="canonical" href="${canonical}"/>${blocks}</head><body><div id="root">${'x'.repeat(900)}</div></body></html>`;
  };

  const trail = (rungs: [string, string][]) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: rungs.map(([name, item], index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name,
      item,
    })),
  });

  const problemsFor = (canonical: string, list: unknown, extra: unknown[] = []) =>
    auditStructuredData('/x', page(canonical, list, extra)).map((p) => p.problem);

  it('rejects the relative item URLs /features/lead-capture shipped', () => {
    const problems = problemsFor(
      'https://agentbio.net/features/lead-capture',
      trail([
        ['Home', 'https://agentbio.net'],
        ['Features', '/features/property-listings'],
        ['Lead Capture', '/features/lead-capture'],
      ])
    );
    expect(problems.filter((p) => p.includes('relative item URL'))).toHaveLength(2);
  });

  it('rejects the two rungs /tools/instagram-bio-analyzer gave the same URL', () => {
    const problems = problemsFor(
      'https://agentbio.net/tools/instagram-bio-analyzer',
      trail([
        ['Home', 'https://agentbio.net/'],
        ['Free Tools', 'https://agentbio.net/tools/instagram-bio-analyzer'],
        ['Instagram Bio Analyzer', 'https://agentbio.net/tools/instagram-bio-analyzer'],
      ])
    );
    expect(problems.some((p) => p.includes('share the URL'))).toBe(true);
  });

  it('rejects a rung that points at a sibling rather than an ancestor', () => {
    const siblingParent = trail([
      ['Home', 'https://agentbio.net/'],
      ['Free Tools', 'https://agentbio.net/tools/instagram-bio-analyzer'],
      ['Agent Bio Generator', 'https://agentbio.net/tools/real-estate-agent-bio-generator'],
    ]);
    const problems = problemsFor(
      'https://agentbio.net/tools/real-estate-agent-bio-generator',
      siblingParent
    );
    // Every cheaper rule passes it; only the ancestor rule catches it.
    expect(problems.some((p) => p.includes('relative'))).toBe(false);
    expect(problems.some((p) => p.includes('share the URL'))).toBe(false);
    expect(problems.some((p) => p.includes('is not an ancestor of'))).toBe(true);
  });

  it('accepts the corrected trail', () => {
    expect(
      problemsFor(
        'https://agentbio.net/tools/real-estate-agent-bio-generator',
        trail([
          ['Home', 'https://agentbio.net/'],
          ['Free Tools', 'https://agentbio.net/tools'],
          ['Agent Bio Generator', 'https://agentbio.net/tools/real-estate-agent-bio-generator'],
        ])
      )
    ).toEqual([]);
  });

  it('allows the declared non-path parent the city pages use', () => {
    expect(
      problemsFor(
        'https://agentbio.net/for/miami-real-estate-agents',
        trail([
          ['Home', 'https://agentbio.net/'],
          ['For Real Estate Agents', 'https://agentbio.net/for-real-estate-agents'],
          ['Miami Real Estate Agents', 'https://agentbio.net/for/miami-real-estate-agents'],
        ])
      )
    ).toEqual([]);
  });

  it('rejects a trail that ends somewhere other than the page', () => {
    const problems = problemsFor(
      'https://agentbio.net/pricing',
      trail([
        ['Home', 'https://agentbio.net/'],
        ['Blog', 'https://agentbio.net/blog'],
      ])
    );
    expect(problems.some((p) => p.includes("but the page's canonical is"))).toBe(true);
  });

  it('rejects the two BreadcrumbList blocks every city page shipped', () => {
    const one = trail([
      ['Home', 'https://agentbio.net/'],
      ['Pricing', 'https://agentbio.net/pricing'],
    ]);
    const problems = problemsFor('https://agentbio.net/pricing', one, [one]);
    expect(problems).toContain('2 BreadcrumbList blocks on one page; there can only be one trail');
  });

  it('finds a BreadcrumbList nested in an @graph', () => {
    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', name: 'x' },
        trail([
          ['Home', 'https://agentbio.net/'],
          ['Free Tools', '/tools'],
          ['Agent Bio', 'https://agentbio.net/tools/real-estate-agent-bio-generator'],
        ]),
      ],
    };
    expect(
      problemsFor('https://agentbio.net/tools/real-estate-agent-bio-generator', graph).some((p) =>
        p.includes('relative item URL')
      )
    ).toBe(true);
  });
});
