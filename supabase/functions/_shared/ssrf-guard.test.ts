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

  /**
   * US-196: the assertions above are correct about a string the guard is never
   * handed.
   *
   * `new URL()` re-serialises an IPv4-mapped address in hexadecimal, so by the
   * time assertFetchableUrl reads url.hostname, `::ffff:127.0.0.1` has become
   * `::ffff:7f00:1`. The old implementation matched on `::ffff:` followed by a
   * DOTTED quad, so it saw nothing it recognised and returned "not blocked" —
   * and a fetch of loopback went out from a process holding the service-role
   * key. The test above passed the whole time.
   *
   * These cases are written as the URL parser produces them. Every input here
   * is the literal output of `new URL(...).hostname`.
   */
  describe('the forms new URL() actually produces', () => {
    const asParsed = (raw: string) => new URL(raw).hostname;

    it.each([
      ['loopback', 'http://[::ffff:127.0.0.1]/', '[::ffff:7f00:1]'],
      ['cloud metadata', 'http://[::ffff:169.254.169.254]/', '[::ffff:a9fe:a9fe]'],
      ['RFC1918', 'http://[::ffff:10.0.0.5]/', '[::ffff:a00:5]'],
      ['fully written out', 'http://[0:0:0:0:0:ffff:7f00:1]/', '[::ffff:7f00:1]'],
    ])('blocks %s once the parser has rewritten it', (_name, raw, expected) => {
      expect(asParsed(raw)).toBe(expected);
      expect(isBlockedAddress(asParsed(raw))).toBe(true);
    });

    it('still lets a mapped public address through', () => {
      expect(isBlockedAddress(asParsed('http://[::ffff:8.8.8.8]/'))).toBe(false);
    });
  });

  it('blocks the other ways an IPv6 address can carry an IPv4 one', () => {
    // ::/96 IPv4-compatible, deprecated but still routed by some stacks.
    expect(isBlockedAddress('::7f00:1')).toBe(true);
    expect(isBlockedAddress('::a9fe:a9fe')).toBe(true);
    // 64:ff9b::/96 NAT64 — reaching an IPv4 is the entire point of the prefix.
    expect(isBlockedAddress('64:ff9b::7f00:1')).toBe(true);
    expect(isBlockedAddress('64:ff9b::808:808')).toBe(false);
    // 2002::/16 6to4 carries its IPv4 in the next 32 bits.
    expect(isBlockedAddress('2002:7f00:1::1')).toBe(true);
    expect(isBlockedAddress('2002:808:808::1')).toBe(false);
    // 2001::/32 Teredo is a tunnel, not a crawl target.
    expect(isBlockedAddress('2001:0:53aa:64c:1c:7d6b:2c6a:d8b1')).toBe(true);
  });

  it('refuses an address it cannot parse rather than calling it public', () => {
    // Refusing something malformed costs nothing. Fetching something we could
    // not read is how this goes wrong.
    expect(isBlockedAddress('::ffff:127.0.0.1::1')).toBe(true);
    expect(isBlockedAddress('1:2:3')).toBe(true);
    expect(isBlockedAddress('gggg::1')).toBe(true);
  });

  it('ignores a zone index, which only ever names a local interface', () => {
    expect(isBlockedAddress('fe80::1%eth0')).toBe(true);
  });
});
