/**
 * US-671: leaving the page builder lost the last few seconds of edits.
 *
 * Autosave waits three seconds after the last edit. "Pages" called
 * setPage(null) at once, which cleared that timer along with the page, and
 * nothing warned on a reload or a dashboard link either.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/pageBuilder/PageList', () => ({
  PageList: () => <div>Page list</div>,
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { getUser: vi.fn() }, from: vi.fn() },
  supabaseConfig: { functionsUrl: 'https://functions.test' },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import PageBuilderEditor from './PageBuilder';
import { usePageBuilderStore } from '@/stores/pageBuilderStore';
import { createNewPage } from '@/lib/pageBuilder';
import { pageSnapshot } from '@/lib/pageSnapshot';

const realSavePage = usePageBuilderStore.getState().savePage;

function openSavedPage() {
  const page = { ...createNewPage('agent-1', 'spring-listings'), id: 'page-1' };
  usePageBuilderStore.getState().setPage(page, { saved: true });
}

/** A savePage that succeeds, recording the baseline as the real one does. */
const succeedingSave = () =>
  vi.fn(async () => {
    const { page } = usePageBuilderStore.getState();
    usePageBuilderStore.setState({ lastSavedSnapshot: pageSnapshot(page) });
  });

const backButton = () => screen.getByRole('button', { name: /^pages$/i });

describe('PageBuilder editor: unsaved edits (US-671)', () => {
  beforeEach(() => {
    usePageBuilderStore.getState().resetBuilder();
    usePageBuilderStore.setState({ savePage: realSavePage });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('says nothing is pending for a page just opened', () => {
    openSavedPage();
    render(<PageBuilderEditor />);
    expect(screen.queryByText('Unsaved changes')).toBeNull();
  });

  it('marks an edit as unsaved until it is written', () => {
    openSavedPage();
    render(<PageBuilderEditor />);
    fireEvent.change(screen.getByLabelText('Page title'), { target: { value: 'Open house' } });
    expect(screen.getByText('Unsaved changes')).toBeTruthy();
  });

  it('saves pending edits before going back to the page list', async () => {
    openSavedPage();
    const savePage = succeedingSave();
    usePageBuilderStore.setState({ savePage });
    render(<PageBuilderEditor />);

    fireEvent.change(screen.getByLabelText('Page title'), { target: { value: 'Open house' } });
    fireEvent.click(backButton());

    await waitFor(() => expect(usePageBuilderStore.getState().page).toBeNull());
    expect(savePage).toHaveBeenCalledTimes(1);
  });

  it('asks before discarding edits that could not be saved, and stays if told to', async () => {
    openSavedPage();
    usePageBuilderStore.setState({
      savePage: vi.fn().mockRejectedValue(new Error('network down')),
    });
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<PageBuilderEditor />);

    fireEvent.change(screen.getByLabelText('Page title'), { target: { value: 'Open house' } });
    fireEvent.click(backButton());

    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(usePageBuilderStore.getState().page?.title).toBe('Open house');
  });

  it('goes straight back when nothing is pending', async () => {
    openSavedPage();
    const savePage = vi.fn();
    usePageBuilderStore.setState({ savePage });
    render(<PageBuilderEditor />);

    fireEvent.click(backButton());

    await waitFor(() => expect(usePageBuilderStore.getState().page).toBeNull());
    expect(savePage).not.toHaveBeenCalled();
  });

  it('warns on reload or tab close while an edit is pending', () => {
    openSavedPage();
    render(<PageBuilderEditor />);
    fireEvent.change(screen.getByLabelText('Page title'), { target: { value: 'Open house' } });

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
