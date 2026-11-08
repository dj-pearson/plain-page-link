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
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { PageConfig } from '@/types/pageBuilder';

const { loadUserPages, setAsActivePage, deleteSelect, deleteEqs, toastSuccess, toastError } =
  vi.hoisted(() => ({
    loadUserPages: vi.fn(),
    setAsActivePage: vi.fn(),
    deleteSelect: vi.fn(),
    deleteEqs: [] as Array<[string, unknown]>,
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }));

vi.mock('@/stores/pageBuilderStore', () => ({
  usePageBuilderStore: () => ({ setPage: vi.fn(), loadUserPages, setAsActivePage }),
}));

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => ({ user: { id: 'agent-1' }, profile: { username: 'jane' } }),
}));

vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    eq: (col: string, val: unknown) => {
      deleteEqs.push([col, val]);
      return chain;
    },
    select: (cols: string) => deleteSelect(cols),
  };
  return {
    supabase: {
      from: (table: string) => {
        if (table !== 'custom_pages') throw new Error(`unexpected table ${table}`);
        return { delete: () => chain };
      },
    },
  };
});
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: toastSuccess, error: toastError } }));

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
  deleteSelect.mockReset();
  deleteEqs.length = 0;
  toastSuccess.mockReset();
  toastError.mockReset();
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

/**
 * US-642: delete used a native confirm() that said the same thing for every
 * page, so deleting the live page dropped its blocks off the public profile
 * without saying so.
 */
describe('PageList delete (US-642)', () => {
  const block = { id: 'b' } as PageConfig['blocks'][number];

  it('warns that deleting the live page removes its blocks from the public page', async () => {
    loadUserPages.mockResolvedValue([
      page({ id: 'live', title: 'Spring page', isActive: true, blocks: [block, block, block] }),
      page({ id: 'other', title: 'Winter page', isActive: false }),
    ]);
    deleteSelect.mockResolvedValue({ data: [{ id: 'live' }], error: null });
    renderList();

    await screen.findByText('Live on your page');
    fireEvent.click(screen.getAllByRole('button', { name: /^delete$/i })[0]);

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Delete your live page?')).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/what visitors see at .*\/jane/);
    expect(dialog).toHaveTextContent(/removes its 3 blocks from your public page/);
    // Points at the way to change pages without a gap.
    expect(dialog).toHaveTextContent(/set “Winter page” as active first/);

    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete live page' }));

    await waitFor(() => expect(deleteSelect).toHaveBeenCalledWith('id'));
    expect(deleteEqs).toEqual([
      ['id', 'live'],
      ['user_id', 'agent-1'],
    ]);
    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith(
        'Page deleted. Your public page no longer shows it.'
      )
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('does not delete when the agent keeps the live page', async () => {
    loadUserPages.mockResolvedValue([page({ id: 'live', isActive: true })]);
    renderList();

    await screen.findByText('Live on your page');
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Keep it live' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(deleteSelect).not.toHaveBeenCalled();
  });

  it('tells the agent a non-live page leaves the public page unchanged', async () => {
    loadUserPages.mockResolvedValue([page({ id: 'draft', title: 'Draft page', published: false })]);
    renderList();

    await screen.findByText('Draft page');
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Delete “Draft page”?')).toBeInTheDocument();
    expect(dialog).toHaveTextContent(/Your public page does not change/);
    expect(within(dialog).queryByText('Delete your live page?')).not.toBeInTheDocument();
  });

  it('reports a delete that removed no row as a failure, not a success', async () => {
    loadUserPages.mockResolvedValue([page({ id: 'p1', title: 'Spring page' })]);
    deleteSelect.mockResolvedValue({ data: [], error: null });
    renderList();

    await screen.findByText('Spring page');
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete page' }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Failed to delete page'));
    expect(toastSuccess).not.toHaveBeenCalled();
    // The dialog stays open so the agent can retry or cancel.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
