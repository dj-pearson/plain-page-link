/**
 * The colour pairs a theme must pass before it is saved (US-234).
 *
 * The theme editor used to accept any five colours. These are the same pairs
 * themes.contrast.test.ts holds the built-in presets to, so an agent's custom
 * theme is graded exactly as ours are.
 */
import { AA_LARGE, AA_TEXT, contrastRatio, nearestPassingColor, parseHex, readableTextOn } from './wcagContrast';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}

export interface ContrastCheck {
  id: string;
  label: string;
  /** The two colours as rendered, for a swatch. */
  fg: string;
  bg: string;
  ratio: number;
  min: number;
  pass: boolean;
  /** The colour the "use nearest passing colour" action changes, if any. */
  fix?: { key: keyof ThemeColors; value: string };
}

export function themeContrastChecks(c: ThemeColors): ContrastCheck[] {
  if (![c.primary, c.secondary, c.accent, c.background, c.foreground].every((x) => parseHex(x))) return [];
  const onPrimary = readableTextOn(c.primary);
  const checks: Omit<ContrastCheck, 'ratio' | 'pass'>[] = [
    {
      id: 'text',
      label: 'Text on background',
      fg: c.foreground,
      bg: c.background,
      min: AA_TEXT,
      fix: { key: 'foreground', value: nearestPassingColor(c.foreground, c.background, AA_TEXT) },
    },
    {
      id: 'primary-text',
      label: 'Primary as text (links, outline buttons)',
      fg: c.primary,
      bg: c.background,
      min: AA_TEXT,
      fix: { key: 'primary', value: nearestPassingColor(c.primary, c.background, AA_TEXT) },
    },
    {
      id: 'secondary-ui',
      label: 'Secondary button against the page',
      fg: c.secondary,
      bg: c.background,
      min: AA_LARGE,
      fix: { key: 'secondary', value: nearestPassingColor(c.secondary, c.background, AA_LARGE) },
    },
    {
      id: 'accent-ui',
      label: 'Accent button against the page',
      fg: c.accent,
      bg: c.background,
      min: AA_LARGE,
      fix: { key: 'accent', value: nearestPassingColor(c.accent, c.background, AA_LARGE) },
    },
    {
      id: 'gradient',
      label: 'Banner text across the primary → accent gradient',
      fg: onPrimary,
      bg: c.accent,
      min: AA_TEXT,
      fix: { key: 'accent', value: nearestPassingColor(c.accent, onPrimary, AA_TEXT) },
    },
    // Button labels are chosen black or white per fill, so they always pass;
    // shown so the agent can see why their label colour changed.
    { id: 'primary-button', label: 'Primary button label', fg: onPrimary, bg: c.primary, min: AA_TEXT },
    { id: 'secondary-button', label: 'Secondary button label', fg: readableTextOn(c.secondary), bg: c.secondary, min: AA_TEXT },
    { id: 'accent-button', label: 'Accent button label', fg: readableTextOn(c.accent), bg: c.accent, min: AA_TEXT },
  ];
  return checks.map((k) => {
    const ratio = contrastRatio(k.fg, k.bg);
    const pass = ratio >= k.min;
    return { ...k, ratio, pass, fix: pass ? undefined : k.fix };
  });
}

/** Apply every suggested fix until the theme passes (fixes can interact). */
export function fixAllContrast(c: ThemeColors): ThemeColors {
  let next = { ...c };
  for (let i = 0; i < 5; i++) {
    const failing = themeContrastChecks(next).filter((k) => !k.pass && k.fix);
    if (failing.length === 0) break;
    for (const k of failing) next = { ...next, [k.fix!.key]: k.fix!.value };
  }
  return next;
}
