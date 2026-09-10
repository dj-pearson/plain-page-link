/**
 * The rules a prerendered page has to satisfy before it ships (US-150).
 *
 * Kept pure and separate from the CLI so it can be run against fixtures. The
 * point of this module is not that it passes today — scripts/prerender.mts
 * already refuses to write a page that fails most of these. The point is that
 * it keeps passing. 44 URLs shipped for a year sharing one <title> because
 * nothing anywhere compared them, and the fix for that is not a better
 * prerender script, it is a check that fails the build when the property stops
 * holding.
 *
 * Everything here works on the built HTML, not on the components. A page can
 * have a perfectly correct <SEOHead> and still ship wrong.
 */

/**
 * Descriptions allowed to repeat across pages.
 *
 * Empty, and it should stay that way. All 44 prerendered pages had distinct
 * descriptions when this was written. An entry here is a page admitting it has
 * nothing of its own to say, so add one only with a reason next to it.
 *
 * @type {Record<string, string>} description text -> why it may repeat
 */
export const DUPLICATE_DESCRIPTION_ALLOWLIST = {};

const NOT_FOUND_H1 = /<h1[^>]*>\s*404\s*<\/h1>/i;

/** Read a tag's attribute regardless of attribute order. */
function attr(html, tagPattern, wanted) {
  const tags = html.match(tagPattern) || [];
  for (const tag of tags) {
    const match = tag.match(new RegExp(`${wanted}="([^"]*)"`, 'i'));
    if (match) return match[1];
  }
  return null;
}

function headOf(html) {
  const end = html.indexOf('</head>');
  return end === -1 ? html : html.slice(0, end);
}

export function readTitle(html) {
  const match = headOf(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? match[1].trim() : null;
}

export function readDescription(html) {
  const head = headOf(html);
  const metas = head.match(/<meta[^>]*name="description"[^>]*>/gi) || [];
  if (metas.length === 0) return { value: null, count: 0 };
  const value = attr(metas.join(''), /<meta[^>]*>/gi, 'content');
  return { value: value ? value.trim() : null, count: metas.length };
}

export function readCanonical(html) {
  const head = headOf(html);
  const links = head.match(/<link[^>]*rel="canonical"[^>]*>/gi) || [];
  if (links.length === 0) return { value: null, count: 0 };
  const value = attr(links.join(''), /<link[^>]*>/gi, 'href');
  return { value: value ? value.trim() : null, count: links.length };
}

export function readRobots(html) {
  return attr(headOf(html).match(/<meta[^>]*name="robots"[^>]*>/gi)?.join('') || '', /<meta[^>]*>/gi, 'content');
}

function rootLength(html) {
  const match = html.match(/<div[^>]*id="root"[^>]*>([\s\S]*?)<\/div>\s*<script/i);
  if (match) return match[1].length;
  // Fall back to the whole body when the shape differs; an empty shell is what
  // matters and it is unambiguous either way.
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return body ? body[1].length : 0;
}

/** A page rendering less than this into the document never really rendered. */
export const MIN_BODY_HTML = 500;

/**
 * @param {{route: string, html: string}[]} pages
 * @param {{origin: string}} options
 * @returns {{route: string, problem: string}[]}
 */
/**
 * Every JSON-LD block on a page, parsed (US-157).
 *
 * Returns `{ blocks, problems }` rather than throwing, so one malformed block
 * does not hide the rest.
 */
export function readJsonLd(html) {
  const blocks = [];
  const problems = [];
  const scripts =
    html.match(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi) || [];

  for (const script of scripts) {
    const body = script.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      blocks.push(JSON.parse(body));
    } catch (error) {
      problems.push(`JSON-LD block does not parse: ${String(error.message).slice(0, 80)}`);
    }
  }
  return { blocks, problems };
}

/** Walk every object in a JSON-LD graph, however deeply nested. */
function walkJsonLd(node, visit) {
  if (Array.isArray(node)) {
    for (const item of node) walkJsonLd(item, visit);
  } else if (node && typeof node === 'object') {
    visit(node);
    for (const value of Object.values(node)) walkJsonLd(value, visit);
  }
}

/**
 * Structured-data rules, checked against the built HTML.
 *
 * The aggregateRating rule is the one with history. US-111 found ratingValue
 * "4.8" over reviewCount "523" on the landing page — both invented — and
 * removed it there. It survived in five other places and was still reaching 31
 * built pages when US-157 looked. Google renders stars from this field, so a
 * fabricated value is a false claim shown to everyone who searches. The check
 * below does not ban the field; it bans the specific invented pair, and it
 * requires anything claiming a rating to also name a review count.
 */
