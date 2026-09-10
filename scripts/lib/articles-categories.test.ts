/**
 * Proof that a category nobody wrote a page for no longer takes the deploy down
 * (US-166).
 *
 * The old categorySlugs() slugified articles.category and returned whatever
 * came out. `preUS166Behaviour` below is that function verbatim; the first test
 * shows what it produced for an article categorised "Agent Spotlight" — a
 * /blog/category/agent-spotlight route, for a page BlogCategory.tsx renders as
 * a bare "Category Not Found" div with no <title> and no canonical. The
 * prerender gate refuses to write a page in that state, and it writes
 * all-or-nothing, so all 57 files were withheld and `npm run build` exited 1.
 */
import { describe, expect, it } from 'vitest';
import { categorySlugs, type Article } from './articles.mts';
import { BLOG_CATEGORIES, categoryByName, categoryBySlug } from '../../src/config/blog-categories';

function article(slug: string, category: string | null): Article {
  return {
    id: slug,
    slug,
    title: slug,
    content: '<p>x</p>',
    excerpt: null,
    featured_image_url: null,
    author_id: null,
    category,
    tags: null,
    status: 'published',
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    view_count: null,
    published_at: '2026-01-01T00:00:00Z',
    created_at: null,
    updated_at: null,
    generated_from_suggestion_id: null,
    keyword_id: null,
  };
}

/** categorySlugs() as it stood before US-166. */
function preUS166Behaviour(articles: Article[]): string[] {
  return [
    ...new Set(
      articles
        .map((a) => a.category)
        .filter((c): c is string => !!c)
        .map((c) => c.toLowerCase().replace(/\s+/g, '-'))
    ),
  ].sort();
}

describe('categorySlugs', () => {
  const withUnknown = [
    article('a', 'Real Estate Tips'),
    article('b', 'Agent Spotlight'),
    article('c', 'Agent Spotlight'),
    article('d', null),
  ];

  it('used to generate a route for a category with no page behind it', () => {
    expect(preUS166Behaviour(withUnknown)).toContain('agent-spotlight');
  });

  it('no longer does', () => {
    expect(categorySlugs(withUnknown).slugs).toEqual(['real-estate-tips']);
  });

  it('reports the skipped categories with a count, rather than skipping quietly', () => {
    expect(categorySlugs(withUnknown).unlisted).toEqual([{ name: 'Agent Spotlight', articles: 2 }]);
  });

  it('emits nothing for a category that has a page but no published article', () => {
    expect(categorySlugs([article('a', 'Investment')]).slugs).toEqual(['investment']);
    expect(categorySlugs([]).slugs).toEqual([]);
  });

  it('matches the stored name case-insensitively and ignores surrounding space', () => {
    expect(categorySlugs([article('a', '  real estate TIPS ')]).slugs).toEqual([
      'real-estate-tips',
    ]);
  });

  it('orders unlisted categories by how many articles are stranded', () => {
    const stranded = [
      article('a', 'Zoning'),
      article('b', 'Agent Spotlight'),
      article('c', 'Agent Spotlight'),
    ];
    expect(categorySlugs(stranded).unlisted.map((u) => u.name)).toEqual([
      'Agent Spotlight',
      'Zoning',
    ]);
  });
});

describe('the registry itself', () => {
  it('has no duplicate slug or name', () => {
    expect(new Set(BLOG_CATEGORIES.map((c) => c.slug)).size).toBe(BLOG_CATEGORIES.length);
    expect(new Set(BLOG_CATEGORIES.map((c) => c.name)).size).toBe(BLOG_CATEGORIES.length);
  });

  it('uses slugs that are URL-safe', () => {
    for (const category of BLOG_CATEGORIES)
      expect(category.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('round-trips name to slug and back', () => {
    for (const category of BLOG_CATEGORIES) {
      expect(categoryBySlug(category.slug)?.name).toBe(category.name);
      expect(categoryByName(category.name)?.slug).toBe(category.slug);
    }
  });

  it('returns null rather than guessing', () => {
    expect(categoryBySlug('agent-spotlight')).toBeNull();
    expect(categoryByName('Agent Spotlight')).toBeNull();
    expect(categoryByName(null)).toBeNull();
    expect(categoryBySlug(undefined)).toBeNull();
  });
});
