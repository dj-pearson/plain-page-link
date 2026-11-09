import { describe, it, expect } from 'vitest';
import {
  readSpamSignals,
  botReason,
  emailLookupHash,
  phoneLookupHash,
  normalisePhoneForLookup,
  leadLookupHashes,
} from './spam-guard.ts';

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

describe('phone fingerprint (US-522)', () => {
  const KEY = 'k1-secret-value';

  it('reads a number without a country code as North American', () => {
    expect(normalisePhoneForLookup('(512) 555-0142')).toBe('15125550142');
    expect(normalisePhoneForLookup('512.555.0142')).toBe('15125550142');
    expect(normalisePhoneForLookup('1-512-555-0142')).toBe('15125550142');
    expect(normalisePhoneForLookup('+1 512 555 0142')).toBe('15125550142');
  });

  it('keeps an international number as dialled, with 00 read as +', () => {
    expect(normalisePhoneForLookup('+44 20 7946 0958')).toBe('442079460958');
    expect(normalisePhoneForLookup('0044 20 7946 0958')).toBe('442079460958');
    // A +-prefixed ten-digit number already carries its country code.
    expect(normalisePhoneForLookup('+33 1234 5678')).toBe('3312345678');
  });

  it('refuses what cannot be a reachable number', () => {
    expect(normalisePhoneForLookup('555-01')).toBeNull();
    expect(normalisePhoneForLookup('+1234567890123456')).toBeNull();
    expect(normalisePhoneForLookup('   ')).toBeNull();
  });

  it('hashes the same number the same way however it was typed, and depends on the key', async () => {
    const a = await phoneLookupHash('(512) 555-0142', KEY);
    const b = await phoneLookupHash('+1 512-555-0142', KEY);
    const c = await phoneLookupHash('(512) 555-0142', 'k2-secret-value');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(await phoneLookupHash('12', KEY)).toBeNull();
  });

  it('never equals the email fingerprint of the same string', async () => {
    expect(await phoneLookupHash('15125550142', KEY)).not.toBe(await emailLookupHash('15125550142', KEY));
  });
});

describe('which fingerprint the repeat fold matches on (US-220, US-522)', () => {
  const KEY = 'k1-secret-value';

  it('a phone-only visitor who submits twice is matched to their first lead', async () => {
    // First submit: stored with the hashes it carries.
    const first = await leadLookupHashes({ phone: '(512) 555-0142' }, KEY);
    expect(first.email_hash).toBeNull();
    expect(first.phone_hash).not.toBeNull();

    // Second submit, the number typed differently: the fold looks the lead up
    // by phone_hash, and finds the value the first submit stored.
    const second = await leadLookupHashes({ phone: '512-555-0142', email: undefined }, KEY);
    expect(second.fold).toEqual({ column: 'phone_hash', value: first.phone_hash });
  });

  it('an enquiry with an email folds by email, and stores both fingerprints', async () => {
    const both = await leadLookupHashes({ email: 'dana@example.com', phone: '512 555 0142' }, KEY);
    expect(both.fold).toEqual({ column: 'email_hash', value: await emailLookupHash('dana@example.com', KEY) });
    expect(both.phone_hash).toBe(await phoneLookupHash('5125550142', KEY));
  });

  it('a later phone-only enquiry finds a lead that gave an email and that phone', async () => {
    const earlier = await leadLookupHashes({ email: 'dana@example.com', phone: '512 555 0142' }, KEY);
    const later = await leadLookupHashes({ phone: '+15125550142' }, KEY);
    expect(later.fold).toEqual({ column: 'phone_hash', value: earlier.phone_hash });
  });

  it('nothing to match on: no key, or a number that does not normalise', async () => {
    expect(await leadLookupHashes({ email: 'dana@example.com' }, undefined)).toEqual({
      email_hash: null,
      phone_hash: null,
      fold: null,
    });
    expect((await leadLookupHashes({ phone: '123' }, KEY)).fold).toBeNull();
  });
});
