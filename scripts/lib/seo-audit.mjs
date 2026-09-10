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
  return attr(
    headOf(html)
      .match(/<meta[^>]*name="robots"[^>]*>/gi)
      ?.join('') || '',
    /<meta[^>]*>/gi,
    'content'
  );
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
/**
 * Breadcrumb trails that deliberately do not mirror the URL path.
 *
 * Google allows a breadcrumb that reflects how a reader got somewhere rather
 * than how the URL is spelled, so the ancestor rule below needs a way to say
 * "this one is on purpose". It is declared here, in code, rather than left to
 * whoever reads the failure — an exception made of prose asserts nothing, which
 * is the lesson from the three-vendor bundle exception in US-163.
 *
 * Each entry is `leaf path prefix` -> the non-path parent it may claim.
 */
const DELIBERATE_NON_PATH_PARENTS = [
  // The 26 city pages sit under /for/{city} while their conceptual parent is
  // the /for-real-estate-agents marketing page. Different tree, same subject.
  { leaf: '/for/', parent: '/for-real-estate-agents' },
];

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

  let breadcrumbLists = 0;

  for (const block of blocks) {
    walkJsonLd(block, (node) => {
      const type = node['@type'];

      if (type === 'BreadcrumbList') breadcrumbLists += 1;

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

      // A BreadcrumbList that describes a hierarchy the site does not have
      // (US-167/US-168). Three tool pages asserted a "Free Tools" rung
      // pointing at /tools/instagram-bio-analyzer — a sibling, not a parent —
      // for a /tools route that did not exist; /features/lead-capture did the
      // same with /features/property-listings, and shipped both of its `item`
      // values as relative URLs, which Google rejects.
      if (type === 'BreadcrumbList' && Array.isArray(node.itemListElement)) {
        const seen = new Map();
        node.itemListElement.forEach((entry, index) => {
          const item = entry && entry.item;
          const url = typeof item === 'string' ? item : item && item['@id'];
          const name = (entry && entry.name) || `position ${index + 1}`;

          if (!url) {
            problems.push(`BreadcrumbList rung "${name}" has no item URL`);
            return;
          }
          if (!/^https?:\/\//i.test(url)) {
            problems.push(
              `BreadcrumbList rung "${name}" has a relative item URL (${url}); ` +
                'schema.org requires an absolute one'
            );
            return;
          }
          if (seen.has(url)) {
            problems.push(
              `BreadcrumbList rungs "${seen.get(url)}" and "${name}" share the URL ${url}, ` +
                'so the trail claims a level that is not one'
            );
          }
          seen.set(url, name);
        });

        const last = node.itemListElement[node.itemListElement.length - 1];
        const lastItem = last && last.item;
        const lastUrl = typeof lastItem === 'string' ? lastItem : lastItem && lastItem['@id'];
        const canonical = readCanonical(html).value;
        if (lastUrl && canonical && lastUrl.replace(/\/+$/, '') !== canonical.replace(/\/+$/, '')) {
          problems.push(
            `BreadcrumbList ends at ${lastUrl} but the page's canonical is ${canonical}`
          );
        }

        // The rule the two sibling-pointing trails broke, and the one a
        // duplicate-URL check misses: every rung above the last one has to be
        // an ancestor of it. /tools/instagram-bio-analyzer is not an ancestor of
        // /tools/real-estate-agent-bio-generator, it is the tool next to it, and
        // a trail saying otherwise describes a site that does not exist.
        const pathOf = (url) => {
          try {
            return new URL(url).pathname.replace(/\/+$/, '') || '/';
          } catch {
            return null;
          }
        };
        const leaf = lastUrl && pathOf(lastUrl);
        if (leaf) {
          for (const entry of node.itemListElement.slice(0, -1)) {
            const item = entry && entry.item;
            const url = typeof item === 'string' ? item : item && item['@id'];
            const path = url && pathOf(url);
            if (!path || path === '/') continue;
            const declared = DELIBERATE_NON_PATH_PARENTS.some(
              (allowed) => leaf.startsWith(allowed.leaf) && path === allowed.parent
            );
            if (declared) continue;
            if (leaf !== path && !leaf.startsWith(`${path}/`)) {
              problems.push(
                `BreadcrumbList rung "${entry.name}" points at ${path}, which is not an ` +
                  `ancestor of ${leaf} — the trail describes a hierarchy the site does not have`
              );
            }
          }
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

  // Two BreadcrumbList declarations on one page are two answers to one
  // question, and nothing says which one Google reads. Every /for/{city} page
  // shipped two: one in the page's own @graph, one from <Breadcrumb>.
  if (breadcrumbLists > 1) {
    problems.push(
      `${breadcrumbLists} BreadcrumbList blocks on one page; there can only be one trail`
    );
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
          add(
            route,
            `canonical is ${JSON.stringify(canonical.value)}, expected ${JSON.stringify(expected)}`
          );
        }
      }
      if (/127\.0\.0\.1|localhost/.test(canonical.value)) {
        add(route, 'canonical points at a local preview server');
      }
    }

    // --- structured data (US-157) ----------------------------------------
    problems.push(...auditStructuredData(route, html));
  }

  return problems;
}
