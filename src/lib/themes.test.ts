import { describe, it, expect, afterEach } from 'vitest';
import { applyTheme, contrastForegroundHSL, DEFAULT_THEMES } from './themes';

const WHITE = '0 0% 100%';
const INK = '222 47% 11%';

describe('contrastForegroundHSL (US-247)', () => {
  it('puts white on dark primaries and ink on light ones', () => {
    expect(contrastForegroundHSL('#2563eb')).toBe(WHITE);
    expect(contrastForegroundHSL('#000000')).toBe(WHITE);
    expect(contrastForegroundHSL('#1e40af')).toBe(WHITE);
    expect(contrastForegroundHSL('#ffffff')).toBe(INK);
    expect(contrastForegroundHSL('#fbbf24')).toBe(INK);
  });

  it('falls back to white for something that is not a six-digit hex', () => {
    expect(contrastForegroundHSL('rebeccapurple')).toBe(WHITE);
  });
});

describe('applyTheme (US-247)', () => {
  afterEach(() => document.documentElement.removeAttribute('style'));

  it('writes a foreground for the primary, which the public profile maps onto primary-foreground', () => {
    applyTheme({
      ...DEFAULT_THEMES[0],
      colors: { ...DEFAULT_THEMES[0].colors, primary: '#fde68a' },
    });
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--theme-primary')).not.toBe('');
    expect(style.getPropertyValue('--theme-primary-foreground')).toBe(INK);
  });
});
