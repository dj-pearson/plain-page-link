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

/**
 * US-261: a form field's border is the only thing marking where it is
 * (WCAG 1.4.11, 3:1 against the surface), and placeholder text is text
 * (1.4.3, 4.5:1). The base Input and SelectTrigger used Tailwind gray-300
 * borders (1.47:1 on white) and gray-400 placeholders (2.54:1), bypassing
 * the tokens entirely; --input itself was 91.4% lightness (1.26:1).
 */
describe('form field contrast (US-261)', () => {
  for (const theme of [':root', '.dark'] as const) {
    describe(theme === ':root' ? 'light theme' : 'dark theme', () => {
      it('--input border is distinguishable from --background (3:1)', () => {
        expect(contrast(token(theme, 'input'), token(theme, 'background'))).toBeGreaterThanOrEqual(
          3
        );
      });

      it('--input border is distinguishable from --muted (3:1)', () => {
        expect(contrast(token(theme, 'input'), token(theme, 'muted'))).toBeGreaterThanOrEqual(3);
      });

      it('placeholder colour (--muted-foreground) is readable on --background (4.5:1)', () => {
        expect(
          contrast(token(theme, 'muted-foreground'), token(theme, 'background'))
        ).toBeGreaterThanOrEqual(4.5);
      });
    });
  }

  for (const file of ['input.tsx', 'select.tsx', 'textarea.tsx']) {
    it(`components/ui/${file} draws its border and placeholder from the tokens`, () => {
      const whole = readFileSync(resolve(__dirname, 'components/ui', file), 'utf8');
      // select.tsx also holds the dropdown panel; only the trigger is a field.
      const source = whole.split('const SelectScrollUpButton')[0];
      expect(source).toContain('border-input');
      expect(source).toContain('placeholder:text-muted-foreground');
      expect(source).not.toMatch(/border-gray-[1-3]00|placeholder:text-gray-[1-4]00/);
    });
  }

  it('measures the pre-US-261 --input as failing, so the check can fail', () => {
    expect(contrast([214.3, 31.8, 91.4], [0, 0, 100])).toBeLessThan(3);
  });
});

/**
 * US-351: the caution callout (ApiKeysPage's "copy this key now") was
 * hard-coded amber-50/800 with no dark variant, so on the dark dashboard it
 * was a glaring light patch. Its text must stay readable on its surface in
 * both themes, and the surface must sit close to the page background.
 */
describe('--warning callout contrast (US-351)', () => {
  for (const theme of [':root', '.dark'] as const) {
    describe(theme === ':root' ? 'light theme' : 'dark theme', () => {
      it('--warning-foreground is readable on --warning (4.5:1)', () => {
        expect(
          contrast(token(theme, 'warning-foreground'), token(theme, 'warning'))
        ).toBeGreaterThanOrEqual(4.5);
      });

      it('--warning surface stays close to --background (no glaring patch)', () => {
        expect(contrast(token(theme, 'warning'), token(theme, 'background'))).toBeLessThan(1.5);
      });
    });
  }

  it('measures the old amber-50 surface as glaring on the dark background', () => {
    expect(contrast([48, 100, 96], token('.dark', 'background'))).toBeGreaterThan(1.5);
  });
});
