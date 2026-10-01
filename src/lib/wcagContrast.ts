/**
 * WCAG 2.x contrast (US-234).
 *
 * Replaces themes.ts's getContrastingColor, which nothing called and which used
 * the NTSC luma formula on gamma-encoded channels — the wrong quantity. WCAG
 * contrast is defined on relative luminance: linearise each sRGB channel, weight
 * 0.2126/0.7152/0.0722, then (L1 + 0.05) / (L2 + 0.05).
 *
 * https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
 */

/** 1.4.3 normal text. */
export const AA_TEXT = 4.5;
/** 1.4.3 large text (18pt / 14pt bold) and 1.4.11 non-text UI components. */
export const AA_LARGE = 3;

type RGB = [number, number, number];

/** `#rgb` or `#rrggbb` (the `#` optional) → [r, g, b] 0-255, or null. */
export function parseHex(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

export function relativeLuminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) throw new Error(`Not a hex colour: ${hex}`);
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio, 1 to 21. Order does not matter. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Black or white, whichever reads better on `background`. One of the two always
 * reaches at least 4.58:1 against any colour, so text chosen this way passes AA
 * whatever the agent picks.
 */
export function readableTextOn(background: string): '#000000' | '#ffffff' {
  return contrastRatio(background, '#000000') >= contrastRatio(background, '#ffffff') ? '#000000' : '#ffffff';
}

/** For CSS variables consumed as `hsl(var(--x))`. */
export function readableTextOnHsl(background: string): '0 0% 0%' | '0 0% 100%' {
  return readableTextOn(background) === '#000000' ? '0 0% 0%' : '0 0% 100%';
}

/**
 * The colour nearest to `fg` (same hue, moved towards black or white) that
 * reaches `min` against `bg`. Returns `fg` when it already passes. Used by the
 * theme editor's "use nearest passing colour" action.
 */
export function nearestPassingColor(fg: string, bg: string, min = AA_TEXT): string {
  const rgb = parseHex(fg);
  if (!rgb) return fg;
  if (contrastRatio(fg, bg) >= min) return toHex(rgb);
  // Try both directions; take whichever needs the smaller step.
  const towards = (target: number) => {
    for (let t = 0.01; t <= 1.0001; t += 0.01) {
      const c = toHex(rgb.map((v) => v + (target - v) * t) as RGB);
      if (contrastRatio(c, bg) >= min) return { c, t };
    }
    return null;
  };
  const candidates = [towards(0), towards(255)].filter((x): x is { c: string; t: number } => x !== null);
  if (candidates.length === 0) return readableTextOn(bg);
  candidates.sort((a, b) => a.t - b.t);
  return candidates[0].c;
}

/** Rounded for display, e.g. "4.52:1". Truncates, so a shown 4.5 really passes. */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;
}
