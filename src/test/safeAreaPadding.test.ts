/**
 * US-596: the `safe-area-inset-*` helpers in src/index.css set padding on one
 * side to the bare `env(safe-area-inset-*)`. They are custom utilities, which
 * Tailwind emits after its core ones, so on an element that also sets padding
 * on that side (pb-24, py-2.5, p-4 ...) the helper wins and the padding is
 * replaced by the inset, which is 0px on Android and on iPhones without a notch
 * or home indicator.
 *
 * That is how the dashboard's `pb-24 safe-area-inset-bottom` left the last
 * 64px of every page under the fixed mobile nav. Add the inset inside the
 * padding instead: `pb-[calc(6rem+env(safe-area-inset-bottom))]`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..');

type Side = 'top' | 'bottom' | 'left' | 'right';

// Unprefixed padding utilities that set each side. A responsive or state
// variant (md:pb-6) is emitted inside a media query after the helper, so it
// does win, and is not a conflict.
const PADDING_FOR: Record<Side, RegExp> = {
  top: /^(?:p|py|pt)-/,
  bottom: /^(?:p|py|pb)-/,
  left: /^(?:p|px|pl|ps)-/,
  right: /^(?:p|px|pr|pe)-/,
};

/**
 * The class list of each JSX element: from `className=` to the next attribute
 * or the end of the tag. Every string literal inside counts, so a multi-line
 * cn(...) is read whole.
 */
function classLists(source: string): { line: number; tokens: string[] }[] {
  const out: { line: number; tokens: string[] }[] = [];
  const re = /className=/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const rest = source.slice(m.index + 'className='.length);
    const end = rest.search(/\n\s*(?:[A-Za-z-]+=|\/?>)/);
    const region = end === -1 ? rest : rest.slice(0, end);
    const tokens = [...region.matchAll(/(['"`])((?:(?!\1).)*)\1/g)].flatMap((s) =>
      s[2].split(/\s+/).filter(Boolean)
    );
    out.push({ line: source.slice(0, m.index).split('\n').length, tokens });
  }
  return out;
}

function findSafeAreaPaddingConflicts(source: string): string[] {
  const problems: string[] = [];
  for (const { line, tokens } of classLists(source)) {
    for (const side of ['top', 'bottom', 'left', 'right'] as Side[]) {
      if (!tokens.includes(`safe-area-inset-${side}`)) continue;
      const clash = tokens.find((t) => PADDING_FOR[side].test(t));
      if (clash) problems.push(`line ${line}: safe-area-inset-${side} overrides ${clash}`);
    }
  }
  return problems;
}

function sources(path: string): string[] {
  if (statSync(path).isDirectory()) {
    return readdirSync(path).flatMap((entry) => sources(join(path, entry)));
  }
  return path.endsWith('.tsx') && !/\.test\.tsx$/.test(path) ? [path] : [];
}

describe('safe-area padding helpers (US-596)', () => {
  it('flags the dashboard main as it was before the fix', () => {
    const before = `<main
          id="main-content"
          className="p-4 sm:p-5 md:p-6 pb-24 sm:pb-24 md:pb-6 safe-area-inset-bottom"
          tabIndex={-1}
        >`;
    expect(findSafeAreaPaddingConflicts(before)).toEqual([
      'line 3: safe-area-inset-bottom overrides p-4',
    ]);
  });

  it('flags a helper inside a multi-line cn() call', () => {
    const before = `<div
      className={cn(
        'fixed top-4 px-4 py-2.5 rounded-lg',
        'safe-area-inset-top',
        isOnline ? 'bg-green-500' : 'bg-red-500'
      )}
      style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
    >`;
    expect(findSafeAreaPaddingConflicts(before)).toEqual([
      'line 2: safe-area-inset-top overrides py-2.5',
    ]);
  });

  it('allows a helper with padding only on other sides or behind a variant', () => {
    expect(
      findSafeAreaPaddingConflicts(
        `<nav className="fixed bottom-0 px-1 md:pb-6 safe-area-inset-bottom">`
      )
    ).toEqual([]);
    expect(
      findSafeAreaPaddingConflicts(`<header className="sticky top-0 safe-area-inset-top">`)
    ).toEqual([]);
  });

  it('no element in src combines a safe-area helper with padding on the same side', () => {
    const problems = sources(SRC).flatMap((file) =>
      findSafeAreaPaddingConflicts(readFileSync(file, 'utf8')).map(
        (p) => `${relative(SRC, file)} ${p}`
      )
    );
    expect(problems).toEqual([]);
  });

  it('the dashboard clears the mobile nav and the home indicator', () => {
    const layout = readFileSync(join(SRC, 'components/layout/DashboardLayout.tsx'), 'utf8');
    expect(layout).toContain('pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6');
  });
});
