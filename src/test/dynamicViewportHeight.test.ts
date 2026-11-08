/**
 * US-650: in iOS Safari's browser tab, `vh` is the *large* viewport, the
 * height with the address bar and toolbar hidden. With the toolbars showing
 * (every page load), a `max-h-[90vh]` dialog centred with translate(-50%) is
 * taller than what is on screen: on a 375x667 iPhone its top edge and the close
 * button sit under the address bar. `dvh` is the height actually visible.
 *
 * Every viewport-relative height cap is therefore written as a pair:
 *   max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh]
 * The plain `vh` class is the fallback for browsers without dynamic viewport
 * units (Safari < 15.4, Chrome < 108); the `@supports` one wins where `dvh`
 * exists. Both are needed: two plain `max-h-*` classes would be collapsed to
 * the last one by tailwind-merge inside `cn()`.
 *
 * DialogContent ships the pair. A dialog that wants a different cap must
 * override both halves, or the base `@supports` 90dvh still wins over it in
 * every modern browser.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createElement } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const SRC = resolve(__dirname, '..');
const DVH = 'supports-[height:100dvh]:';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [p] : [];
  });
}

const files = sourceFiles(SRC).map((p) => ({
  path: relative(SRC, p),
  source: readFileSync(p, 'utf8'),
}));

/** The class string(s) of each `<DialogContent` element, up to the end of its className. */
function dialogContentClasses(source: string): string[] {
  const out: string[] = [];
  const re = /<DialogContent\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const tagEnd = source.indexOf('>', m.index);
    const tag = source.slice(m.index, tagEnd === -1 ? undefined : tagEnd);
    const cls = /className=(?:"([^"]*)"|\{([\s\S]*?)\}\s*(?:\w+=|\/|$))/.exec(tag);
    if (cls) out.push(cls[1] ?? cls[2] ?? '');
  }
  return out;
}

describe('dynamic viewport height (US-650)', () => {
  it('DialogContent caps its height at 90vh with a 90dvh override where dvh is supported', () => {
    const dialog = readFileSync(join(SRC, 'components/ui/dialog.tsx'), 'utf8');
    expect(dialog).toContain('max-h-[90vh]');
    expect(dialog).toContain(`${DVH}max-h-[90dvh]`);
  });

  it('every max-h-[Nvh] in src has a matching supports-[height:100dvh]:max-h-[Ndvh]', () => {
    const offenders: string[] = [];
    for (const { path, source } of files) {
      const re = /(?<![\w:-])max-h-\[(\d+)vh\]/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(source))) {
        const partner = `${DVH}max-h-[${m[1]}dvh]`;
        const window = source.slice(m.index, m.index + 200);
        if (!window.includes(partner)) {
          const line = source.slice(0, m.index).split('\n').length;
          offenders.push(`${path}:${line} max-h-[${m[1]}vh] without ${partner}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('a DialogContent that sets its own max-h also overrides the @supports half', () => {
    const offenders: string[] = [];
    for (const { path, source } of files) {
      if (path.endsWith('components/ui/dialog.tsx')) continue;
      for (const cls of dialogContentClasses(source)) {
        const tokens = cls.split(/[\s'"`,]+/);
        const plain = tokens.some((t) => t.startsWith('max-h-'));
        const dvh = tokens.some((t) => t.startsWith(`${DVH}max-h-`));
        if (plain && !dvh) offenders.push(`${path}: "${cls.trim()}"`);
      }
    }
    expect(offenders).toEqual([]);
  });

  function renderDialog(className?: string): HTMLElement {
    render(
      createElement(
        Dialog,
        { open: true },
        createElement(
          DialogContent,
          { className },
          createElement(DialogTitle, null, 'Title'),
          createElement(DialogDescription, null, 'Body')
        )
      )
    );
    return document.querySelector('[role="dialog"]') as HTMLElement;
  }

  it('renders the vh fallback and the dvh override by default', () => {
    const el = renderDialog();
    expect(el.className).toContain('max-h-[90vh]');
    expect(el.className).toContain(`${DVH}max-h-[90dvh]`);
  });

  it('lets a dialog replace both halves of the cap', () => {
    const el = renderDialog(`max-h-[80vh] ${DVH}max-h-[80dvh]`);
    expect(el.className).toContain('max-h-[80vh]');
    expect(el.className).toContain(`${DVH}max-h-[80dvh]`);
    expect(el.className).not.toContain('90vh');
    expect(el.className).not.toContain('90dvh');
  });
});
