/**
 * US-262: a generated article rendered two <h1> elements, its heading anchors
 * collided, and counting a view was an UPDATE no visitor was allowed to make.
 *
 * generate-article stores the model's markdown verbatim, and the prompt asks
 * for "# for title" — so the body opened with the same title the page already
 * renders as its h1. These render the real page against a mocked client.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';

let articleResult: MockQueryResult;
let authorResult: MockQueryResult;
const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => fromMock(table),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));
vi.mock('@/components/layout/PublicHeader', () => ({ PublicHeader: () => null }));
vi.mock('@/components/layout/PublicFooter', () => ({ PublicFooter: () => null }));
vi.mock('@/components/blog/SimilarArticles', () => ({ SimilarArticles: () => null }));

import BlogArticle from './BlogArticle';

const ARTICLE = {
  id: 'a1',
  title: 'How to Turn Instagram Followers into Buyers',
  slug: 'instagram-followers-buyers',
  content: [
    '# How to Turn Instagram Followers into Buyers',
    '',
    'Opening paragraph.',
    '',
    '## Why **bio links** matter',
    '',
    'Text.',
    '',
    '## Next steps',
    '',
    '## Next steps',
    '',
    '# A stray top-level heading',
    '',
    '### Detail',
  ].join('\n'),
  excerpt: 'Excerpt.',
  status: 'published',
  view_count: 4,
  published_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-02T00:00:00Z',
  tags: [],
  category: null,
  featured_image_url: null,
  seo_title: null,
  seo_description: null,
};

const renderPage = () =>
  render(
    <HelmetProvider>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={[`/blog/${ARTICLE.slug}`]}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogArticle />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );

describe('BlogArticle', () => {
  beforeEach(() => {
    articleResult = { data: ARTICLE, error: null };
    fromMock.mockReset();
    authorResult = { data: null, error: null };
    fromMock.mockImplementation((table: string) =>
      createQueryBuilder(table === 'profiles' ? authorResult : articleResult)
    );
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it('renders exactly one h1, even when the body opens with "# Title"', async () => {
    const { container } = renderPage();
    await screen.findByRole('heading', { level: 1 });
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toBe(ARTICLE.title);
  });

  it('demotes a markdown h1 in the body to h2', async () => {
    renderPage();
    const stray = await screen.findByRole('heading', { name: 'A stray top-level heading' });
    expect(stray.tagName).toBe('H2');
  });

  it('derives heading ids from their text and keeps them unique', async () => {
    renderPage();
    const bold = await screen.findByRole('heading', { name: 'Why bio links matter' });
    expect(bold.id).toBe('why-bio-links-matter');
    const steps = screen.getAllByRole('heading', { name: 'Next steps' });
    expect(steps.map((h) => h.id)).toEqual(['next-steps', 'next-steps-1']);
    expect(screen.getByRole('heading', { name: 'Detail' }).id).toBe('detail');
  });

  it('counts the view through the increment RPC, never an UPDATE on articles', async () => {
    renderPage();
    await waitFor(() => expect(rpcMock).toHaveBeenCalledTimes(1));
    const [fn, args] = rpcMock.mock.calls[0];
    expect(fn).toBe('increment_article_view');
    expect(args).toMatchObject({ p_article_id: 'a1' });
    const builders = fromMock.mock.results.map((r) => r.value as Record<string, unknown>);
    for (const b of builders) expect(b.update).not.toHaveBeenCalled();
  });

  // US-181: articles.author_id resolves to a real byline.
  const jsonLdAuthor = async () => {
    await waitFor(() =>
      expect(document.querySelector('script[type="application/ld+json"]')).not.toBeNull()
    );
    const posting = [...document.querySelectorAll('script[type="application/ld+json"]')]
      .map((el) => JSON.parse(el.textContent || '{}'))
      .find((node) => node['@type'] === 'BlogPosting');
    return posting?.author;
  };

  it('credits a published author by name, in the byline and the JSON-LD', async () => {
    articleResult = { data: { ...ARTICLE, author_id: 'u1' }, error: null };
    authorResult = { data: { id: 'u1', full_name: 'Dana Okafor', username: 'dana' }, error: null };
    const { container } = renderPage();

    const name = await screen.findByText('Dana Okafor');
    const byline = name.closest('[itemprop="author"]');
    expect(byline?.getAttribute('itemtype')).toBe('https://schema.org/Person');
    expect(name.closest('a')?.getAttribute('href')).toMatch(/\/dana$/);
    expect(container.querySelector('[itemtype="https://schema.org/Organization"]')).toBeNull();

    const author = await jsonLdAuthor();
    expect(author).toMatchObject({ '@type': 'Person', name: 'Dana Okafor' });
    expect(author.url).toMatch(/\/dana$/);

    const profileQuery = fromMock.mock.results.find(
      (_, i) => fromMock.mock.calls[i][0] === 'profiles'
    )?.value as Record<string, ReturnType<typeof vi.fn>>;
    expect(profileQuery.select).toHaveBeenCalledWith('id, full_name, username');
    expect(profileQuery.eq).toHaveBeenCalledWith('id', 'u1');
    expect(profileQuery.eq).toHaveBeenCalledWith('is_published', true);
  });

  it('falls back to the organisation when the author has no published profile', async () => {
    articleResult = { data: { ...ARTICLE, author_id: 'u1' }, error: null };
    authorResult = { data: null, error: null };
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(await jsonLdAuthor()).toMatchObject({ '@type': 'Organization', name: 'AgentBio' });
    expect(document.querySelector('[itemprop="author"]')?.getAttribute('itemtype')).toBe(
      'https://schema.org/Organization'
    );
  });

  it('falls back to the organisation, and still renders, when the lookup errors', async () => {
    articleResult = { data: { ...ARTICLE, author_id: 'u1' }, error: null };
    authorResult = { data: null, error: { message: 'permission denied' } };
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(await jsonLdAuthor()).toMatchObject({ '@type': 'Organization' });
  });

  it('does not query profiles for an article with no author_id', async () => {
    articleResult = { data: { ...ARTICLE, author_id: null }, error: null };
    renderPage();
    await screen.findByRole('heading', { level: 1 });
    expect(fromMock.mock.calls.map((c) => c[0])).not.toContain('profiles');
  });
});
