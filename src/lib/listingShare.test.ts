/**
 * US-114: the share buttons shared window.location.href — the profile, not the
 * listing — so the recipient landed at the top of the page with no idea which
 * property they were being sent.
 */
import { describe, it, expect } from 'vitest';
import { buildListingShareUrl, LISTING_PARAM } from './listingShare';

describe('buildListingShareUrl', () => {
  it('points at the listing, not just the profile', () => {
    expect(buildListingShareUrl('https://agentbio.net/jane', 'abc-123')).toBe(
      'https://agentbio.net/jane?listing=abc-123'
    );
  });

  it('replaces an existing listing parameter instead of appending one', () => {
    expect(buildListingShareUrl('https://agentbio.net/jane?listing=old', 'new')).toBe(
      'https://agentbio.net/jane?listing=new'
    );
  });

  it('does not pass on the query or hash the visitor arrived with', () => {
    expect(
      buildListingShareUrl('https://agentbio.net/jane?utm_source=instagram#contact', 'abc-123')
    ).toBe('https://agentbio.net/jane?listing=abc-123');
  });

  it('keeps the profile path, whatever it is', () => {
    expect(buildListingShareUrl('http://localhost:8080/dana-rivers', 'x')).toBe(
      `http://localhost:8080/dana-rivers?${LISTING_PARAM}=x`
    );
  });
});
