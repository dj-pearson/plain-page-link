/**
 * US-181: an article's author_id resolves to a real byline, and anything less
 * than a real, published name falls back to the organisation (US-180).
 * The parity check against the build guard is in scripts/lib/articles-authors.test.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  ARTICLE_AUTHOR_COLUMNS,
  articleAuthorIds,
  resolveArticleAuthor,
  resolveArticleAuthors,
} from './articleAuthor';

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

describe('articleAuthorIds (US-399)', () => {
  it('returns the distinct, non-null author ids in a stable order', () => {
    expect(
      articleAuthorIds([
        { author_id: 'u2' },
        { author_id: null },
        { author_id: 'u1' },
        { author_id: 'u2' },
      ])
    ).toEqual(['u1', 'u2']);
    expect(articleAuthorIds([])).toEqual([]);
  });
});

describe('resolveArticleAuthors (US-399)', () => {
  it('keys resolved bylines by profile id and leaves out rows that do not resolve', () => {
    const map = resolveArticleAuthors(
      [
        { id: 'u1', full_name: 'Dana Okafor', username: 'dana' },
        { id: 'u2', full_name: 'Admin', username: 'admin' },
        { id: 'u3', full_name: null, username: 'nobody' },
      ],
      SITE
    );
    expect([...map.keys()]).toEqual(['u1']);
    expect(map.get('u1')).toEqual({ name: 'Dana Okafor', url: 'https://agentbio.net/dana' });
  });

  it('is empty for no rows', () => {
    expect(resolveArticleAuthors(null, SITE).size).toBe(0);
    expect(resolveArticleAuthors(undefined, SITE).size).toBe(0);
  });
});
