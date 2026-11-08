import { describe, it, expect } from 'vitest';
import {
  homeNodeId,
  listingJsonLdNodes,
  listingNodeId,
  listingReference,
  residenceType,
} from './listingJsonLd';

const PAGE = 'https://agentbio.net/jane/listing/abc-123';

describe('residenceType', () => {
  it('maps the property types the listing forms write', () => {
    expect(residenceType('single_family')).toBe('SingleFamilyResidence');
    expect(residenceType('Single Family')).toBe('SingleFamilyResidence');
    expect(residenceType('condo')).toBe('Apartment');
    expect(residenceType('townhouse')).toBe('House');
    expect(residenceType('land')).toBe('Place');
    expect(residenceType('commercial')).toBe('Place');
  });

  it('claims no more than Accommodation for an unknown or missing type', () => {
    expect(residenceType(null)).toBe('Accommodation');
    expect(residenceType('multi_family')).toBe('Accommodation');
    expect(residenceType('castle')).toBe('Accommodation');
  });
});

describe('listingJsonLdNodes', () => {
  it('splits the listing (a web page with an offer) from the property it is about', () => {
    const [listing, home] = listingJsonLdNodes({
      pageUrl: PAGE,
      name: '412 Maple Avenue, Salt Lake City',
      description: '  Light-filled bungalow.  ',
      images: ['https://cdn.example.com/a.jpg'],
      streetAddress: '412 Maple Avenue',
      city: 'Salt Lake City',
      state: 'UT',
      postalCode: '84105',
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1980,
      price: 525000,
      status: 'active',
      propertyType: 'single_family',
    });

    expect(listing).toEqual({
      '@type': 'RealEstateListing',
      '@id': `${PAGE}#listing`,
      name: '412 Maple Avenue, Salt Lake City',
      url: PAGE,
      description: 'Light-filled bungalow.',
      image: ['https://cdn.example.com/a.jpg'],
      mainEntity: { '@id': `${PAGE}#home` },
      offers: {
        '@type': 'Offer',
        url: PAGE,
        price: 525000,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    });
    expect(home).toEqual({
      '@type': 'SingleFamilyResidence',
      '@id': `${PAGE}#home`,
      name: '412 Maple Avenue, Salt Lake City',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '412 Maple Avenue',
        addressLocality: 'Salt Lake City',
        addressRegion: 'UT',
        postalCode: '84105',
      },
      numberOfBedrooms: 3,
      numberOfBathroomsTotal: 2,
      floorSize: { '@type': 'QuantitativeValue', value: 1980, unitCode: 'FTK' },
    });
    // Room and address facts belong to the place, not to the web page.
    expect(listing).not.toHaveProperty('numberOfBedrooms');
    expect(listing).not.toHaveProperty('address');
  });

  it('marks a sold home SoldOut and leaves out a price that is not a number', () => {
    const [listing] = listingJsonLdNodes({ pageUrl: PAGE, name: 'x', price: NaN, status: 'sold' });
    expect(listing.offers).toEqual({
      '@type': 'Offer',
      url: PAGE,
      availability: 'https://schema.org/SoldOut',
    });
  });

  it('rounds half baths up to whole bathrooms and gives land no rooms', () => {
    expect(listingJsonLdNodes({ pageUrl: PAGE, name: 'x', bathrooms: 2.5 })[1]).toMatchObject({
      numberOfBathroomsTotal: 3,
    });
    const [, plot] = listingJsonLdNodes({
      pageUrl: PAGE,
      name: 'x',
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'land',
    });
    expect(plot['@type']).toBe('Place');
    expect(plot).not.toHaveProperty('numberOfBedrooms');
    expect(plot).not.toHaveProperty('numberOfBathroomsTotal');
    expect(plot).not.toHaveProperty('address');
  });
});

describe('listingReference', () => {
  it('names the listing node by @id with an explicit type', () => {
    expect(listingReference(PAGE, 'Home')).toEqual({
      '@type': 'RealEstateListing',
      '@id': listingNodeId(PAGE),
      name: 'Home',
      url: PAGE,
    });
    expect(homeNodeId(PAGE)).toBe(`${PAGE}#home`);
  });
});
