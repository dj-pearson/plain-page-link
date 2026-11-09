/**
 * Who wrote an article (US-181).
 *
 * `articles.author_id` has always been set — useArticles writes the signed-in
 * user's id — but nothing on the render path read it, so US-180 had to
 * attribute every article to the organisation. This resolves it to the
 * author's profile, which is what a real byline (and a schema.org Person) is
 * made from.
 *
 * Why a second query rather than a PostgREST embed: `articles_author_id_fkey`
 * references `auth.users`, not `profiles`, so there is no relationship for
 * `select('*, author:profiles(...)')` to follow. Adding one is a migration,
 * and a browser query that embeds a relationship the live database does not
 * have yet fails outright (PGRST200) — the article page would go blank until
 * the migration was applied. A separate lookup that degrades to the
 * organisation cannot break the page.
 *
 * Only a PUBLISHED profile resolves. Anonymous visitors cannot read any other
 * kind (RLS), and the signed-in author can read their own unpublished row; the
 * explicit filter keeps the byline the same for every viewer and for the
 * prerender, and keeps the Person's url pointing at a page that exists.
 */

/** Only columns `anon` holds SELECT on (20260808000002) — never `*` on profiles. */
export const ARTICLE_AUTHOR_COLUMNS = 'id, full_name, username';

export interface ArticleAuthorRow {
  id: string;
  full_name: string | null;
  username: string | null;
}

export interface ArticleAuthor {
  name: string;
  /** The author's public AgentBio page, when they have a username. */
  url?: string;
}

/**
 * Names that describe a role instead of naming a person.
 *
 * Mirrors GENERIC_AUTHOR_NAMES in scripts/lib/seo-audit.mjs, which fails the
 * build on a Person author with one of these names. A profile whose full_name
 * is "Admin" must fall back to the organisation here rather than reach the
 * page and fail the deploy; articleAuthor.test.ts holds the two lists together.
 */
const GENERIC_AUTHOR_NAMES = [
  /^(real estate|seo|marketing|content|industry)?\s*(expert|team|staff|editor|admin|author|writer)$/i,
  /^(the )?(agentbio )?(team|staff|editorial team)$/i,
  /^(guest|anonymous|unknown)( author)?$/i,
];

export function isGenericAuthorName(name: string): boolean {
  const trimmed = name.trim();
  return GENERIC_AUTHOR_NAMES.some((pattern) => pattern.test(trimmed));
}

/** Usernames are lower-case slugs; anything else is not a path we built. */
const USERNAME = /^[a-z0-9][a-z0-9_-]*$/i;

/**
 * The byline for a profile row, or null when the article should be credited
 * to the organisation: no row, no name, or a name that is a role.
 */
export function resolveArticleAuthor(
  row: ArticleAuthorRow | null | undefined,
  siteUrl: string
): ArticleAuthor | null {
  if (!row) return null;
  const name = (row.full_name ?? '').replace(/\s+/g, ' ').trim();
  if (!name || isGenericAuthorName(name)) return null;

  const username = (row.username ?? '').trim();
  if (!username || !USERNAME.test(username)) return { name };
  return { name, url: `${siteUrl.replace(/\/+$/, '')}/${encodeURIComponent(username)}` };
}

/**
 * The distinct author ids of a list of articles, sorted so the same list
 * always produces the same query key and the same `in.()` filter (US-399).
 */
export function articleAuthorIds(articles: ReadonlyArray<{ author_id: string | null }>): string[] {
  const ids = new Set<string>();
  for (const article of articles) {
    if (article.author_id) ids.add(article.author_id);
  }
  return [...ids].sort();
}

/**
 * Bylines keyed by profile id, for the blog index and category cards (US-399).
 * A row that does not resolve (no name, a role for a name) is left out, so the
 * card shows no byline rather than a placeholder.
 */
export function resolveArticleAuthors(
  rows: ReadonlyArray<ArticleAuthorRow> | null | undefined,
  siteUrl: string
): Map<string, ArticleAuthor> {
  const byId = new Map<string, ArticleAuthor>();
  for (const row of rows ?? []) {
    const author = resolveArticleAuthor(row, siteUrl);
    if (author) byId.set(row.id, author);
  }
  return byId;
}
