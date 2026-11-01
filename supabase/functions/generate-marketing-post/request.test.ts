/**
 * US-248: generate-marketing-post took the webhook URL straight from the body
 * and POSTed to it with no SSRF guard, and echoed the upstream response body
 * back to the caller. The request now names a stored webhook by id, and the
 * delivery outcome is summarised without the upstream body.
 */
import { describe, it, expect } from 'vitest';
import { deliveryOutcome, parseMarketingPostRequest, webhookHeaders } from './request';

const ID = '3f1c8a2e-5b7d-4e9a-9c1f-0a2b3c4d5e6f';

describe('parseMarketingPostRequest', () => {
  it('accepts an empty body as a draft request', () => {
    expect(parseMarketingPostRequest({})).toEqual({ ok: true, webhookId: null });
    expect(parseMarketingPostRequest(null)).toEqual({ ok: true, webhookId: null });
  });

  it('accepts a webhook id', () => {
    expect(parseMarketingPostRequest({ webhookId: ID })).toEqual({ ok: true, webhookId: ID });
  });

  it('refuses a raw webhookUrl: the URL must come from social_media_webhooks', () => {
    const r = parseMarketingPostRequest({ webhookUrl: 'http://169.254.169.254/latest/meta-data' });
    expect(r.ok).toBe(false);
  });

  it('refuses a webhookId that is not a uuid', () => {
    expect(parseMarketingPostRequest({ webhookId: 'http://127.0.0.1/' }).ok).toBe(false);
    expect(parseMarketingPostRequest({ webhookId: 42 }).ok).toBe(false);
  });

  it('refuses a non-object body', () => {
    expect(parseMarketingPostRequest('x').ok).toBe(false);
    expect(parseMarketingPostRequest([ID]).ok).toBe(false);
  });
});

describe('webhookHeaders', () => {
  it('keeps string headers and always sends JSON', () => {
    expect(webhookHeaders({ 'X-Token': 'abc' })).toEqual({
      'X-Token': 'abc',
      'Content-Type': 'application/json',
    });
  });

  it('drops non-string values, hop-by-hop and Host headers, and ignores non-objects', () => {
    expect(webhookHeaders({ n: 1, Host: 'internal', 'Content-Length': '9', ok: 'y' })).toEqual({
      ok: 'y',
      'Content-Type': 'application/json',
    });
    expect(webhookHeaders(['a'])).toEqual({ 'Content-Type': 'application/json' });
    expect(webhookHeaders(null)).toEqual({ 'Content-Type': 'application/json' });
  });
});

describe('deliveryOutcome', () => {
  it('reports success without any upstream detail', () => {
    expect(deliveryOutcome({ status: 200, ok: true })).toEqual({ delivered: true, status: 200 });
  });

  it('reports a failed delivery by status only', () => {
    const out = deliveryOutcome({ status: 500, ok: false });
    expect(out).toEqual({ delivered: false, status: 500, error: 'Webhook answered 500' });
    expect(JSON.stringify(out)).not.toContain('details');
  });

  it('reports a refused or unreachable target without the reason', () => {
    expect(deliveryOutcome(new Error('Refusing to fetch http://10.0.0.1/: private'))).toEqual({
      delivered: false,
      status: null,
      error: 'Webhook could not be reached',
    });
  });
});
