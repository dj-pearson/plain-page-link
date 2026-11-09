/**
 * US-607: the production *.pages.dev alias (and any host other than the
 * configured origin) answers noindex; agentbio.net is untouched.
 */
import { describe, it, expect, vi } from 'vitest';
import { isNonCanonicalHost, markNonCanonicalHost, withNoindex } from '../_lib/canonical-host';
import { onRequest } from '../_middleware';

const PROD = {};
const STAGING = { VITE_APP_URL: 'https://staging.example.test' };

describe('isNonCanonicalHost', () => {
  it('leaves the configured origin and production alone', () => {
    expect(isNonCanonicalHost('https://agentbio.net/jane', PROD)).toBe(false);
    expect(isNonCanonicalHost('https://AGENTBIO.NET/', undefined)).toBe(false);
    expect(isNonCanonicalHost('https://staging.example.test/jane', STAGING)).toBe(false);
  });

  it('marks the pages.dev alias, previews and other hosts', () => {
    expect(isNonCanonicalHost('https://agentbio.pages.dev/jane', PROD)).toBe(true);
    expect(isNonCanonicalHost('https://3f2a1b.agentbio.pages.dev/', PROD)).toBe(true);
    expect(isNonCanonicalHost('https://www.agentbio.net/', PROD)).toBe(true);
    expect(isNonCanonicalHost('https://agentbio.pages.dev/', STAGING)).toBe(true);
  });

  it('never marks production, even when VITE_APP_URL names another origin', () => {
    expect(isNonCanonicalHost('https://agentbio.net/jane', STAGING)).toBe(false);
  });

  it('compares the port as part of the host', () => {
    const local = { VITE_APP_URL: 'http://localhost:8080' };
    expect(isNonCanonicalHost('http://localhost:8080/', local)).toBe(false);
    expect(isNonCanonicalHost('http://localhost:8788/', local)).toBe(true);
  });
});

describe('withNoindex', () => {
  it('adds noindex, keeping stronger rules from _headers', () => {
    expect(withNoindex(null)).toBe('noindex');
    expect(withNoindex('  ')).toBe('noindex');
    expect(withNoindex('noindex, nofollow')).toBe('noindex, nofollow');
    expect(withNoindex('NoIndex')).toBe('NoIndex');
    expect(withNoindex('none')).toBe('none');
    expect(withNoindex('noarchive')).toBe('noarchive, noindex');
  });
});

describe('markNonCanonicalHost', () => {
  it('returns the same response object on the canonical host', () => {
    const res = new Response('ok');
    expect(markNonCanonicalHost('https://agentbio.net/', PROD, res)).toBe(res);
  });

  it('copies status, body and headers, adding the directive', async () => {
    const res = new Response('<html></html>', {
      status: 404,
      headers: { 'content-type': 'text/html', 'cache-control': 'public, max-age=0' },
    });
    const marked = markNonCanonicalHost('https://agentbio.pages.dev/missing', PROD, res);
    expect(marked.status).toBe(404);
    expect(marked.headers.get('content-type')).toBe('text/html');
    expect(marked.headers.get('cache-control')).toBe('public, max-age=0');
    expect(marked.headers.get('x-robots-tag')).toBe('noindex');
    expect(await marked.text()).toBe('<html></html>');
  });

  it('works on responses whose headers are immutable', () => {
    const res = Response.redirect('https://agentbio.pages.dev/elsewhere', 302);
    const marked = markNonCanonicalHost('https://agentbio.pages.dev/', PROD, res);
    expect(marked.status).toBe(302);
    expect(marked.headers.get('location')).toBe('https://agentbio.pages.dev/elsewhere');
    expect(marked.headers.get('x-robots-tag')).toBe('noindex');
  });
});

describe('_middleware onRequest', () => {
  it('passes agentbio.net responses through untouched', async () => {
    const res = new Response('page', { headers: { 'content-type': 'text/html' } });
    const next = vi.fn(async () => res);
    const out = await onRequest({ request: new Request('https://agentbio.net/jane'), env: PROD, next });
    expect(next).toHaveBeenCalledTimes(1);
    expect(out).toBe(res);
    expect(out.headers.get('x-robots-tag')).toBeNull();
  });

  it('marks static assets on the alias without changing them', async () => {
    const next = vi.fn(
      async () => new Response('console.log(1)', { headers: { 'content-type': 'text/javascript' } })
    );
    const out = await onRequest({
      request: new Request('https://agentbio.pages.dev/assets/index-abc.js'),
      env: PROD,
      next,
    });
    expect(out.status).toBe(200);
    expect(out.headers.get('content-type')).toBe('text/javascript');
    expect(out.headers.get('x-robots-tag')).toBe('noindex');
    expect(await out.text()).toBe('console.log(1)');
  });

  it('lets an error from next() propagate', async () => {
    const next = vi.fn(async (): Promise<Response> => {
      throw new Error('boom');
    });
    await expect(
      onRequest({ request: new Request('https://agentbio.pages.dev/'), env: PROD, next })
    ).rejects.toThrow('boom');
  });
});
