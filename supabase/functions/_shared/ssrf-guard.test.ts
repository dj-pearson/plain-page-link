import { describe, it, expect } from 'vitest';
import { isBlockedAddress } from './ssrf-guard.ts';

describe('isBlockedAddress (US-077)', () => {
  it('blocks cloud metadata', () => {
    // The one that matters most: 169.254.169.254 is where AWS/GCP/Azure serve
    // instance credentials, and these functions run holding the service role.
    expect(isBlockedAddress('169.254.169.254')).toBe(true);
    expect(isBlockedAddress('169.254.0.1')).toBe(true);
  });

  it('blocks loopback and RFC1918', () => {
    for (const ip of ['127.0.0.1', '127.1.2.3', '10.0.0.5', '172.16.0.1', '172.31.255.254', '192.168.1.1']) {
      expect(isBlockedAddress(ip), ip).toBe(true);
    }
  });

  it('does not over-block adjacent public ranges', () => {
    // 172.15/172.32 sit either side of the 172.16/12 private block, and
    // 192.167/192.169 either side of 192.168/16 — a sloppy prefix check
    // swallows these.
    for (const ip of ['8.8.8.8', '172.15.0.1', '172.32.0.1', '192.167.1.1', '192.169.1.1', '11.0.0.1']) {
      expect(isBlockedAddress(ip), ip).toBe(false);
    }
  });

  it('blocks CGNAT, multicast and reserved', () => {
    expect(isBlockedAddress('100.64.0.1')).toBe(true);
    expect(isBlockedAddress('224.0.0.1')).toBe(true);
    expect(isBlockedAddress('255.255.255.255')).toBe(true);
    expect(isBlockedAddress('0.0.0.0')).toBe(true);
  });

  it('blocks IPv6 loopback, unique-local and link-local', () => {
    expect(isBlockedAddress('::1')).toBe(true);
    expect(isBlockedAddress('[::1]')).toBe(true);
    expect(isBlockedAddress('fd00::1')).toBe(true);
    expect(isBlockedAddress('fe80::1')).toBe(true);
    expect(isBlockedAddress('2606:4700:4700::1111')).toBe(false);
  });

  it('blocks IPv4-mapped IPv6, which is how loopback usually sneaks past', () => {
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isBlockedAddress('::ffff:169.254.169.254')).toBe(true);
    expect(isBlockedAddress('::ffff:8.8.8.8')).toBe(false);
  });
});
