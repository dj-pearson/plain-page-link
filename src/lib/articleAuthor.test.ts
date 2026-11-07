/**
 * US-181: an article's author_id resolves to a real byline, and anything less
 * than a real, published name falls back to the organisation (US-180).
 * The parity check against the build guard is in scripts/lib/articles-authors.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { ARTICLE_AUTHOR_COLUMNS, resolveArticleAuthor } from './articleAuthor';

const SITE = 'https://agentbio.net';

describe('resolveArticleAuthor', () => {
  it('names the author and links their public page', () => {
    expect(
      resolveArticleAuthor({ id: 'u1', full_name: 'Dana Okafor', username: 'dana' }, SITE)
    ).toEqual({ name: 'Dana Okafor', url: 'https://agentbio.net/dana' });
  });

  it('tolerates a trailing slash on the site url and collapses whitespace in the name', () => {
    expect(
      resolveArticleAuthor(
        { id: 'u1', full_name: '  Dana   Okafor ', username: 'dana' },
        `${SITE}/`
      )
    ).toEqual({ name: 'Dana Okafor', url: 'https://agentbio.net/dana' });
  });

  it('keeps the name but drops the url when there is no usable username', () => {
    expect(
      resolveArticleAuthor({ id: 'u1', full_name: 'Dana Okafor', username: null }, SITE)
    ).toEqual({
      name: 'Dana Okafor',
    });
    expect(
      resolveArticleAuthor({ id: 'u1', full_name: 'Dana Okafor', username: '../admin' }, SITE)
    ).toEqual({ name: 'Dana Okafor' });
  });

  it('falls back to the organisation for no row, no name, or a name that is a role', () => {
    expect(resolveArticleAuthor(null, SITE)).toBeNull();
    expect(resolveArticleAuthor(undefined, SITE)).toBeNull();
    expect(resolveArticleAuthor({ id: 'u1', full_name: null, username: 'x' }, SITE)).toBeNull();
    expect(resolveArticleAuthor({ id: 'u1', full_name: '   ', username: 'x' }, SITE)).toBeNull();
    expect(resolveArticleAuthor({ id: 'u1', full_name: 'Admin', username: 'x' }, SITE)).toBeNull();
    expect(
      resolveArticleAuthor({ id: 'u1', full_name: 'Real Estate Expert', username: 'x' }, SITE)
    ).toBeNull();
  });

  it('selects only columns anon can read on profiles, never *', () => {
    expect(ARTICLE_AUTHOR_COLUMNS).not.toContain('*');
    const columns = ARTICLE_AUTHOR_COLUMNS.split(',').map((c) => c.trim());
    // From the column grant in 20260808000002_close_anon_data_exposure.sql.
    const anonReadable = new Set(['id', 'username', 'full_name', 'avatar_url', 'is_published']);
    for (const column of columns) expect(anonReadable.has(column), column).toBe(true);
  });
});
