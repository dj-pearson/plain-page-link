/**
 * US-119: zapier_webhook_url was written unvalidated, had no CHECK on the
 * column, and was fetched with the service role from an edge runtime that
 * shares a Docker network with postgres-meta, Kong and GoTrue.
 */
import { describe, it, expect } from 'vitest';
import { validateWebhookUrl } from './webhookUrl';

describe('validateWebhookUrl', () => {
  it('accepts the destinations the product supports', () => {
    expect(validateWebhookUrl('https://hooks.zapier.com/hooks/catch/123/abc/').valid).toBe(true);
    expect(validateWebhookUrl('https://hook.us1.make.com/abcdef').valid).toBe(true);
    expect(validateWebhookUrl('https://hook.eu2.make.com/abcdef').valid).toBe(true);
  });

  it('treats an empty value as "no webhook"', () => {
    expect(validateWebhookUrl('').valid).toBe(true);
    expect(validateWebhookUrl('   ').valid).toBe(true);
  });

  it('refuses an internal address — the reason this exists', () => {
    for (const url of [
      'http://postgres-meta:8080/tables',
      'http://127.0.0.1:8000/',
      'http://kong:8000/',
      'https://localhost/hook',
      'http://169.254.169.254/latest/meta-data/',
    ]) {
      expect(validateWebhookUrl(url).valid, url).toBe(false);
    }
  });

  it('refuses http, which would send lead contact details in clear text', () => {
    expect(validateWebhookUrl('http://hooks.zapier.com/hooks/catch/1/a/').valid).toBe(false);
  });

  it('refuses a host that merely contains an allowed one', () => {
    expect(validateWebhookUrl('https://hooks.zapier.com.evil.test/x').valid).toBe(false);
    expect(validateWebhookUrl('https://evil.test/hooks.zapier.com/').valid).toBe(false);
    expect(validateWebhookUrl('https://hook.make.com.evil.test/x').valid).toBe(false);
  });

  it('refuses other schemes outright', () => {
    expect(validateWebhookUrl('file:///etc/passwd').valid).toBe(false);
    expect(validateWebhookUrl('javascript:alert(1)').valid).toBe(false);
  });

  it('says what is wrong, so the agent can fix it', () => {
    expect(validateWebhookUrl('not a url').error).toMatch(/valid URL/i);
    expect(validateWebhookUrl('http://hooks.zapier.com/x/').error).toMatch(/https/i);
    expect(validateWebhookUrl('https://example.com/hook').error).toMatch(/Zapier|Make/);
  });
});
