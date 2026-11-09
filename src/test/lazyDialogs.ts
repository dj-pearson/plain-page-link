/**
 * Helpers for the load-on-open dialog tests (US-412, US-431).
 */
import { readFileSync } from 'node:fs';
import { expect, vi } from 'vitest';
import type { UserEvent } from '@testing-library/user-event';

/** The form stack a dialog-hosting page must not pull onto its route. */
export const FORM_STACK = ['react-hook-form', 'zod', '@hookform/resolvers/zod'];

/**
 * Fails if `file` value-imports any of `modules`. `import type` is erased at
 * build time and stays allowed; a value import puts the module on the route.
 */
export function expectNoValueImports(file: string, modules: readonly string[]): void {
  const src = readFileSync(file, 'utf8');
  for (const mod of modules) {
    const escaped = mod.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    expect(src, mod).not.toMatch(new RegExp(`import\\s+(?!type\\b)[^;]*from\\s+'${escaped}'`));
  }
}

/**
 * Click a button whose hover or focus warms a lazy dialog's chunk.
 *
 * user.click focuses the button (the onFocus warm-up import) and clicks it (the
 * lazy import) in one go. Vitest resolves two concurrent dynamic imports of a
 * vi.mock'ed module from a source file inconsistently: one of them can receive
 * the real module. Browsers share one in-flight import, so this is a
 * test-runner artefact. Hover and focus first and let the warm-up settle, as it
 * normally has by the time a finger lands, so the click only reads the cache.
 */
export async function clickWarmed(user: UserEvent, element: HTMLElement): Promise<void> {
  await user.hover(element);
  element.focus();
  await vi.dynamicImportSettled();
  await user.click(element);
}
