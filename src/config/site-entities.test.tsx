/**
 * AgentBio is one entity in the structured data, with one @id and one logo
 * (US-346, US-356).
 *
 * The BlogPosting publisher gave /Cover.png — the 1536x1024 social banner — as
 * its logo while the Organization node gave /logo.png, and PageSEO (deleted in
 * US-502 as unused) named the
 * Organization and WebSite `${origin}#organization` / `#website` where every
 * other component wrote `${origin}/#…`. JSON-LD compares ids as strings, so a
 * page could carry an Organization and a publisher reference that did not
 * resolve to it.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { HelmetProvider, type HelmetServerState } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy';
import { ArticleSEO } from '@/components/blog/ArticleSEO';
import { BlogListSEO } from '@/components/blog/BlogListSEO';
import VsLater from '@/pages/landing/VsLater';
import { generateEnhancedOrganizationSchema } from '@/lib/seo';
import { getBaseUrl } from './seo.config';
import { ORGANIZATION_LOGO } from './og-image';
import {
  organizationId,
  organizationLogo,
  publisherOrganization,
  websiteId,
} from './site-entities';

type Node = Record<string, unknown>;

function jsonLdOf(element: JSX.Element): Node[] {
  const context: { helmet?: HelmetServerState } = {};
  // Render as the prerender does: server mode fills `context` instead of
  // writing to a document jsdom provides.
  const previous = HelmetProvider.canUseDOM;
  HelmetProvider.canUseDOM = false;
  try {
    renderToStaticMarkup(<HelmetProvider context={context}>{element}</HelmetProvider>);
  } finally {
    HelmetProvider.canUseDOM = previous;
  }
  const html = context.helmet?.script.toString() ?? '';
  const bodies = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  // A combined block carries its nodes in @graph; flatten so each is visible.
  return bodies
    .map((body) => JSON.parse(body) as Node)
    .flatMap((block) => (Array.isArray(block['@graph']) ? (block['@graph'] as Node[]) : [block]));
}

const origin = getBaseUrl().replace(/\/+$/, '');

describe('site entity ids', () => {
  it('spell the Organization and WebSite one way', () => {
    expect(organizationId('https://agentbio.net')).toBe('https://agentbio.net/#organization');
    expect(organizationId('https://agentbio.net/')).toBe('https://agentbio.net/#organization');
    expect(websiteId('https://agentbio.net')).toBe('https://agentbio.net/#website');
  });

  it('give the logo at the size the file is', () => {
    expect(organizationLogo('https://agentbio.net')).toEqual({
      '@type': 'ImageObject',
      url: `https://agentbio.net${ORGANIZATION_LOGO.path}`,
      width: String(ORGANIZATION_LOGO.width),
      height: String(ORGANIZATION_LOGO.height),
    });
  });
});

describe('the article publisher', () => {
  const [article] = jsonLdOf(
    <ArticleSEO title="A title" description="A description" url="/blog/a-title" />
  ).filter((node) => node['@type'] === 'BlogPosting');
  const publisher = article.publisher as Node;
  const organization = generateEnhancedOrganizationSchema();

  it('is the Organization node, by id', () => {
    expect(publisher['@id']).toBe(organization['@id']);
    expect(publisher['@id']).toBe(`${origin}/#organization`);
  });

  it('carries the same logo as the Organization node, not the social banner', () => {
    expect(publisher.logo).toEqual(organization.logo);
    expect(JSON.stringify(publisher.logo)).not.toContain('Cover');
  });

  it('matches publisherOrganization()', () => {
    expect(publisher).toEqual(publisherOrganization(origin));
  });
});

describe('the blog index (US-502)', () => {
  const nodes = jsonLdOf(<BlogListSEO totalArticles={0} />);
  const byType = (type: string) => nodes.find((node) => node['@type'] === type) as Node;

  it('declares the Organization and WebSite under the shared ids', () => {
    // The WebSite was '@id': origin, and the Organization had no @id at all, so
    // /blog described a second AgentBio that matched no other page.
    expect(byType('Organization')['@id']).toBe(organizationId(origin));
    expect(byType('Organization')).toEqual(generateEnhancedOrganizationSchema());
    expect(byType('WebSite')['@id']).toBe(websiteId(origin));
  });

  it('names the Organization as the Blog publisher, with its logo rather than the banner', () => {
    const blog = byType('Blog');
    expect(blog.publisher).toEqual(publisherOrganization(origin));
    expect(blog.isPartOf).toEqual({ '@id': websiteId(origin) });
  });

  it('points every reference at a node id that exists on the page', () => {
    const declared = new Set(nodes.map((node) => node['@id']));
    expect(declared).toContain((byType('Blog').publisher as Node)['@id']);
    expect(declared).toContain((byType('Blog').isPartOf as Node)['@id']);
    expect(declared).toContain((byType('WebSite').publisher as Node)['@id']);
  });

  it('never gives the social banner as a logo', () => {
    const logos = nodes.flatMap((node) => [node.logo, (node.publisher as Node | undefined)?.logo]);
    expect(JSON.stringify(logos)).not.toContain('Cover');
  });
});

/** Every Organization object anywhere inside a JSON-LD value. */
function organizationsIn(value: unknown): Node[] {
  if (Array.isArray(value)) return value.flatMap(organizationsIn);
  if (!value || typeof value !== 'object') return [];
  const node = value as Node;
  const nested = Object.values(node).flatMap(organizationsIn);
  return node['@type'] === 'Organization' ? [node, ...nested] : nested;
}

