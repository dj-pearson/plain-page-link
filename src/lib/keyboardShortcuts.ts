/**
 * When a dashboard keyboard shortcut may fire (US-252).
 *
 * The shortcut helper used to match `e.key` alone, so Cmd/Ctrl+S (save, by
 * habit) ran the "s" shortcut and marked every selected listing Sold, Ctrl+A
 * (select all) navigated to Analytics, and a letter typed into a Radix select,
 * a combobox or a contentEditable field ran whatever that letter was bound to.
 * These are the checks every shortcut event now passes first.
 */

/** Ancestors that take typing or arrow keys for themselves. */
const EDITABLE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="searchbox"]',
  '[role="spinbutton"]',
].join(',');

/** Any open modal surface: Radix Dialog/AlertDialog/Sheet, or a hand-rolled one. */
const DIALOG_SELECTOR = '[role="dialog"], [role="alertdialog"], [aria-modal="true"]';

export interface ShortcutKeyEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  target: EventTarget | null;
  defaultPrevented?: boolean;
  isComposing?: boolean;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false;
  const el = target as HTMLElement;
  if (el.isContentEditable) return true;
  return el.closest(EDITABLE_SELECTOR) !== null;
}

export function isDialogOpen(doc: Document = document): boolean {
  return doc.querySelector(DIALOG_SELECTOR) !== null;
}

/**
 * True when the event belongs to something else: a modified chord (the
 * browser's or the OS's), a field or widget that takes keys, an IME
 * composition, a handler that already claimed it, or an open dialog.
 */
export function shouldIgnoreShortcut(e: ShortcutKeyEvent, doc: Document = document): boolean {
  if (e.defaultPrevented || e.isComposing) return true;
  if (e.metaKey || e.ctrlKey || e.altKey) return true;
  if (isEditableTarget(e.target)) return true;
  return isDialogOpen(doc);
}

/** "?" is Shift+/ on most layouts, so Shift is allowed (and expected) for it. */
export function isHelpKey(e: Pick<ShortcutKeyEvent, 'key'>): boolean {
  return e.key === '?';
}

/** A shortcut bound to one printable character, as opposed to Escape and the like. */
export function isSingleCharacterKey(key: string): boolean {
  return key.length === 1;
}

/**
 * WCAG 2.1.4: single-character shortcuts must be possible to turn off. The
 * choice is a per-browser convenience, so it lives in localStorage, and every
 * access is guarded (private windows and blocked storage throw).
 */
export const SINGLE_KEY_SHORTCUTS_STORAGE_KEY = 'agentbio.shortcuts.singleKey';

export function readSingleKeyShortcutsEnabled(): boolean {
  try {
    return window.localStorage.getItem(SINGLE_KEY_SHORTCUTS_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function writeSingleKeyShortcutsEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      window.localStorage.removeItem(SINGLE_KEY_SHORTCUTS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(SINGLE_KEY_SHORTCUTS_STORAGE_KEY, 'off');
    }
  } catch {
    // Storage unavailable: the toggle still applies for this page view.
  }
}
