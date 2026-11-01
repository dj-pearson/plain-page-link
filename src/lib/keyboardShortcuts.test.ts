import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isEditableTarget,
  readSingleKeyShortcutsEnabled,
  shouldIgnoreShortcut,
  writeSingleKeyShortcutsEnabled,
  SINGLE_KEY_SHORTCUTS_STORAGE_KEY,
  type ShortcutKeyEvent,
} from './keyboardShortcuts';

const ev = (over: Partial<ShortcutKeyEvent> = {}): ShortcutKeyEvent => ({
  key: 's',
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  target: document.body,
  ...over,
});

describe('shouldIgnoreShortcut (US-252)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('lets a bare key on the page through', () => {
    expect(shouldIgnoreShortcut(ev())).toBe(false);
  });

  it('ignores Cmd/Ctrl/Alt chords (Ctrl+S must not mark listings Sold)', () => {
    expect(shouldIgnoreShortcut(ev({ ctrlKey: true }))).toBe(true);
    expect(shouldIgnoreShortcut(ev({ metaKey: true }))).toBe(true);
    expect(shouldIgnoreShortcut(ev({ altKey: true }))).toBe(true);
  });

  it('ignores typing in fields, selects, comboboxes and contentEditable', () => {
    document.body.innerHTML = `
      <input id="i" /><textarea id="t"></textarea><select id="s"></select>
      <button id="c" role="combobox"></button>
      <div contenteditable="true"><span id="ce">x</span></div>
      <div role="listbox"><div id="o" role="option"></div></div>
      <button id="plain"></button>`;
    for (const id of ['i', 't', 's', 'c', 'ce', 'o']) {
      const target = document.getElementById(id);
      expect(isEditableTarget(target), id).toBe(true);
      expect(shouldIgnoreShortcut(ev({ target })), id).toBe(true);
    }
    expect(shouldIgnoreShortcut(ev({ target: document.getElementById('plain') }))).toBe(false);
  });

  it('ignores every key while a dialog is open', () => {
    document.body.innerHTML = '<div role="dialog" data-state="open"></div>';
    expect(shouldIgnoreShortcut(ev())).toBe(true);
    document.body.innerHTML = '<div role="alertdialog"></div>';
    expect(shouldIgnoreShortcut(ev())).toBe(true);
  });

  it('ignores an event already handled or mid-IME composition', () => {
    expect(shouldIgnoreShortcut(ev({ defaultPrevented: true }))).toBe(true);
    expect(shouldIgnoreShortcut(ev({ isComposing: true }))).toBe(true);
  });
});

describe('single-key shortcut preference', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('defaults on and round-trips through localStorage', () => {
    expect(readSingleKeyShortcutsEnabled()).toBe(true);
    writeSingleKeyShortcutsEnabled(false);
    expect(window.localStorage.getItem(SINGLE_KEY_SHORTCUTS_STORAGE_KEY)).toBe('off');
    expect(readSingleKeyShortcutsEnabled()).toBe(false);
    writeSingleKeyShortcutsEnabled(true);
    expect(readSingleKeyShortcutsEnabled()).toBe(true);
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readSingleKeyShortcutsEnabled()).toBe(true);
    expect(() => writeSingleKeyShortcutsEnabled(false)).not.toThrow();
  });
});
