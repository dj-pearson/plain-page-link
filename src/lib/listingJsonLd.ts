/**
 * The one JSON-LD model for a property listing (US-578, closes US-568).
 *
 * Two renderings describe the same listing page: the crawler HTML built by
 * functions/_lib/social-meta.ts (buildListingTags) and the SPA's
 * ListingPage.tsx. Both declare the node `<listing url>#listing`, and the
 * agent's page links each offered home to it (makesOffer, US-551). Before
 * this module the crawler typed that node SingleFamilyResidence and the SPA
 * typed it RealEstateListing, so a consumer merging by @id got one node with
 * two conflicting types.
 *
 * The model, following schema.org's own types:
 *   - `#listing` is a RealEstateListing — a WebPage, i.e. the listing itself.
 *     It carries the offer (price, availability), photos and description,
 *     and names the property as its mainEntity.
 *   - `#home` is the property: an Accommodation subtype chosen from
 *     listings.property_type, holding the address, rooms and floor size.
 *     Those are properties of the place, not of a web page, which is why the
 *     earlier RealEstateListing node's numberOfBedrooms was invalid.
 *
 * Kept free of `@/` imports so the Pages Functions bundle can import it.
 */

type JsonLd = Record<string, unknown>;

export interface ListingJsonLdInput {
  /** Canonical listing page URL: <origin>/<username>/listing/<id>. */
  pageUrl: string;
  /** The listing's display name (its address, or a fallback). */
  name: string;
  description?: string | null;
  images?: readonly string[];
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFeet?: number | null;
  /** Numeric price; omitted from the offer when not a positive number. */
  price?: number | null;
  status?: string | null;
  propertyType?: string | null;
}

export function listingNodeId(pageUrl: string): string {
  return `${pageUrl}#listing`;
}

export function homeNodeId(pageUrl: string): string {
  return `${pageUrl}#home`;
}

/**
 * The schema.org type for a listings.property_type value. The values are
 * the ones the listing forms and CSV import write. Anything unknown is an
 * Accommodation, which claims no more than "a place people live in".
 */
export function residenceType(propertyType: string | null | undefined): string {
  switch (
    (propertyType ?? '')
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
  ) {
    case 'single_family':
    case 'house':
      return 'SingleFamilyResidence';
    case 'condo':
    case 'apartment':
      return 'Apartment';
    case 'townhouse':
      return 'House';
    case 'land':
    case 'commercial':
      return 'Place';
    default:
      return 'Accommodation';
  }
}

/** Offer availability for a listing status: sold is SoldOut, the rest InStock. */
export function listingAvailability(status: string | null | undefined): string {
  return status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock';
}

function compact(obj: JsonLd): JsonLd {
  const out: JsonLd = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

function positive(n: number | null | undefined): number | undefined {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
}

/**
 * The RealEstateListing node and its property node, without @context, for a
 * caller's @graph.
 */
export function listingJsonLdNodes(input: ListingJsonLdInput): [JsonLd, JsonLd] {
  const type = residenceType(input.propertyType);
  // Rooms are Accommodation properties; a plot of land or a commercial
  // building typed Place does not take them.
  const takesRooms = type !== 'Place';
  const price = positive(input.price);
  const squareFeet = positive(input.squareFeet);
  const hasAddress = Boolean(input.streetAddress || input.city || input.state || input.postalCode);

  const listing = compact({
    '@type': 'RealEstateListing',
    '@id': listingNodeId(input.pageUrl),
    name: input.name,
    url: input.pageUrl,
    description: input.description?.trim() || undefined,
    image: input.images && input.images.length > 0 ? [...input.images] : undefined,
    mainEntity: { '@id': homeNodeId(input.pageUrl) },
    offers: compact({
      '@type': 'Offer',
      url: input.pageUrl,
      price,
      priceCurrency: price !== undefined ? 'USD' : undefined,
      availability: listingAvailability(input.status),
    }),
  });

  const home = compact({
    '@type': type,
    '@id': homeNodeId(input.pageUrl),
    name: input.name,
    address: hasAddress
      ? compact({
          '@type': 'PostalAddress',
          streetAddress: input.streetAddress?.trim() || undefined,
          addressLocality: input.city?.trim() || undefined,
          addressRegion: input.state?.trim() || undefined,
          postalCode: input.postalCode?.trim() || undefined,
        })
      : undefined,
    numberOfBedrooms: takesRooms ? positive(input.bedrooms) : undefined,
    // An integer by definition (RESO BathroomsTotalInteger): 2.5 baths is two
    // full and one half, three bathrooms.
    numberOfBathroomsTotal:
      takesRooms && positive(input.bathrooms) !== undefined
        ? Math.ceil(input.bathrooms as number)
        : undefined,
    floorSize:
      squareFeet !== undefined
        ? { '@type': 'QuantitativeValue', value: squareFeet, unitCode: 'FTK' }
        : undefined,
  });

  return [listing, home];
}

/**
 * A reference to a listing node for another page's graph — the agent's
 * makesOffer itemOffered. It carries an explicit @type so a consumer that
 * does not merge by @id still knows what is offered.
 */
export function listingReference(pageUrl: string, name: string): JsonLd {
  return {
    '@type': 'RealEstateListing',
    '@id': listingNodeId(pageUrl),
    name,
    url: pageUrl,
  };
}
