/**
 * US-114: the share buttons shared window.location.href — the profile, not the
 * listing — so the recipient landed at the top of the page with no idea which
 * property they were being sent.
 *
 * US-275: the listing has a page of its own, /:username/listing/:id, and the
 * old ?listing= links redirect to it.
 */
import { describe, it, expect } from 'vitest';
import {
  buildListingShareUrl,
  legacyListingRedirect,
  listingPagePath,
  LISTING_PARAM,
} from './listingShare';

describe('listingPagePath', () => {
  it('nests the listing under the username', () => {
    expect(listingPagePath('jane', 'abc-123')).toBe('/jane/listing/abc-123');
  });

  it('encodes both parts', () => {
    expect(listingPagePath('jane doe', 'a/b')).toBe('/jane%20doe/listing/a%2Fb');
  });
});

describe('buildListingShareUrl', () => {
  it('points at the listing page, not just the profile', () => {
    expect(buildListingShareUrl('https://agentbio.net/jane', 'abc-123')).toBe(
      'https://agentbio.net/jane/listing/abc-123'
    );
  });

  it('works from another listing page on the same profile', () => {
    expect(buildListingShareUrl('https://agentbio.net/jane/listing/old', 'new')).toBe(
      'https://agentbio.net/jane/listing/new'
    );
  });

  it('does not pass on the query or hash the visitor arrived with', () => {
    expect(
      buildListingShareUrl('https://agentbio.net/jane?utm_source=instagram#contact', 'abc-123')
    ).toBe('https://agentbio.net/jane/listing/abc-123');
  });

  it('keeps the origin, whatever it is', () => {
    expect(buildListingShareUrl('http://localhost:8080/dana-rivers', 'x')).toBe(
      'http://localhost:8080/dana-rivers/listing/x'
    );
  });
});

describe('legacyListingRedirect', () => {
  it('sends an old ?listing= link to the listing page', () => {
    expect(legacyListingRedirect('jane', new URLSearchParams(`${LISTING_PARAM}=abc`))).toBe(
      '/jane/listing/abc'
    );
  });

  it('keeps the campaign parameters the visitor arrived with', () => {
    expect(
      legacyListingRedirect('jane', new URLSearchParams('utm_source=ig&listing=abc&utm_medium=bio'))
    ).toBe('/jane/listing/abc?utm_source=ig&utm_medium=bio');
  });

  it('does nothing for a profile URL without a listing', () => {
    expect(legacyListingRedirect('jane', new URLSearchParams('utm_source=ig'))).toBeNull();
    expect(legacyListingRedirect('jane', new URLSearchParams(`${LISTING_PARAM}=`))).toBeNull();
  });
});
