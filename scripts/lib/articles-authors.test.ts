/**
 * US-181: the build resolves article authors the same way the page does, and a
 * failure to resolve them costs the build nothing but the byline.
 */
import { describe, expect, it, vi } from 'vitest';
import {
  answerAuthorLookup,
  attachAuthors,
  authorsById,
  loadFixtureArticles,
  type Article,
} from './articles.mts';
import { GENERIC_AUTHOR_NAMES } from './seo-audit.mjs';
import { isGenericAuthorName } from '../../src/lib/articleAuthor';

function article(slug: string, authorId: string | null): Article {
  return {
    id: slug,
    slug,
    title: slug,
    content: '<p>x</p>',
    excerpt: null,
    featured_image_url: null,
    author_id: authorId,
    category: null,
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

const URL_ = 'https://db.example.invalid';
const KEY = 'anon-key';

describe('attachAuthors', () => {
  it('asks for published profiles of the distinct author ids, with safe columns only', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(JSON.stringify([{ id: 'u1', full_name: 'Dana Okafor', username: 'dana' }]), {
          status: 200,
        })
    );
    const out = await attachAuthors(
      URL_,
      KEY,
      [article('a', 'u1'), article('b', 'u1'), article('c', 'u2'), article('d', null)],
      fetcher as unknown as typeof fetch
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    const requested = new URL(String((fetcher.mock.calls[0] as unknown[])[0]));
    expect(requested.pathname).toBe('/rest/v1/profiles');
    expect(requested.searchParams.get('select')).toBe('id,full_name,username');
    expect(requested.searchParams.get('is_published')).toBe('eq.true');
    expect(requested.searchParams.get('id')).toBe('in.(u1,u2)');

    expect(out.map((a) => a.author?.full_name ?? null)).toEqual([
      'Dana Okafor',
      'Dana Okafor',
      null,
      null,
    ]);
  });

  it('makes no request when no article has an author', async () => {
    const fetcher = vi.fn();
    const out = await attachAuthors(
      URL_,
      KEY,
      [article('a', null)],
      fetcher as unknown as typeof fetch
    );
    expect(fetcher).not.toHaveBeenCalled();
    expect(out[0].author).toBeNull();
  });

  it('credits everything to the organisation, rather than failing, when the lookup fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetcher = vi.fn(async () => new Response('nope', { status: 500 }));
    const out = await attachAuthors(
      URL_,
      KEY,
      [article('a', 'u1')],
      fetcher as unknown as typeof fetch
    );
    expect(out).toHaveLength(1);
    expect(out[0].author).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('authorsById', () => {
  it('maps only rows that belong to the article carrying them', () => {
    const good = { ...article('a', 'u1'), author: { id: 'u1', full_name: 'Dana', username: 'd' } };
    const mismatched = {
      ...article('b', 'u2'),
      author: { id: 'u3', full_name: 'Someone Else', username: 's' },
    };
    const map = authorsById([good, mismatched, article('c', null)]);
    expect([...map.keys()]).toEqual(['u1']);
  });

  it('gives the verification build one resolved author, so the Person path is exercised', async () => {
    const fixtures = await loadFixtureArticles();
    const map = authorsById(fixtures);
    expect(map.size).toBe(1);
    const [row] = [...map.values()];
    expect(isGenericAuthorName(row.full_name ?? '')).toBe(false);
  });
});

describe('isGenericAuthorName agrees with the build guard', () => {
  // If these diverge, a profile could pass the page's check and then fail
  // verify:seo — taking the deploy down over one agent's display name.
  const names = [
    'Real Estate Expert',
    'Admin',
    'The Team',
    'AgentBio Team',
    'Editorial Team',
    'Anonymous',
    'Guest Author',
    'Unknown',
    'SEO Writer',
    'Dana Okafor',
    'Pat Team-Smith',
    'Expert Realty Group',
    'Fixture Byline',
  ];

  it.each(names)('%s', (name) => {
    const guard = (GENERIC_AUTHOR_NAMES as RegExp[]).some((pattern) => pattern.test(name));
    expect(isGenericAuthorName(name)).toBe(guard);
  });
});

describe('answerAuthorLookup (US-399)', () => {
  const authors = new Map([
    ['u1', { id: 'u1', full_name: 'Dana Okafor', username: 'dana' }],
    ['u2', { id: 'u2', full_name: 'Sam Lee', username: 'sam' }],
  ]);
  const params = (query: string) => new URLSearchParams(query);

  it("answers BlogArticle's single-author lookup", () => {
    expect(answerAuthorLookup('GET', params('id=eq.u1&is_published=eq.true'), authors)).toEqual([
      authors.get('u1'),
    ]);
    expect(answerAuthorLookup('GET', params('id=eq.nope&is_published=eq.true'), authors)).toEqual(
      []
    );
  });

  it("answers the blog list cards' batched lookup with the known rows only", () => {
    const rows = answerAuthorLookup(
      'GET',
      params('select=id,full_name,username&id=in.(u1,u2,u9)&is_published=eq.true'),
      authors
    );
    expect(rows?.map((r) => r.id)).toEqual(['u1', 'u2']);
  });

  it('accepts PostgREST-quoted values in an in.() list', () => {
    const rows = answerAuthorLookup('GET', params('id=in.("u2")&is_published=eq.true'), authors);
    expect(rows?.map((r) => r.id)).toEqual(['u2']);
  });

  it('falls through for anything that is not an author lookup', () => {
    expect(answerAuthorLookup('GET', params('id=eq.u1'), authors)).toBeNull();
    expect(answerAuthorLookup('POST', params('id=eq.u1&is_published=eq.true'), authors)).toBeNull();
    expect(answerAuthorLookup('GET', params('is_published=eq.true&limit=6'), authors)).toBeNull();
    expect(answerAuthorLookup('GET', params('id=neq.u1&is_published=eq.true'), authors)).toBeNull();
  });
});
