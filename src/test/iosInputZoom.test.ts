/**
 * US-637: iOS Safari (and the installed iOS app) zoom the page in when a form
 * field whose font-size is under 16px takes focus, and stay zoomed after the
 * keyboard closes. src/index.css carries two coarse-pointer rules:
 *
 * - an !important rule, outside any @layer, that sets fields carrying a small
 *   size utility (text-sm, text-xs, sm:text-sm, ...) to 16px. It must sit
 *   outside @layer (Tailwind hoists layered rules above the utilities, where
 *   `text-sm` would beat it) and must name only small utilities: a blanket
 *   `max(16px, 1em) !important` shrank text-lg kiosk fields and text-2xl OTP
 *   digits to 16px, because in font-size 1em is the parent's size.
 * - a default for fields with no size class, in @layer base, without
 *   !important and at element specificity, so any size utility still wins.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');

interface Block {
  depth: number;
  body: string;
  /** Enclosing at-rule preludes, outermost first. */
  parents: string[];
}

/** Every `@media (pointer: coarse)` block, with its nesting. */
function coarsePointerBlocks(): Block[] {
  const blocks: Block[] = [];
  const stack: string[] = [];
  let preludeStart = 0;
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === '{') {
      const prelude = stripped.slice(preludeStart, i).trim();
      if (prelude.startsWith('@media (pointer: coarse)')) {
        let level = 0;
        for (let j = i; j < stripped.length; j++) {
          if (stripped[j] === '{') level++;
          if (stripped[j] === '}') level--;
          if (level === 0) {
            blocks.push({
              depth: stack.length,
              body: stripped.slice(i + 1, j),
              parents: [...stack],
            });
            break;
          }
        }
      }
      stack.push(prelude);
      preludeStart = i + 1;
    } else if (ch === '}') {
      stack.pop();
      preludeStart = i + 1;
    } else if (ch === ';') {
      preludeStart = i + 1;
    }
  }
  return blocks;
}

const blocks = coarsePointerBlocks();
const importantBlock = blocks.find((b) => /!important/.test(b.body));
const defaultBlock = blocks.find((b) => !/!important/.test(b.body) && /font-size/.test(b.body));
const importantSelector = (importantBlock?.body ?? '').split('{')[0];
const defaultSelector = (defaultBlock?.body ?? '').split('{')[0];

/** Class names (unescaped) the !important rule requires one of. */
function forcedClasses(): string[] {
  const lists = [...importantSelector.matchAll(/:is\(([^()]*)\)/g)].map((m) => m[1]);
  const classList = lists.find((l) => l.includes('.text-')) ?? '';
  return classList
    .split(',')
    .map((s) => s.trim().replace(/^\./, '').replace(/\\/g, ''))
    .filter(Boolean);
}

/** Would the !important rule reach a field with this class attribute? */
function forcedFor(classAttr: string): boolean {
  const forced = forcedClasses();
  return classAttr.split(/\s+/).some((c) => forced.includes(c));
}

describe('touch-screen form fields are at least 16px (no iOS focus zoom)', () => {
  it('has a top-level !important rule for small fields', () => {
    expect(importantBlock).toBeDefined();
    expect(importantBlock?.depth).toBe(0);
    expect(importantBlock?.body).toMatch(/font-size:\s*16px\s*!important/);
  });

  it('no longer floors every field with max(16px, 1em) !important', () => {
    expect(css).not.toMatch(/max\(16px,\s*1em\)\s*!important/);
  });

  it('reaches fields given a small size utility', () => {
    for (const cls of ['text-sm', 'text-xs', 'text-base sm:text-sm', 'md:text-sm', 'text-[11px]']) {
      expect(forcedFor(cls), cls).toBe(true);
    }
  });

  it('does not reach or reduce text-lg and larger fields (kiosk, OTP digits)', () => {
    const forced = forcedClasses();
    expect(forced.length).toBeGreaterThan(0);
    for (const c of forced) expect(c).toMatch(/(^|:)text-(xs|sm|\[1[01]px\])$/);
    // OpenHouseSignIn inputClass and the OTPInput digit boxes.
    for (const cls of [
      'block w-full min-h-[52px] rounded-xl px-4 text-lg',
      'w-12 h-14 text-center text-2xl font-semibold sm:w-14 sm:h-16 sm:text-3xl',
      'text-base',
    ]) {
      expect(forcedFor(cls), cls).toBe(false);
    }
  });

  it('covers input, select and textarea, leaving checkboxes, radios and buttons alone', () => {
    for (const sel of [importantSelector, defaultSelector]) {
      expect(sel).toMatch(/(^|[\s,(])input[:\s]/);
      expect(sel).toMatch(/(^|[\s,])select\s*,/);
      expect(sel).toMatch(/(^|[\s,])textarea\s*($|\))/);
      const compact = sel.replace(/\s+/g, '');
      for (const type of ['checkbox', 'radio', 'range', 'file', 'submit', 'button', 'hidden']) {
        expect(compact).toContain(`:not([type='${type}'])`);
      }
    }
  });

  it('gives class-less fields a 16px default that size utilities still beat', () => {
    expect(defaultBlock).toBeDefined();
    expect(defaultBlock?.parents).toContain('@layer base');
    expect(defaultBlock?.body).toMatch(/font-size:\s*max\(16px,\s*1em\)\s*;/);
    // Element specificity only: the :not() chain sits inside :where(), so a
    // single-class utility such as text-lg outranks it.
    expect(defaultSelector.replace(/\s+/g, '')).toMatch(/^input:where\(/);
    expect(defaultSelector).not.toMatch(/\./);
  });
});
