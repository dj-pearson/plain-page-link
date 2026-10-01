import { describe, it, expect } from 'vitest';
import { themeContrastChecks, fixAllContrast } from './themeContrast';
import { DEFAULT_THEMES } from './themes';

const base = { primary: '#2563eb', secondary: '#059669', accent: '#b45309', background: '#ffffff', foreground: '#1f2937' };

describe('themeContrastChecks', () => {
  it('every built-in theme passes every check', () => {
    for (const t of DEFAULT_THEMES) {
      expect(themeContrastChecks(t.colors).filter((k) => !k.pass)).toEqual([]);
    }
  });

  it('flags light grey text and offers a passing replacement', () => {
    const checks = themeContrastChecks({ ...base, foreground: '#bbbbbb' });
    const text = checks.find((k) => k.id === 'text')!;
    expect(text.pass).toBe(false);
    expect(text.fix?.key).toBe('foreground');
    const fixed = themeContrastChecks({ ...base, foreground: text.fix!.value }).find((k) => k.id === 'text')!;
    expect(fixed.pass).toBe(true);
  });

  it('button labels always pass, whatever the fill', () => {
    const checks = themeContrastChecks({ ...base, primary: '#fbbf24', secondary: '#777777', accent: '#00ff00' });
    for (const id of ['primary-button', 'secondary-button', 'accent-button']) {
      expect(checks.find((k) => k.id === id)!.pass).toBe(true);
    }
  });

  it('returns nothing for an incomplete colour (mid-typing)', () => {
    expect(themeContrastChecks({ ...base, primary: '#12' })).toEqual([]);
  });
});

describe('fixAllContrast', () => {
  it('turns a failing theme into a passing one', () => {
    const bad = { primary: '#fbbf24', secondary: '#fde68a', accent: '#fef3c7', background: '#ffffff', foreground: '#d1d5db' };
    const fixed = fixAllContrast(bad);
    expect(themeContrastChecks(fixed).filter((k) => !k.pass)).toEqual([]);
  });

  it('works on a dark background', () => {
    const bad = { primary: '#4c1d95', secondary: '#312e81', accent: '#1e1b4b', background: '#0f172a', foreground: '#475569' };
    expect(themeContrastChecks(fixAllContrast(bad)).filter((k) => !k.pass)).toEqual([]);
  });
});
