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
export function auditPages(pages, { origin }) {
  const problems = [];
  const add = (route, problem) => problems.push({ route, problem });

  const base = origin.replace(/\/+$/, '');
  const home = pages.find((p) => p.route === '/');
  const homeTitle = home ? readTitle(home.html) : null;

  const titlesSeen = new Map();
  const descriptionsSeen = new Map();

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
  }

  return problems;
}