export function auditStructuredData(route, html) {
  const problems = [];
  const { blocks, problems: parseProblems } = readJsonLd(html);
  problems.push(...parseProblems);

  // Strip <script> and <style> CONTENT first. Stripping tags alone leaves the
  // JSON-LD source itself in the text, so every FAQ question trivially "appears
  // on the page" by matching its own markup — the check passed a question about
  // curing baldness before this line existed.
  const visibleText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ');

  for (const block of blocks) {
    walkJsonLd(block, (node) => {
      const type = node['@type'];

      if (node.aggregateRating) {
        const rating = node.aggregateRating;
        const value = String(rating.ratingValue ?? '');
        const count = String(rating.reviewCount ?? '');
        if (value === '4.8' && count === '523') {
          problems.push(
            'aggregateRating 4.8/523 is the invented pair removed in US-111 and US-157'
          );
        }
        if (!value || value === 'undefined') {
          problems.push(`aggregateRating on ${type} has no ratingValue`);
        }
        if (!count || count === 'undefined') {
          problems.push(`aggregateRating on ${type} has no reviewCount`);
        }
      }

      // A FAQPage that describes questions nobody can see on the page is
      // schema for a crawler rather than markup of the content.
      if (type === 'FAQPage' && Array.isArray(node.mainEntity)) {
        for (const entry of node.mainEntity) {
          const question = entry && entry.name;
          if (typeof question !== 'string' || question.length < 12) continue;
          const probe = question.slice(0, 40).replace(/\s+/g, ' ');
          if (!visibleText.includes(probe)) {
            problems.push(`FAQPage question is not visible on the page: "${probe}…"`);
          }
        }
      }
    });
  }

  return problems.map((problem) => ({ route, problem }));
}

/**
 * Breadcrumb rules, checked against the built HTML (US-165).
 *
 * The defect: eleven places in src/ built a BreadcrumbList, across three
 * breadcrumb components, and every page that showed a trail shipped two or
 * three competing copies. /press had three — one in its @graph, and the old
 * seo/Breadcrumb emitted a JSON-LD block and a microdata copy of the same
 * list. Two of the trails were not valid trails at all: "Features" pointed at
 * /features/property-listings and "Free Tools" at /tools/instagram-bio-analyzer
 * — the latter on the Instagram Bio Analyzer page itself, so its own parent was
 * itself. /features and /tools have no route in App.tsx.
 *
 * None of that is visible in the components; it is only visible in the built
 * page, where the copies land together. So it is checked here.
 *
 * `knownRoutes` is the set of routes the build actually rendered. A crumb
 * pointing outside it is pointing at a page that does not exist — the same
 * class of defect US-149 removed from the sitemap.
 */
export function auditBreadcrumbs(route, html, { base, knownRoutes }) {
  const problems = [];
  const { blocks } = readJsonLd(html);

  const lists = [];
  for (const block of blocks) {
    walkJsonLd(block, (node) => {
      if (node['@type'] === 'BreadcrumbList') lists.push(node);
    });
  }
  const microdata = (
    html.match(/itemtype="https?:\/\/schema\.org\/BreadcrumbList"/gi) || []
  ).length;

  const total = lists.length + microdata;
  if (total > 1) {
    problems.push(
      `${total} BreadcrumbLists on one page (${lists.length} JSON-LD, ${microdata} microdata); ` +
        'a page has one trail'
    );
  }
  if (total === 0) return problems.map((problem) => ({ route, problem }));

  for (const list of lists) {
    const items = Array.isArray(list.itemListElement) ? list.itemListElement : [];
    if (items.length < 2) {
      problems.push(`BreadcrumbList has ${items.length} item(s); a trail of one names only itself`);
      continue;
    }

    const seen = new Set();
    items.forEach((entry, index) => {
      const position = entry && entry.position;
      if (position !== index + 1) {
        problems.push(`BreadcrumbList item ${index + 1} has position ${JSON.stringify(position)}`);
      }

      const url = typeof entry?.item === 'string' ? entry.item : entry?.item?.['@id'];
      if (typeof url !== 'string' || !url) {
        problems.push(`BreadcrumbList item ${index + 1} (${entry?.name}) has no item URL`);
        return;
      }
      if (!url.startsWith(`${base}/`) && url !== base) {
        problems.push(
          `BreadcrumbList item ${index + 1} is ${JSON.stringify(url)}, not an absolute URL on ${base}`
        );
        return;
      }
      if (seen.has(url)) {
        problems.push(`BreadcrumbList lists ${JSON.stringify(url)} twice; a trail cannot revisit a page`);
      }
      seen.add(url);

      const path = url.slice(base.length).replace(/\/$/, '') || '/';
      if (knownRoutes && !knownRoutes.has(path)) {
        problems.push(
          `BreadcrumbList item ${index + 1} points at ${JSON.stringify(path)}, which the build did not render`
        );
      }
    });

    const last = items[items.length - 1];
    const lastUrl = typeof last?.item === 'string' ? last.item : last?.item?.['@id'];
    const self = route === '/' ? base : `${base}${route}`;
    if (typeof lastUrl === 'string' && lastUrl.replace(/\/$/, '') !== self.replace(/\/$/, '')) {
      problems.push(
        `BreadcrumbList ends at ${JSON.stringify(lastUrl)}, not at the page itself (${self})`
      );
    }
  }

  return problems.map((problem) => ({ route, problem }));
}

