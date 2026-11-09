/**
 * US-399: the blog index and category cards name who wrote each article, from
 * ONE batched profiles request per list rather than one per card.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { createQueryBuilder, type MockQueryResult } from '@/test/mocks/supabase';
import { BLOG_CATEGORIES } from '@/config/blog-categories';

let articlesResult: MockQueryResult;
let authorsResult: MockQueryResult;
const builders: Record<string, ReturnType<typeof createQueryBuilder>[]> = {};
const fromMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: (table: string) => fromMock(table) },
}));
vi.mock('@/components/layout/PublicHeader', () => ({ PublicHeader: () => null }));
vi.mock('@/components/layout/PublicFooter', () => ({ PublicFooter: () => null }));

import Blog from './Blog';
import BlogCategory from './BlogCategory';

const CATEGORY = BLOG_CATEGORIES[0];

const article = (id: string, authorId: string | null) => ({
  id,
  title: `Article ${id}`,
  slug: `article-${id}`,
  excerpt: `Excerpt ${id}`,
  category: CATEGORY.name,
  tags: [],
  status: 'published',
  view_count: 1,
  featured_image_url: null,
  published_at: '2026-10-01T00:00:00Z',
  author_id: authorId,
});

const renderAt = (path: string) =>
  render(
    <HelmetProvider>
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/category/:category" element={<BlogCategory />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );

describe.each([
  ['/blog', '/blog'],
  ['/blog/category/:category', `/blog/category/${CATEGORY.slug}`],
])('%s cards', (_label, path) => {
  beforeEach(() => {
    for (const key of Object.keys(builders)) delete builders[key];
    articlesResult = {
      data: [article('1', 'u1'), article('2', 'u1'), article('3', 'u2'), article('4', null)],
      error: null,
    };
    authorsResult = {
      data: [
        { id: 'u1', full_name: 'Dana Okafor', username: 'dana' },
        // A role, not a person: shows no byline rather than "By Admin".
        { id: 'u2', full_name: 'Admin', username: 'admin' },
      ],
      error: null,
    };
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      const builder = createQueryBuilder(table === 'profiles' ? authorsResult : articlesResult);
      (builders[table] ??= []).push(builder);
      return builder;
    });
  });

  it('shows the resolved author on each of their cards', async () => {
    renderAt(path);
    await waitFor(() => expect(screen.getAllByText('By Dana Okafor')).toHaveLength(2));
    expect(screen.queryByText(/By Admin/)).toBeNull();
    expect(screen.getByText('Article 4')).toBeTruthy();
  });

  it('looks every author up in one request, for published profiles only, with safe columns', async () => {
    renderAt(path);
    await waitFor(() => expect(screen.getAllByText('By Dana Okafor')).toHaveLength(2));

    expect(builders.profiles).toHaveLength(1);
    const query = builders.profiles[0];
    expect(query.select).toHaveBeenCalledWith('id, full_name, username');
    expect(query.in).toHaveBeenCalledWith('id', ['u1', 'u2']);
    expect(query.eq).toHaveBeenCalledWith('is_published', true);
  });

  it('still lists the articles, without bylines, when the author lookup fails', async () => {
    authorsResult = { data: null, error: { message: 'permission denied' } };
    renderAt(path);
    await waitFor(() => expect(screen.getByText('Article 1')).toBeTruthy());
    expect(screen.queryByText(/^By /)).toBeNull();
  });

  it('makes no profiles request when no article has an author', async () => {
    articlesResult = { data: [article('1', null)], error: null };
    renderAt(path);
    await waitFor(() => expect(screen.getByText('Article 1')).toBeTruthy());
    expect(builders.profiles).toBeUndefined();
  });
});
