/**
 * US-192: `bg-clip-text text-transparent` is not a style choice here, it is a
 * defect with two heads.
 *
 * The first is visible. Landing.tsx wrapped every feature-card icon in it.
 * background-clip: text paints a background through the shape of an element's
 * TEXT; a lucide icon is an inline SVG stroked with currentColor, and it is not
 * text — so the gradient never reached it, `text-transparent` made currentColor
 * transparent, and all nine icons on the marketing page rendered invisible.
 *
 * The second is not visible unless you are the person it affects. A heading
 * painted this way has `color: transparent` and a background image. Under
 * `forced-colors: active` — Windows High Contrast, the setting people with low
 * vision actually use — the forced palette applies to `color`, which is
 * transparent, and the background image is dropped. The heading disappears.
 * That was the h1 of Login, Register, Pricing, every /for/<city> landing page,
 * the hero and the listing-description tool: the platform's highest-traffic
 * public pages. Two of them also faded the second half of the heading to 60-70%
 * opacity, below the contrast the rest of the page holds itself to.
 *
 * Emphasis comes from weight, size and a solid accent. This is a source-level
 * guard because the failure has no runtime signal in jsdom: nothing throws, no
 * query fails, the DOM is identical. Only a browser with the setting on shows it.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

/**
 * Comments are prose, not styling. Without this the guard trips on the note
 * left where the last offender was removed — and the fix would be to delete the
 * explanation, which is the wrong thing to reward.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

describe('text is painted, not clipped', () => {
  it('has no element whose colour is a clipped background', () => {
    const offenders = sourceFiles(SRC)
      .filter((file) => {
        const source = withoutComments(readFileSync(file, 'utf8'));
        return /bg-clip-text|background-clip:\s*text/.test(source);
      })
      .map((file) => file.slice(SRC.length + 1));

    expect(
      offenders,
      'bg-clip-text sets color:transparent — it hides the element under forced-colors, and it never paints an inline SVG at all'
    ).toEqual([]);
  });
});
