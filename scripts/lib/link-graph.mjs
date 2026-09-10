/**
 * The site's own crawl graph, read out of the built HTML (US-165).
 *
 * Being in sitemap.xml is a request; being linked is what makes a page part of
 * the site. The two are not the same thing and nothing here was comparing them.
 * The state this exists to prevent, measured on the 2026-09-10 build:
 *
 *   /tools/real-estate-agent-bio-generator   0 inbound internal links
 *   /tools/instagram-bio-analyzer            unreachable from /
 *   /tools/listing-description-generator     unreachable from /
 *   /instagram-bio-for-realtors              unreachable from /
 *
 * The three tools were not quite orphans — they had ~23 inbound links each, all
 * of them from the 26 /for/{city} pages, which carry noindex and are themselves
 * unreachable from the homepage. An island linking to an island. The bio
 * generator, built in US-155 for one specific query cluster, had no inbound
 * internal link at all.
 *
 * Only <a href> in the BODY counts. A canonical, an og:url or a sitemap entry
 * is not a link a crawler follows for discovery, and counting them would let
 * exactly the defect above pass.
 */

/** Internal <a href> targets in a page's body, normalised to route paths. */
export function outboundLinks(html, knownRoutes) {
  const body = html.replace(/<head[\s\S]*?<\/head>/i, '');
  const targets = new Set();
  for (const match of body.matchAll(/<a\b[^>]*\bhref="([^"]*)"/gi)) {
    let href = match[1];
    if (!href.startsWith('/')) continue; // external, mailto, tel, bare #anchor
    href = href.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
    if (knownRoutes.has(href)) targets.add(href);
  }
  return targets;
}

/**
 * @param {{route: string, html: string}[]} pages every prerendered page
 * @returns {{inbound: Map<string, Set<string>>, outbound: Map<string, Set<string>>, depth: Map<string, number>}}
 */
export function buildLinkGraph(pages) {
  const routes = new Set(pages.map((p) => p.route));
  const inbound = new Map([...routes].map((r) => [r, new Set()]));
  const outbound = new Map();

  for (const page of pages) {
    const targets = outboundLinks(page.html, routes);
    targets.delete(page.route); // a page linking to itself discovers nothing
    outbound.set(page.route, targets);
    for (const target of targets) inbound.get(target).add(page.route);
  }

  // Click depth from the homepage, breadth-first. A route absent from this map
  // is one no chain of internal links reaches.
  const depth = new Map([['/', 0]]);
  let frontier = ['/'];
  while (frontier.length > 0) {
    const next = [];
    for (const route of frontier) {
      for (const target of outbound.get(route) ?? []) {
        if (depth.has(target)) continue;
        depth.set(target, depth.get(route) + 1);
        next.push(target);
      }
    }
    frontier = next;
  }

  return { inbound, outbound, depth };
}

/** Paths listed in a sitemap.xml, normalised the same way as link targets. */
export function sitemapPaths(xml) {
  const paths = new Set();
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const path = new URL(match[1].trim()).pathname.replace(/\/+$/, '') || '/';
    paths.add(path);
  }
  return paths;
}

/**
 * Every sitemap-listed page that the site does not link to.
 *
 * @returns {{route: string, problem: string}[]}
 */
export function auditReachability(pages, sitemap) {
  const { inbound, depth } = buildLinkGraph(pages);
  const problems = [];

  for (const route of [...sitemap].sort()) {
    if (!inbound.has(route)) {
      problems.push({
        route,
        problem: 'listed in sitemap.xml but no page was rendered for it',
      });
      continue;
    }
    // Reachability is the question, not the inbound count. The homepage is the
    // entry point at depth 0 and needs no inbound link to be reachable; a page
    // with two dozen of them can still be unreachable.
    if (depth.has(route)) continue;

    const sources = inbound.get(route);
    if (sources.size === 0) {
      problems.push({
        route,
        problem: 'no page on the site links to it — it exists only in the sitemap',
      });
    } else {
      const sample = [...sources].slice(0, 3).join(', ');
      problems.push({
        route,
        problem:
          `unreachable from / — its ${sources.size} inbound link(s) are all on pages ` +
          `that are themselves unreachable (e.g. ${sample})`,
      });
    }
  }

  return problems;
}