describe('every AgentBio Organization on /vs/later (US-491)', () => {
  const nodes = jsonLdOf(
    <MemoryRouter>
      <VsLater />
    </MemoryRouter>
  );
  const organizations = organizationsIn(nodes).filter((org) => org.name === 'AgentBio');

  it('is the site Organization, by id', () => {
    // The WebPage publisher was an inline { '@type': 'Organization', name }.
    expect(organizations.length).toBeGreaterThan(1);
    for (const organization of organizations) {
      expect(organization['@id']).toBe(organizationId(origin));
    }
  });
});

describe('the source', () => {
  // A guard against the split coming back: `${origin}#organization` written
  // without the slash, in any file under src/.
  function files(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return files(path);
      return /\.(ts|tsx)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
    });
  }

  it('never names #organization or #website without the slash before it', () => {
    // site-entities.ts itself quotes the old spelling in its history note.
    const offenders = files(join(process.cwd(), 'src'))
      .filter((file) => !file.endsWith(join('config', 'site-entities.ts')))
      .filter((file) =>
        /(\}|\.net|\.com)#(organization|website)\b/.test(readFileSync(file, 'utf8'))
      );
    expect(offenders).toEqual([]);
  });

  it('builds every Organization/WebSite id through site-entities, never by hand (US-380)', () => {
    // A hand-written `${x}/#website` is right until the spelling or the origin
    // it is built from drifts. FullProfilePage built it from window.location,
    // so on a preview host its WebPage pointed at a WebSite no page declares.
    const offenders = files(join(process.cwd(), 'src'))
      .filter((file) => !file.endsWith(join('config', 'site-entities.ts')))
      .filter((file) => /\/#(organization|website)\b/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('never writes an anonymous AgentBio Organization (US-491, US-502)', () => {
    // { '@type': 'Organization', name: 'AgentBio' } with no @id is a second
    // AgentBio to a consumer. Pricing's offer seller, the /vs/later publisher
    // and the article author fallback were written this way; use
    // publisherOrganization() or a { '@id': organizationId() } reference.
    const anonymous =
      /\{\s*'@type': 'Organization',\s*name: (?:'AgentBio'|siteName),?\s*(?:url: \w+,?\s*)?\}/;
    const offenders = files(join(process.cwd(), 'src')).filter((file) =>
      anonymous.test(readFileSync(file, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });

  it('does not hard-code the production host in the legal pages or the blog category schema', () => {
    const targets = [
      ...files(join(process.cwd(), 'src', 'pages', 'legal')),
      join(process.cwd(), 'src', 'pages', 'BlogCategory.tsx'),
    ];
    // Contact addresses and prose are fine; a quoted URL is a canonical, an
    // @id or a schema url that ignores VITE_APP_URL.
    const offenders = targets.filter((file) =>
      /["'`]https:\/\/agentbio\.net[/"'`]/.test(readFileSync(file, 'utf8'))
    );
    expect(offenders).toEqual([]);
  });
});

describe('a legal page', () => {
  const [webPage] = jsonLdOf(
    <MemoryRouter>
      <PrivacyPolicy />
    </MemoryRouter>
  ).filter((node) => node['@type'] === 'WebPage');

  it('is part of the WebSite under the shared id', () => {
    expect((webPage.isPartOf as Node)['@id']).toBe(websiteId(origin));
  });

  it('names itself under the configured base URL', () => {
    expect(webPage.url).toBe(`${origin}/privacy`);
    expect(webPage['@id']).toBe(`${origin}/privacy#webpage`);
  });
});
