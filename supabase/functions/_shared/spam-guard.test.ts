import { describe, it, expect } from 'vitest';
import { readSpamSignals, botReason, emailLookupHash } from './spam-guard.ts';

describe('spam guard (US-220)', () => {
  it('a filled honeypot is a bot', () => {
    expect(botReason(readSpamSignals({ _hp: 'https://spam.example', _elapsed_ms: 9000 }))).toBe('honeypot');
  });

  it('a form sent within three seconds is a bot', () => {
    expect(botReason(readSpamSignals({ _hp: '', _elapsed_ms: 800 }))).toBe('too_fast');
  });

  it('a person who took their time is not', () => {
    expect(botReason(readSpamSignals({ _hp: '', _elapsed_ms: 12_000 }))).toBeNull();
  });

  it('missing signals are not treated as a bot on their own', () => {
    expect(botReason(readSpamSignals({}))).toBeNull();
    expect(botReason(readSpamSignals({ _elapsed_ms: 'fast' }))).toBeNull();
  });

  it('the email fingerprint ignores case and whitespace, and depends on the key', async () => {
    const a = await emailLookupHash(' Dana@Example.com ', 'k1-secret-value');
    const b = await emailLookupHash('dana@example.com', 'k1-secret-value');
    const c = await emailLookupHash('dana@example.com', 'k2-secret-value');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