export function auditPages(pages, { origin }) {
  const problems = [];
  const add = (route, problem) => problems.push({ route, problem });

  const base = origin.replace(/\/+$/, '');
  const home = pages.find((p) => p.route === '/');
  const homeTitle = home ? readTitle(home.html) : null;

  const titlesSeen = new Map();
  const descriptionsSeen = new Map();

  /** Every route the build rendered, so a crumb cannot point at a page that is not there. */
  const knownRoutes = new Set(pages.map((p) => p.route.replace(/\/$/, '') || '/'));

  for (const { route, html } of pages) {
    const isHome = route === '/';
    const noindex = (readRobots(html) || '').toLowerCase().includes('noindex');

    // --- the page rendered at all -------------------------------------------
    if (NOT_FOUND_H1.test(html)) {
      add(route, 'renders the 404 page');
    }
    if (rootLength(html) < MIN_BODY_HTML) {
      add(route, `body is essentially empty (${rootLength(html)} chars)`);
    }

    // --- title ---------------------------------------------------------------
    const title = readTitle(html);
    if (!title) {
      add(route, 'no <title>');
    } else {
      if (!isHome && homeTitle && title === homeTitle) {
        add(route, `carries the homepage title verbatim (${JSON.stringify(title)})`);
      }
      const seen = titlesSeen.get(title);
      if (seen !== undefined) {
        add(route, `shares its <title> with ${seen}`);
      } else {
        titlesSeen.set(title, route);
      }
    }

    // --- description ---------------------------------------------------------
    const description = readDescription(html);
    if (description.count === 0 || !description.value) {
      add(route, 'no <meta name="description">');
    } else {
      if (description.count > 1) {
        add(route, `has ${description.count} description tags`);
      }
      const allowed = Object.hasOwn(DUPLICATE_DESCRIPTION_ALLOWLIST, description.value);
      const seen = descriptionsSeen.get(description.value);
      if (seen !== undefined && !allowed) {
        add(route, `shares its description with ${seen}`);
      } else if (seen === undefined) {
        descriptionsSeen.set(description.value, route);
      }
    }

    // --- canonical -----------------------------------------------------------
    // A noindexed page is telling Google not to index it; a canonical is not
    // what decides its fate, and requiring one would be noise.
    const canonical = readCanonical(html);
    if (canonical.count === 0 || !canonical.value) {
      if (!noindex) add(route, 'no <link rel="canonical">');
    } else {
      if (canonical.count > 1) {
        add(route, `has ${canonical.count} canonical tags`);
      }
      const expected = isHome ? `${base}/` : `${base}${route}`;
      const actual = canonical.value.replace(/\/$/, '') || canonical.value;
      const want = expected.replace(/\/$/, '') || expected;
      if (actual !== want) {
        if (!isHome && (actual === base || actual === `${base}/`)) {
          add(route, 'canonical points at the homepage, not at itself');
        } else {
          add(route, `canonical is ${JSON.stringify(canonical.value)}, expected ${JSON.stringify(expected)}`);
        }
      }
      if (/127\.0\.0\.1|localhost/.test(canonical.value)) {
        add(route, 'canonical points at a local preview server');
      }
    }

    // --- structured data (US-157) ----------------------------------------
    problems.push(...auditStructuredData(route, html));

    // --- breadcrumbs (US-165) --------------------------------------------
    problems.push(...auditBreadcrumbs(route, html, { base, knownRoutes }));
  }

  return problems;
}
