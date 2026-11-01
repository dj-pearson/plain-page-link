/**
 * US-252: Cmd/Ctrl+S on the quick-actions page marked every selected listing
 * Sold, Ctrl+A on Listings navigated to Analytics, and "?" (Shift+/) never
 * opened the help because the handler required Shift to be up.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsHelper } from './KeyboardShortcutsHelper';
import { SINGLE_KEY_SHORTCUTS_STORAGE_KEY } from '@/lib/keyboardShortcuts';

function setup() {
  const markSold = vi.fn();
  const clear = vi.fn();
  render(
    <KeyboardShortcutsHelper
      shortcuts={[
        { key: 's', description: 'Mark selected as Sold', action: markSold, category: 'Status' },
        { key: 'Escape', description: 'Clear selection', action: clear, category: 'Selection' },
      ]}
    />
  );
  return { markSold, clear };
}

describe('KeyboardShortcutsHelper (US-252)', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    window.localStorage.clear();
    document.body.innerHTML = '';
  });

  it('runs a bare-key shortcut', () => {
    const { markSold } = setup();
    fireEvent.keyDown(document.body, { key: 's' });
    expect(markSold).toHaveBeenCalledTimes(1);
  });

  it('does not run on Cmd/Ctrl+S', () => {
    const { markSold } = setup();
    fireEvent.keyDown(document.body, { key: 's', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 's', metaKey: true });
    expect(markSold).not.toHaveBeenCalled();
  });

  it('opens help on Shift+/ and swallows other shortcuts while it is open', () => {
    const { markSold } = setup();
    fireEvent.keyDown(document.body, { key: '?', shiftKey: true });
    expect(screen.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeTruthy();
    fireEvent.keyDown(document.body, { key: 's' });
    expect(markSold).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not run while another dialog is open', () => {
    const { markSold } = setup();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.appendChild(dialog);
    fireEvent.keyDown(document.body, { key: 's' });
    expect(markSold).not.toHaveBeenCalled();
  });

  it('turning single-key shortcuts off stops letters but not Escape, and persists', () => {
    const { markSold, clear } = setup();
    fireEvent.click(screen.getByRole('button', { name: /shortcuts/i }));
    act(() => {
      fireEvent.click(screen.getByRole('switch', { name: /single-key shortcuts/i }));
    });
    expect(window.localStorage.getItem(SINGLE_KEY_SHORTCUTS_STORAGE_KEY)).toBe('off');
    fireEvent.keyDown(document.body, { key: 'Escape' }); // closes help
    fireEvent.keyDown(document.body, { key: 's' });
    expect(markSold).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(clear).toHaveBeenCalledTimes(1);
  });
});

/**
 * US-257: the shortcuts panel did not return focus to the button that opened
 * it, and its close button had no name.
 */
describe('KeyboardShortcutsHelper panel (US-257)', () => {
  it('opens as a named dialog, closes on Escape and returns focus', async () => {
    const user = userEvent.setup();
    render(
      <KeyboardShortcutsHelper
        shortcuts={[{ key: 'n', description: 'Add new listing', action: vi.fn() }]}
      />
    );

    const trigger = screen.getByRole('button', { name: 'Keyboard shortcuts' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Keyboard shortcuts' });
    expect(dialog).toHaveTextContent('Add new listing');
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
