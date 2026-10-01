import { describe, it, expect } from 'vitest';
import {
  contrastRatio,
  relativeLuminance,
  readableTextOn,
  nearestPassingColor,
  parseHex,
  formatRatio,
  AA_TEXT,
} from './wcagContrast';

describe('relativeLuminance / contrastRatio', () => {
  it('matches the WCAG endpoints', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 10);
  });

  // Reference values from the WebAIM contrast checker.
  it.each([
    ['#ffffff', '#3b82f6', 3.68],
    ['#ffffff', '#2563eb', 5.17],
    ['#ffffff', '#767676', 4.54],
    ['#fbbf24', '#ffffff', 1.67],
    ['#ffffff', '#667eea', 3.66],
  ])('%s on %s ≈ %s', (a, b, expected) => {
    expect(contrastRatio(a, b)).toBeCloseTo(expected, 2);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#123456', '#abcdef')).toBe(contrastRatio('#abcdef', '#123456'));
  });
});

describe('readableTextOn', () => {
  it('chooses black on light and saturated-light colours, white on dark', () => {
    expect(readableTextOn('#fbbf24')).toBe('#000000');
    expect(readableTextOn('#3b82f6')).toBe('#000000'); // white is 3.68 here
    expect(readableTextOn('#1e40af')).toBe('#ffffff');
  });

  it('always reaches AA, whatever the colour', () => {
    for (let r = 0; r < 256; r += 17)
      for (let g = 0; g < 256; g += 17)
        for (let b = 0; b < 256; b += 17) {
          const bg = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
          expect(contrastRatio(bg, readableTextOn(bg))).toBeGreaterThanOrEqual(AA_TEXT);
        }
  });
});

describe('nearestPassingColor', () => {
  it('returns a passing colour close to the original', () => {
    const fixed = nearestPassingColor('#3b82f6', '#ffffff');
    expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(AA_TEXT);
    expect(fixed).not.toBe('#000000');
  });

  it('leaves a passing colour alone', () => {
    expect(nearestPassingColor('#1e40af', '#ffffff')).toBe('#1e40af');
  });

  it('lightens on a dark background', () => {
    const fixed = nearestPassingColor('#7c3aed', '#1e1b4b');
    expect(contrastRatio(fixed, '#1e1b4b')).toBeGreaterThanOrEqual(AA_TEXT);
    expect(relativeLuminance(fixed)).toBeGreaterThan(relativeLuminance('#7c3aed'));
  });
});

describe('parseHex / formatRatio', () => {
  it('parses short and long forms, rejects others', () => {
    expect(parseHex('#fff')).toEqual([255, 255, 255]);
    expect(parseHex('2563eb')).toEqual([37, 99, 235]);
    expect(parseHex('hsl(0 0% 0%)')).toBeNull();
  });

  it('truncates so a displayed pass is a real pass', () => {
    expect(formatRatio(4.499)).toBe('4.49:1');
  });
});
