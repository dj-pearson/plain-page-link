/**
 * One theme colour for the browser chrome (US-486).
 *
 * The dashboard manifest said #2563eb while index.html's theme-color meta and
 * SEOHead said #0ea5e9, so an installed PWA's title bar was one colour from the
 * manifest, another from the first HTML byte, and the page's own Helmet tag
 * could disagree with both. Four places name the colour; this keeps them equal.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SEO_CONFIG } from './seo.config';
import { buildProfileManifest } from '../../functions/_lib/profile-manifest';

const ROOT = process.cwd();

function themeColorMetas(html: string): string[] {
  return [...html.matchAll(/<meta\s+name="theme-color"\s+content="([^"]+)"/g)].map((m) => m[1]);
}

describe('theme colour', () => {
  const brand = SEO_CONFIG.themeColor;

  it('is a hex colour', () => {
    expect(brand).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('index.html declares exactly one theme-color meta, equal to SEO_CONFIG.themeColor', () => {
    const metas = themeColorMetas(readFileSync(join(ROOT, 'index.html'), 'utf8'));
    expect(metas).toEqual([brand]);
  });

  it('the dashboard manifest uses the same colour', () => {
    const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'manifest.json'), 'utf8')) as {
      theme_color?: string;
    };
    expect(manifest.theme_color).toBe(brand);
  });

  it("an agent's page manifest uses the same colour", () => {
    const manifest = buildProfileManifest({
      username: 'jane',
      full_name: 'Jane Doe',
      avatar_url: null,
    });
    expect(manifest.theme_color).toBe(brand);
  });

  it('SEOHead reads the colour from SEO_CONFIG instead of hardcoding one', () => {
    const source = readFileSync(join(ROOT, 'src', 'components', 'SEOHead.tsx'), 'utf8');
    expect(source).toContain('name="theme-color" content={SEO_CONFIG.themeColor}');
    expect(source).not.toMatch(/name="theme-color"\s+content="#/);
  });
});
