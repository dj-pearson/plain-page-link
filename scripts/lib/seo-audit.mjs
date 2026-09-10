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

/**
 * Images whose intrinsic size this repo actually knows, and what it is.
 *
 * Mirrors DEFAULT_SOCIAL_IMAGE in src/config/og-image.ts, which is itself
 * checked against the bytes on disk by src/config/og-image.test.ts. Two
 * declarations rather than an import because this module is plain node with no
 * bundler, and the test on the other side is what keeps them honest.
 */
const KNOWN_IMAGE_SIZES = new Map([
  ['/Cover.png', { width: 1536, height: 1024 }],
  ['/logo.png', { width: 946, height: 436 }],
]);

/**
 * Names that describe a role instead of naming a person.
 *
 * 'Real Estate Expert' was the default author on every article. The list is
 * deliberately short and literal — the point is not to police names, it is to
 * catch a placeholder that was never replaced.
 */
const GENERIC_AUTHOR_NAMES = [
  /^(real estate|seo|marketing|content|industry)?\s*(expert|team|staff|editor|admin|author|writer)$/i,
  /^(the )?(agentbio )?(team|staff|editorial team)$/i,
  /^(guest|anonymous|unknown)( author)?$/i,
];

function knownSizeFor(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    return KNOWN_IMAGE_SIZES.get(new URL(url, 'https://agentbio.net').pathname) ?? null;
  } catch {
    return KNOWN_IMAGE_SIZES.get(url) ?? null;
  }
}

