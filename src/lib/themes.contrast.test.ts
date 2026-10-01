/**
 * US-234: every built-in theme must be readable.
 *
 * Six presets failed. Luxe put white button text on #fbbf24 at 1.67:1, and
 * the default primary #3b82f6 gave 3.68:1. Labels on theme fills are now black
 * or white, chosen per colour (readableTextOn), and the preset colours were
 * moved to the nearest passing shade. This file iterates every preset in both
 * catalogues, so a new preset that fails cannot be added unnoticed.
 *
 * Pairs, and why each threshold:
 *   text on background        4.5  body copy (1.4.3)
 *   primary on background     4.5  primary is also used AS text: outline CTA,
 *                                   outline "Call Now", stat numbers
 *   secondary/accent on bg    3    fills and borders only (1.4.11)
 *   on-colour on each fill    4.5  button labels
 *   on-primary on accent      4.5  the gradient CTA/hero runs primary → accent
 *                                   under one label colour
 */
import { describe, it, expect } from 'vitest';
import { DEFAULT_THEMES, themePresets, generateThemeCSS } from './themes';
import { themeToCSSVariables } from './themeUtils';
import { contrastRatio, readableTextOn, AA_TEXT, AA_LARGE } from './wcagContrast';

interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

const palettes: [string, Palette][] = [
  ...DEFAULT_THEMES.map((t): [string, Palette] => [`DEFAULT_THEMES.${t.id}`, { ...t.colors, text: t.colors.foreground }]),
  ...Object.entries(themePresets).map(([id, t]): [string, Palette] => [`themePresets.${id}`, t.colors]),
];

describe.each(palettes)('%s', (_name, c) => {
  it('text on background ≥ 4.5', () => {
    expect(contrastRatio(c.text, c.background)).toBeGreaterThanOrEqual(AA_TEXT);
  });
  it('primary on background ≥ 4.5', () => {
    expect(contrastRatio(c.primary, c.background)).toBeGreaterThanOrEqual(AA_TEXT);
  });
  it('secondary and accent on background ≥ 3', () => {
    expect(contrastRatio(c.secondary, c.background)).toBeGreaterThanOrEqual(AA_LARGE);
    expect(contrastRatio(c.accent, c.background)).toBeGreaterThanOrEqual(AA_LARGE);
  });
  it('button labels on every fill ≥ 4.5, including across the gradient', () => {
    for (const fill of [c.primary, c.secondary, c.accent]) {
      expect(contrastRatio(readableTextOn(fill), fill)).toBeGreaterThanOrEqual(AA_TEXT);
    }
    expect(contrastRatio(readableTextOn(c.primary), c.accent)).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('on-colour variables', () => {
  it('page-builder variables carry a label colour per fill', () => {
    const vars = themeToCSSVariables(themePresets.modern);
    expect(vars['--theme-on-primary']).toBe('#ffffff');
    expect(generateThemeCSS(themePresets.dark)).toContain('--theme-on-primary: #000000');
  });
});
