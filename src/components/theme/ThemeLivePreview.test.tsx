/**
 * US-533 (US-524): the Theme page's Live Preview renders the agent's custom
 * CSS, sanitised, against a sample of the public page — and nowhere else.
 */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { sanitizeCustomCss } from '@/lib/customCss';
import { DEFAULT_THEMES } from '@/lib/themes';
import { ThemeLivePreview } from './ThemeLivePreview';

const theme = DEFAULT_THEMES[0];

function renderPreview(typed: string, mode: 'desktop' | 'mobile' = 'desktop') {
  return render(
    <div>
      <h1 data-testid="dashboard-heading">Theme</h1>
      <ThemeLivePreview
        colors={theme.colors}
        fonts={theme.fonts}
        mode={mode}
        customCss={sanitizeCustomCss(typed).css}
      />
    </div>
  );
}

const preview = () => screen.getByTestId('theme-live-preview');
const previewHeading = () => preview().querySelector('h1') as HTMLElement;

describe('ThemeLivePreview', () => {
  it('applies the sanitised CSS to the sample page', () => {
    renderPreview('h1 { color: rgb(255, 0, 0); }');
    expect(getComputedStyle(previewHeading()).color).toBe('rgb(255, 0, 0)');
  });

  it('cannot restyle the dashboard around it', () => {
    renderPreview('h1 { color: rgb(255, 0, 0); } body { background: rgb(0, 0, 255); }');
    expect(getComputedStyle(screen.getByTestId('dashboard-heading')).color).not.toBe(
      'rgb(255, 0, 0)'
    );
    expect(getComputedStyle(document.body).backgroundColor).not.toBe('rgb(0, 0, 255)');
    // Every rule rendered is prefixed with the scope class.
    const css = preview().querySelector('style')?.textContent ?? '';
    const rules = css.split('\n').filter(Boolean);
    expect(rules.length).toBe(2);
    for (const rule of rules) expect(rule.startsWith('.ab-custom-css')).toBe(true);
  });

  it('puts the agent CSS inside the same paint-contained boundary as the public page', () => {
    renderPreview('a { color: red; }');
    const boundary = preview().querySelector('[data-custom-css-boundary]') as HTMLElement;
    expect(boundary).not.toBeNull();
    expect(boundary.style.contain).toBe('paint');
  });

  it('never renders what the sanitiser removed', () => {
    renderPreview('@import url(https://x.test/a.css); a { background: url(https://x.test/p.gif) }');
    expect(preview().querySelector('style')).toBeNull();
  });

  it('carries theme colours as custom properties, so inline styles cannot beat the agent CSS', () => {
    renderPreview('');
    expect(previewHeading().getAttribute('style')).toBeNull();
    expect(preview().style.getPropertyValue('--preview-primary')).toBe(theme.colors.primary);
  });

  it('is hidden from assistive technology and keeps its sample buttons out of the tab order', () => {
    renderPreview('', 'mobile');
    const sample = preview().firstElementChild as HTMLElement;
    expect(sample).toHaveAttribute('aria-hidden', 'true');
    const buttons = sample.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((button) => expect(button).toHaveAttribute('tabindex', '-1'));
  });
});