function isKnownImage(url) {
  return knownSizeFor(url) !== null;
}

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

      // An author who is a job description rather than a person (US-180).
      //
      // Article.author is what Google reads to decide who stands behind a
      // piece. Every article shipped `author: { '@type': 'Person', name:
      // 'Real Estate Expert' }` — a role, presented as a named human, with a
      // url pointing at the site root rather than at any author page. That is
      // the invented-testimonial defect in the field where it counts most.
      //
      // An Organization author is fine and often correct: the company
      // published it. A Person has to be someone.
      if (node.author && typeof node.author === 'object' && !Array.isArray(node.author)) {
        const author = node.author;
        const name = typeof author.name === 'string' ? author.name.trim() : '';
        if (author['@type'] === 'Person') {
          if (!name) {
            problems.push(`${type} has a Person author with no name`);
          } else if (GENERIC_AUTHOR_NAMES.some((generic) => generic.test(name))) {
            problems.push(
              `${type} names its author "${name}", which is a role rather than a person`
            );
          }
        }
      }

      // An ImageObject asserting a size for a file nobody measured (US-174).
      // Google fetches the image and measures it; a declared 1200x630 on a
      // 1536x1024 file is a claim it can see is false, and on a small upload it
      // is a false claim of large-image rich-result eligibility.
      if (node.image && typeof node.image === 'object' && !Array.isArray(node.image)) {
        const image = node.image;
        const declares = image.width !== undefined || image.height !== undefined;
        if (declares && !isKnownImage(image.url)) {
          problems.push(
            `${type} declares image dimensions (${image.width}x${image.height}) for ` +
              `${image.url || 'an image with no url'}, whose size is not known here`
          );
        }
        if (declares && (!image.width || !image.height)) {
          problems.push(`${type} declares one image dimension without the other`);
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
          if (typeof question === 'string' && question.length >= 12) {
            const probe = question.slice(0, 40).replace(/\s+/g, ' ');
            if (!visibleText.includes(probe)) {
              problems.push(`FAQPage question is not visible on the page: "${probe}…"`);
            }
          }

          // And the answer (US-185). Checking only the question missed 25
          // answers that were in the JSON-LD and in no page: five accordions
          // rendered `{isOpen && <p>{answer}</p>}`, so a closed one had no
          // answer text in the document at all. Google's FAQPage requirement is
          // that the answer be present on the page; an accordion is explicitly
          // allowed, and not rendering the content is not the same thing.
          const answer = entry && entry.acceptedAnswer && entry.acceptedAnswer.text;
          if (typeof answer !== 'string') continue;
          const plain = answer.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (plain.length < 20) continue;
          const answerProbe = plain.slice(0, 45);
          if (!visibleText.includes(answerProbe)) {
            problems.push(`FAQPage answer is not on the page: "${answerProbe}…"`);
          }
        }
      }
    });
  }

  // og:image:width / :height are read by every unfurl to reserve layout before
  // the bytes arrive, so a wrong pair breaks the card on every platform at once.
  // All 58 pages declared 1200x630 for a 1536x1024 file (US-174).
  {
    const head = headOf(html);
    const ogImage = attr(
      head.match(/<meta[^>]*property="og:image"[^>]*>/gi)?.join('') || '',
      /<meta[^>]*>/gi,
      'content'
    );
    const declared = {
      width: attr(
        head.match(/<meta[^>]*property="og:image:width"[^>]*>/gi)?.join('') || '',
        /<meta[^>]*>/gi,
        'content'
      ),
      height: attr(
        head.match(/<meta[^>]*property="og:image:height"[^>]*>/gi)?.join('') || '',
        /<meta[^>]*>/gi,
        'content'
      ),
    };

    if (!ogImage) {
      problems.push('no og:image — social platforms fall back to whatever they scrape');
    } else if (declared.width || declared.height) {
      const known = knownSizeFor(ogImage);
      if (!known) {
        problems.push(
          `og:image:width/height declared for ${ogImage}, whose size is not known here`
        );
      } else if (
        String(known.width) !== declared.width ||
        String(known.height) !== declared.height
      ) {
        problems.push(
          `og:image is ${known.width}x${known.height} but the tags declare ` +
            `${declared.width}x${declared.height}`
        );
      }
    }
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

/**
 * Same-origin URLs inside JSON-LD that no page answers (US-179).
 *
 * Structured data is a set of assertions, and a URL in it is an assertion that
 * the URL is a thing. Two were false on every page that carried them:
 * ContactPoint.url named https://agentbio.net/contact, and the WebSite
 * SearchAction's urlTemplate named /search?q= — the endpoint Google reads to
 * offer a sitelinks searchbox. Neither has ever been a route in App.tsx. While
 * `/* /index.html 200` was in place they at least answered something; after
 * US-176 they are 404s, and a searchbox pointing at one sends people nowhere.
 *
 * Only same-origin URLs are checked. An off-site sameAs is not ours to verify,
 * and asset paths are files rather than pages.
 *
 * @param {{route: string, html: string}[]} pages
 * @param {Set<string>} routes every path the build renders
 * @returns {{route: string, problem: string}[]}
 */
export function auditStructuredDataUrls(pages, routes, { origin }) {
  const problems = [];
  const base = origin.replace(/\/+$/, '');
  // Keys whose string value is a URL that has to resolve to a page.
  const URL_KEYS = new Set(['url', '@id', 'item', 'urlTemplate', 'mainEntityOfPage', 'target']);
  const IS_ASSET = /\.(png|jpe?g|webp|gif|svg|ico|xml|txt|json|pdf|mp4|webm)$/i;

  for (const { route, html } of pages) {
    const { blocks } = readJsonLd(html);
    const seen = new Set();

    for (const block of blocks) {
      walkJsonLd(block, (node) => {
        for (const [key, value] of Object.entries(node)) {
          if (!URL_KEYS.has(key) || typeof value !== 'string') continue;
          if (!value.startsWith(base)) continue;

          // A urlTemplate carries a {placeholder}; the path before the query
          // is what has to exist.
          const path = (value.slice(base.length).split('#')[0].split('?')[0] || '/')
            .replace(/\/+$/, '') || '/';
          if (IS_ASSET.test(path)) continue;
          if (routes.has(path)) continue;
          if (seen.has(`${key}:${path}`)) continue;
          seen.add(`${key}:${path}`);

          problems.push({
            route,
            problem: `structured data ${key} points at ${path}, which is not a page`,
          });
        }
      });
    }
  }

  return problems;
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
    // /404 is the one route whose job is to render that page, so Cloudflare
    // Pages has a document to return with a 404 status (US-176). Every other
    // route rendering it means the route does not exist.
    if (route !== '/404' && NOT_FOUND_H1.test(html)) {
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
