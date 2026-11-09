import { describe, it, expect } from 'vitest';
import {
  organizationSchema,
  realEstateAgentSchema,
  articleSchema,
  breadcrumbSchema,
} from './structured-data';

describe('structured-data helpers', () => {
  it('organizationSchema has required schema.org fields', () => {
    const s = organizationSchema('https://example.com');
    expect(s['@context']).toBe('https://schema.org');
    expect(s['@type']).toBe('Organization');
    expect(s.url).toBe('https://example.com');
    expect(s.name).toBeTruthy();
  });

  it('realEstateAgentSchema builds a profile URL and omits empty fields', () => {
    const s = realEstateAgentSchema({
      fullName: 'Jane Agent',
      username: 'jane',
      siteUrl: 'https://example.com',
    }) as Record<string, unknown>;
    expect(s['@type']).toBe('RealEstateAgent');
    expect(s.name).toBe('Jane Agent');
    expect(s.url).toBe('https://example.com/jane');
    // Optional fields not provided should be omitted (not null/undefined keys).
    expect('telephone' in s).toBe(false);
    expect('address' in s).toBe(false);
  });

  it('realEstateAgentSchema includes address + brokerage when provided', () => {
    const s = realEstateAgentSchema({
      fullName: 'Jane',
      username: 'jane',
      city: 'Miami',
      state: 'FL',
      brokerage: 'Acme Realty',
    }) as Record<string, Record<string, unknown>>;
    expect(s.address['@type']).toBe('PostalAddress');
    expect(s.address.addressLocality).toBe('Miami');
    expect(s.worksFor.name).toBe('Acme Realty');
  });

  it('articleSchema builds a blog URL and publisher', () => {
    const s = articleSchema({
      title: 'Hello',
      slug: 'hello',
      siteUrl: 'https://example.com',
    }) as Record<string, Record<string, unknown>>;
    expect(s['@type']).toBe('Article');
    expect(s.url).toBe('https://example.com/blog/hello');
    expect(s.publisher.name).toBe('AgentBio');
  });

  it('breadcrumbSchema numbers positions from 1', () => {
    const s = breadcrumbSchema([
      { name: 'Home', url: 'https://example.com' },
      { name: 'Blog', url: 'https://example.com/blog' },
    ]) as Record<string, Array<Record<string, unknown>>>;
    expect(s['@type']).toBe('BreadcrumbList');
    expect(s.itemListElement[0].position).toBe(1);
    expect(s.itemListElement[1].position).toBe(2);
    expect(s.itemListElement[1].name).toBe('Blog');
  });
});
