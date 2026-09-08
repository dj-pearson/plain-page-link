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
import { auditPages, readCanonical, readDescription, readTitle } from './seo-audit.mjs';

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
