import { describe, it, expect } from 'vitest';
import {
  buildImportedListing,
  importErrorMessage,
  parseListingText,
  type ImportedListingData,
} from './listingImport';

const imported: ImportedListingData = {
  address: '123 Oak Street',
  city: 'Springfield',
  state: 'IL',
  zip_code: '62701',
  price: '425000',
  bedrooms: 3,
  bathrooms: 2.5,
  square_feet: 1800,
  property_type: 'single_family',
  status: 'active',
  description: 'Ranch home',
  mls_number: 'ML12345',
  lot_size_acres: 0.25,
  photos: [],
};

describe('buildImportedListing (US-253)', () => {
  it('never writes the GENERATED beds/baths/sqft columns', () => {
    // Postgres refuses a non-DEFAULT value for a generated column and fails
    // the whole row. URL import wrote all three, so every import failed.
    const payload = buildImportedListing(imported, '2026-11-01');
    expect(payload).not.toHaveProperty('beds');
    expect(payload).not.toHaveProperty('baths');
    expect(payload).not.toHaveProperty('sqft');
    expect(payload).toMatchObject({ bedrooms: 3, bathrooms: 2.5, square_feet: 1800 });
  });

  it('sets listed_date the way manual add does', () => {
    expect(buildImportedListing(imported, '2026-11-01').listed_date).toBe('2026-11-01');
  });

  it('writes the full payload', () => {
    expect(buildImportedListing(imported, '2026-11-01')).toEqual({
      address: '123 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62701',
      price: '425000',
      bedrooms: 3,
      bathrooms: 2.5,
      square_feet: 1800,
      status: 'active',
      listed_date: '2026-11-01',
      description: 'Ranch home',
      mls_number: 'ML12345',
      property_type: 'single_family',
      lot_size_acres: 0.25,
      photos: null,
      image: null,
    });
  });

  it('stores empty optional text as null and keeps photos when present', () => {
    const payload = buildImportedListing(
      {
        ...imported,
        state: '',
        zip_code: ' ',
        mls_number: '',
        description: '',
        status: '',
        photos: ['https://x/1.jpg', 'https://x/2.jpg'],
      },
      '2026-11-01'
    );
    expect(payload).toMatchObject({
      state: null,
      zip_code: null,
      mls_number: null,
      description: null,
      status: 'active',
      photos: ['https://x/1.jpg', 'https://x/2.jpg'],
      image: 'https://x/1.jpg',
    });
  });
});

describe('parseListingText', () => {
  it('extracts the listing fields from pasted text', () => {
    const parsed = parseListingText(
      '$425,000 | 3 bed | 2 bath | 1,800 sqft\n123 Oak Street, Springfield, IL 62701\nMLS# ML12345'
    );
    expect(parsed).toMatchObject({
      price: '425000',
      bedrooms: 3,
      bathrooms: 2,
      square_feet: 1800,
      address: '123 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zip_code: '62701',
      mls_number: 'ML12345',
    });
  });
});

describe('importErrorMessage', () => {
  it("passes through a plan-limit refusal's message, which is written for the agent", () => {
    const error = {
      message: 'Your plan allows 3 active listings.',
      details: 'plan_limit:listings',
    };
    expect(importErrorMessage(error)).toBe('Your plan allows 3 active listings.');
  });

  it('gives a generic message for anything else', () => {
    expect(
      importErrorMessage(new Error('cannot insert a non-DEFAULT value into column "beds"'))
    ).toMatch(/could not save/i);
  });
});
