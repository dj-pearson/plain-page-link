/**
 * The one list of blog categories that have a landing page (US-166).
 *
 * Before this existed there were three copies of it and they were only
 * accidentally in agreement:
 *
 *   - src/pages/Blog.tsx      a hardcoded array of nine {name, slug, label}
 *   - src/pages/BlogCategory  a hardcoded Record of eight slugs to editorial copy
 *   - scripts/lib/articles.mts  categorySlugs(), which derived a slug from
 *                               whatever string sat in articles.category
 *
 * The third one is the dangerous one. It generated a /blog/category/{slug}
 * route for ANY category on a published article, including categories the
 * second one has never heard of. BlogCategory renders "Category Not Found" for
 * those — a bare div with no SEOHead, so no title and no canonical — the
 * prerender gate correctly refuses to write a page in that state, and because
 * it writes all-or-nothing, `npm run build` exits 1 and NOTHING ships. One
 * dropdown value in the CMS took the deploy down, and the failure message
 * talked about titles.
 *
 * This module is deliberately free of React and of any `@/` import, so
 * scripts/lib/articles.mts can read it from node without pulling in the app —
 * the same constraint src/config/prerender-routes.ts is written under.
 *
 * `name` is the exact string stored in articles.category. `slug` is the URL.
 * They are stated separately rather than derived from each other because a
 * derivation is a guess: it happens to round-trip for all eight of these and
 * would not for a name carrying punctuation.
 *
 * ADDING ONE: add the entry here, then add its editorial content to
 * categoryContent in src/pages/BlogCategory.tsx. The second step is not
 * optional and not a convention — the Record is typed against these slugs, so
 * `tsc` fails until it is done. That is the point: a category page with no
 * copy written for it is a thin page, and US-153 is the story about what those
 * are worth.
 */

export interface BlogCategoryDefinition {
  /** The value stored in articles.category. */
  name: string;
  /** The URL segment: /blog/category/{slug}. */
  slug: string;
  /** What a reader sees. */
  label: string;
}

export const BLOG_CATEGORIES = [
  { name: 'Real Estate Tips', slug: 'real-estate-tips', label: 'Real Estate Tips' },
  { name: 'Market Insights', slug: 'market-insights', label: 'Market Insights' },
  { name: 'Buying Guide', slug: 'buying-guide', label: 'Buying Guide' },
  { name: 'Selling Guide', slug: 'selling-guide', label: 'Selling Guide' },
  { name: 'Investment', slug: 'investment', label: 'Investment' },
  { name: 'Neighborhood Guides', slug: 'neighborhood-guides', label: 'Neighborhood Guides' },
  { name: 'Home Improvement', slug: 'home-improvement', label: 'Home Improvement' },
  { name: 'General', slug: 'general', label: 'General' },
] as const satisfies readonly BlogCategoryDefinition[];

/**
 * One category, with its slug narrowed to a literal.
 *
 * BlogCategoryDefinition above is the shape; this is what a lookup returns, and
 * the difference matters: categoryContent in BlogCategory.tsx is a
 * Record<BlogCategorySlug, ...>, so a lookup returning `slug: string` cannot
 * index it.
 */
export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

/** Every slug that has a landing page, as a union type. */
export type BlogCategorySlug = BlogCategory['slug'];

/** The category a stored `articles.category` value belongs to, or null. */
export function categoryByName(name: string | null | undefined): BlogCategory | null {
  if (!name) return null;
  const wanted = name.trim().toLowerCase();
  return BLOG_CATEGORIES.find((c) => c.name.toLowerCase() === wanted) ?? null;
}

/** The category a URL segment belongs to, or null. */
export function categoryBySlug(slug: string | null | undefined): BlogCategory | null {
  if (!slug) return null;
  return BLOG_CATEGORIES.find((c) => c.slug === slug) ?? null;
}
