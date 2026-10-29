/**
 * US-245: --destructive is used as error text (text-destructive) and as a fill
 * under --destructive-foreground. Both pairs must clear WCAG AA (4.5:1) in the
 * light and the dark theme. The values are read from index.css itself, so a
 * later edit to the tokens is measured rather than trusted.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, 'index.css'), 'utf8');

function block(selector: ':root' | '.dark'): string {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`${selector} block not found in index.css`);
  return css.slice(start, css.indexOf('\n  }', start));
}

function token(selector: ':root' | '.dark', name: string): [number, number, number] {
  const match = block(selector).match(
    new RegExp(`--${name}:\\s*([\\d.]+)\\s+([\\d.]+)%\\s+([\\d.]+)%;`)
  );
  if (!match) throw new Error(`--${name} not found in ${selector}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
  const sat = s / 100;
  const light = l / 100;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

function luminance(hsl: [number, number, number]): number {
  const [r, g, b] = hslToRgb(hsl).map((v) =>
    v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('--destructive contrast (US-245)', () => {
  for (const theme of [':root', '.dark'] as const) {
    describe(theme === ':root' ? 'light theme' : 'dark theme', () => {
      const destructive = token(theme, 'destructive');

      it('is readable as text on --background', () => {
        expect(contrast(destructive, token(theme, 'background'))).toBeGreaterThanOrEqual(4.5);
      });

      it('is readable as text on --muted', () => {
        expect(contrast(destructive, token(theme, 'muted'))).toBeGreaterThanOrEqual(4.5);
      });

      it('keeps --destructive-foreground readable on a destructive fill', () => {
        expect(
          contrast(destructive, token(theme, 'destructive-foreground'))
        ).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  it('measures the pre-US-245 light red as failing, so the check can fail', () => {
    expect(contrast([0, 84.2, 60.2], [0, 0, 100])).toBeLessThan(4.5);
  });
});
