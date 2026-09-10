/**
 * Build-time access to the `articles` table (US-148).
 *
 * src/pages/BlogArticle.tsx:26 queries `.from('articles')` in the browser, so a
 * blog URL returns the same empty shell as everything else and the article text
 * only exists after the bundle executes AND a Supabase round-trip resolves —
 * the worst case for indexing. The 25 posts other than the single 2024 one
 * earned 2 clicks between them in 16 months.
 *
 * The rows are read here, over PostgREST with the anon key, so the prerender can
 * hand them to the page and snapshot a document that already contains the
 * article. No service-role key: the same RLS that governs the browser governs
 * this, which also means a row this cannot see is a row the site cannot show.
 *
 * There is deliberately no silent empty case. A build that cannot reach the
 * database and has no snapshot fails, because a blog that quietly ships zero
 * posts is exactly how public/sitemap.xml came to contain none.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { categoryByName } from '../../src/config/blog-categories';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

/** Committed so a build without database credentials still ships the blog. */
export const SNAPSHOT_PATH = join(root, 'scripts', 'data', 'articles.snapshot.json');

/** The columns BlogArticle/Blog select with `*`, as declared in supabase/types.ts. */
export interface Article {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  featured_image_url: string | null;
  author_id: string | null;
  category: string | null;
  tags: string[] | null;
  status: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  view_count: number | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  generated_from_suggestion_id: string | null;
  keyword_id: string | null;
}

export interface ArticleLoad {
  articles: Article[];
  source: 'supabase' | 'snapshot';
}

const FETCH_TIMEOUT_MS = 15_000;

function credentials(): { url: string; key: string } | null {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url || !key) return null;
  // The placeholders CI uses to make the bundle boot are not a database.
  if (url.includes('placeholder') || key.includes('placeholder')) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

async function fetchFromSupabase(url: string, key: string): Promise<Article[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Same filter and order as src/pages/Blog.tsx, so the build and the browser
    // never disagree about what is published.
    const endpoint = `${url}/rest/v1/articles?select=*&status=eq.published&order=published_at.desc`;
    const response = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`PostgREST answered ${response.status} ${response.statusText}`);
    }
    return (await response.json()) as Article[];
  } finally {
    clearTimeout(timer);
  }
}

async function readSnapshot(): Promise<Article[] | null> {
  if (!existsSync(SNAPSHOT_PATH)) return null;
  try {
    const parsed = JSON.parse(await readFile(SNAPSHOT_PATH, 'utf8')) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as Article[];
  } catch {
    return null;
  }
}

export async function writeSnapshot(articles: Article[]): Promise<void> {
  await mkdir(dirname(SNAPSHOT_PATH), { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(articles, null, 2) + '\n', 'utf8');
}

/**
 * Published articles for the build, from the database when it is reachable and
 * from the committed snapshot when it is not. Throws rather than returning an
 * empty list.
 */
export async function loadArticles(): Promise<ArticleLoad> {
  const creds = credentials();

  if (creds) {
    try {
      const articles = await fetchFromSupabase(creds.url, creds.key);
      if (articles.length === 0) {
        throw new Error('the database returned zero published articles');
      }
      return { articles, source: 'supabase' };
    } catch (error) {
      const snapshot = await readSnapshot();
      if (snapshot && snapshot.length > 0) {
        console.warn(
          `[articles] could not read the database (${(error as Error).message}); ` +
            `falling back to the committed snapshot of ${snapshot.length} articles`
        );
        return { articles: snapshot, source: 'snapshot' };
      }
      throw new Error(
        `Cannot read articles from ${creds.url} (${(error as Error).message}) and ` +
          `there is no usable snapshot at scripts/data/articles.snapshot.json.\n` +
          `Refusing to ship a blog with no posts in it.`
      );
    }
  }

  const snapshot = await readSnapshot();
  if (snapshot && snapshot.length > 0) {
    console.log(
      `[articles] no database credentials; using the committed snapshot ` +
        `(${snapshot.length} articles). Set VITE_SUPABASE_URL and ` +
        `VITE_SUPABASE_ANON_KEY to build against live content.`
    );
    return { articles: snapshot, source: 'snapshot' };
  }

  throw new Error(
    'No database credentials and no snapshot at scripts/data/articles.snapshot.json.\n' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, or run `npm run articles:snapshot`\n' +
      'somewhere that can reach the database and commit the result.\n' +
      'Refusing to ship a blog with no posts in it.'
  );
}

/**
 * Categories that have both a published article and a landing page (US-166).
 *
 * This used to slugify `articles.category` and return whatever came out, which
 * generated a route for every category anyone had ever typed into the CMS.
 * BlogCategory.tsx renders those as "Category Not Found" — no title, no
 * canonical — the prerender gate refuses to write a page in that state, and
 * because it writes all-or-nothing, the whole build failed. A category that has
 * no page is now simply not a route, and is reported rather than fatal.
 *
 * `unlisted` is what the build prints. Silence would swap a loud wrong failure
 * for a quiet one: an editor whose new category never gets a landing page
 * should hear about it from the build, not from Search Console in six months.
 */
export function categorySlugs(articles: Article[]): {
  slugs: string[];
  unlisted: { name: string; articles: number }[];
} {
  const slugs = new Set<string>();
  const unlisted = new Map<string, number>();

  for (const article of articles) {
    if (!article.category) continue;
    const known = categoryByName(article.category);
    if (known) {
      slugs.add(known.slug);
    } else {
      unlisted.set(article.category, (unlisted.get(article.category) ?? 0) + 1);
    }
  }

  return {
    slugs: [...slugs].sort(),
    unlisted: [...unlisted]
      .map(([name, count]) => ({ name, articles: count }))
      .sort((a, b) => b.articles - a.articles || a.name.localeCompare(b.name)),
  };
}

/** Committed, and loaded ONLY by a verification build; see scripts/data/README.md. */
export const FIXTURE_PATH = join(root, 'scripts', 'data', 'articles.fixture.json');

/**
 * The three articles a database-less verification build renders (US-186).
 *
 * Deliberately NOT reachable from loadArticles(). A build that intends to
 * deploy must never silently fall back to invented content — that is the whole
 * argument of US-169 — so the fixture has its own entry point, called from the
 * one branch in scripts/prerender.mts that already means "this build will not
 * ship".
 *
 * Throws if the file is missing or empty. A verification build that quietly
 * checks no blog pages is the state this replaces.
 */
export async function loadFixtureArticles(): Promise<Article[]> {
  const raw = await readFile(FIXTURE_PATH, 'utf8').catch(() => null);
  if (raw === null) {
    throw new Error(
      `No fixture at ${FIXTURE_PATH}. A verification build renders the blog from ` +
        `it so the SEO checks cover /blog; without it they would silently cover ` +
        `only the marketing pages.`
    );
  }

  const articles = JSON.parse(raw) as Article[];
  if (!Array.isArray(articles) || articles.length === 0) {
    throw new Error(`${FIXTURE_PATH} has no articles in it.`);
  }

  // The one property that matters if this ever escapes: it must be obvious.
  const unmarked = articles.filter((article) => !article.title.startsWith('Fixture:'));
  if (unmarked.length > 0) {
    throw new Error(
      `Fixture articles must be titled "Fixture: …" so they are recognisable on ` +
        `sight: ${unmarked.map((a) => a.title).join(', ')}`
    );
  }

  return articles;
}
