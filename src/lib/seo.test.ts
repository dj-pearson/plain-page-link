import { describe, it, expect } from 'vitest';
import type { PageConfig } from '@/types/pageBuilder';
import {
  generateCanonicalUrl,
  generateMetaTags,
  optimizeTitle,
  optimizeDescription,
  validateSEO,
} from './seo';

const makePage = (overrides: Partial<PageConfig> = {}): PageConfig => ({
  id: 'page-1',
  userId: 'user-1',
  slug: 'jane-doe',
  title: 'Jane Doe',
  description: 'Real estate agent',
  blocks: [],
  theme: {
    name: 'default',
    colors: {
      primary: '#000',
      secondary: '#111',
      background: '#fff',
      text: '#000',
      accent: '#f00',
    },
    fonts: { heading: 'sans', body: 'sans' },
    borderRadius: 'medium',
    spacing: 'normal',
  },
  seo: {
    title: 'Jane Doe — Top Real Estate Agent in Springfield',
    description:
      'Jane Doe is a top-producing real estate agent serving the Springfield metro area with over a decade of experience helping families.',
    keywords: ['real estate', 'springfield', 'agent'],
    ogImage: 'https://example.com/og.png',
    twitterCard: 'summary_large_image',
  },
  published: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  ...overrides,
});

describe('seo - generateCanonicalUrl', () => {
  it('builds a canonical URL from a slug', () => {
    const url = generateCanonicalUrl('jane-doe');
    expect(url).toMatch(/\/p\/jane-doe$/);
  });
});

describe('seo - optimizeTitle', () => {
  it('collapses whitespace and capitalizes', () => {
    expect(optimizeTitle('  hello   world  ')).toBe('Hello world');
  });

  it('truncates titles longer than 60 chars', () => {
    const long = 'a'.repeat(80);
    const result = optimizeTitle(long);
    expect(result.length).toBe(60);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('seo - optimizeDescription', () => {
  it('collapses whitespace', () => {
    expect(optimizeDescription('a   b\n c')).toBe('a b c');
  });

  it('truncates descriptions longer than 160 chars', () => {
    const result = optimizeDescription('x'.repeat(200));
    expect(result.length).toBe(160);
    expect(result.endsWith('...')).toBe(true);
  });
});

describe('seo - generateMetaTags', () => {
  it('generates title, description, canonical, OG and Twitter tags', () => {
    const tags = generateMetaTags(makePage());
    const joined = tags.join('\n');
    expect(joined).toContain('<title>');
    expect(joined).toContain('<meta name="description"');
    expect(joined).toContain('rel="canonical"');
    expect(joined).toContain('property="og:title"');
    expect(joined).toContain('name="twitter:card"');
    expect(joined).toContain('/p/jane-doe');
  });
});

describe('seo - validateSEO', () => {
  it('returns valid for a well-formed page', () => {
    const result = validateSEO(makePage());
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('warns when the title is missing', () => {
    const page = makePage();
    page.seo.title = '';
    const result = validateSEO(page);
    expect(result.valid).toBe(false);
    expect(result.warnings).toContain('SEO title is missing');
  });

  it('warns when the description is too long', () => {
    const page = makePage();
    page.seo.description = 'd'.repeat(200);
    const result = validateSEO(page);
    expect(result.warnings).toContain('SEO description is too long (> 160 chars)');
  });

  it('suggests keywords when too few are provided', () => {
    const page = makePage();
    page.seo.keywords = ['one'];
    const result = validateSEO(page);
    expect(result.suggestions).toContain('Add more keywords (at least 3)');
  });
});
