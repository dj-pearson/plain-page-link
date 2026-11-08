/**
 * US-637: iOS Safari (and the installed iOS app) zoom the page in when a form
 * field whose font-size is under 16px takes focus, and stay zoomed after the
 * keyboard closes. src/index.css carries one rule that lifts every typed-into
 * field to at least 16px on touch screens. These checks keep it effective:
 * it must sit outside any @layer (Tailwind hoists layered rules above the
 * utilities, where `text-sm` would beat it), carry !important, and cover
 * textarea and select as well as input, without resizing checkboxes.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

/** The `@media (pointer: coarse)` block and the brace depth it opens at. */
function coarsePointerBlock(): { depth: number; body: string } | null {
  const start = css.indexOf('@media (pointer: coarse)');
  if (start === -1) return null;
  const before = css.slice(0, start).replace(/\/\*[\s\S]*?\*\//g, '');
  const depth = (before.match(/{/g) ?? []).length - (before.match(/}/g) ?? []).length;
  const open = css.indexOf('{', start);
  let level = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') level++;
    if (css[i] === '}') level--;
    if (level === 0) return { depth, body: css.slice(open + 1, i) };
  }
  return null;
}

describe('touch-screen form fields are at least 16px (no iOS focus zoom)', () => {
  const block = coarsePointerBlock();
  const selector = (block?.body ?? '').split('{')[0];

  it('has a coarse-pointer rule at the top level of index.css', () => {
    expect(block).not.toBeNull();
    expect(block?.depth).toBe(0);
  });

  it('sets 16px or more with !important, so text-sm cannot undercut it', () => {
    expect(block?.body).toMatch(/font-size:\s*max\(16px,\s*1em\)\s*!important/);
  });

  it('covers input, select and textarea', () => {
    expect(selector).toMatch(/(^|[\s,])input:not\(/);
    expect(selector).toMatch(/(^|[\s,])select\s*,/);
    expect(selector).toMatch(/(^|[\s,])textarea\s*$/);
  });

  it('leaves checkboxes, radios and buttons alone', () => {
    // Whitespace removed: a formatter may wrap the long :not() chain.
    const compact = selector.replace(/\s+/g, '');
    for (const type of ['checkbox', 'radio', 'range', 'file', 'submit', 'button', 'hidden']) {
      expect(compact).toContain(`:not([type='${type}'])`);
    }
  });
});
