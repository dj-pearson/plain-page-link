/**
 * US-630: the page list hid which page was live, and showed "No pages yet" when
 * the pages had simply failed to load.
 *
 * loadUserPages dropped custom_pages.is_active when it mapped rows, so the
 * `(page as any).is_active` PageList read was always undefined: no page ever
 * carried the Active badge and every published page offered "Set as Active",
 * the live one included. And loadUserPages answered a failed query with [],
 * which PageList rendered as the empty state, inviting the agent to build a
 * duplicate of the page their visitors were already seeing.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PageConfig } from '@/types/pageBuilder';

const { loadUserPages, setAsActivePage } = vi.hoisted(() => ({
  loadUserPages: vi.fn(),
  setAsActivePage: vi.fn(),
}));

vi.mock('@/stores/pageBuilderStore', () => ({
  usePageBuilderStore: () => ({ setPage: vi.fn(), loadUserPages, setAsActivePage }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 'agent-1' }, profile: { username: 'jane' } }),
}));

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { PageList } from './PageList';

const page = (overrides: Partial<PageConfig>): PageConfig => ({
  id: 'p',
  userId: 'agent-1',
  slug: 'jane',
  title: 'Page',
  description: '',
  blocks: [],
  theme: {} as PageConfig['theme'],
  seo: {} as PageConfig['seo'],
  published: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...overrides,
});

const renderList = () =>
  render(
    <MemoryRouter>
      <PageList />
    </MemoryRouter>
  );

beforeEach(() => {
  loadUserPages.mockReset();
  setAsActivePage.mockReset();
});

describe('PageList (US-630)', () => {
  it('marks the active, published page as live and offers no "Set as Active" on it', async () => {
    loadUserPages.mockResolvedValue([
      page({ id: 'live', title: 'Spring page', isActive: true }),
      page({ id: 'other', title: 'Winter page', isActive: false }),
    ]);
    renderList();

    expect(await screen.findByText('Live on your page')).toBeInTheDocument();
    // One button, for the page that is not live.
    expect(screen.getAllByRole('button', { name: /set as active/i })).toHaveLength(1);
  });

  it('says an active draft is not shown, rather than calling it live', async () => {
    loadUserPages.mockResolvedValue([page({ isActive: true, published: false })]);
    renderList();

    expect(await screen.findByText(/your public page does not\s+show it/i)).toBeInTheDocument();
    expect(screen.queryByText('Live on your page')).not.toBeInTheDocument();
  });

  it('shows a load failure with a retry, not the "No pages yet" empty state', async () => {
    loadUserPages.mockRejectedValueOnce(new Error('network down'));
    renderList();

    expect(await screen.findByText('Your pages could not be loaded')).toBeInTheDocument();
    expect(screen.queryByText('No pages yet')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /create your first page/i })
    ).not.toBeInTheDocument();

    loadUserPages.mockResolvedValueOnce([page({ title: 'Spring page', isActive: true })]);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(await screen.findByText('Spring page')).toBeInTheDocument();
    expect(screen.queryByText('Your pages could not be loaded')).not.toBeInTheDocument();
  });

  it('still shows the empty state when there really are no pages', async () => {
    loadUserPages.mockResolvedValue([]);
    renderList();
    expect(await screen.findByText('No pages yet')).toBeInTheDocument();
  });
});
