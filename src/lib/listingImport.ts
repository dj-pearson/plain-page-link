/**
 * Importing a listing from pasted text (US-253).
 *
 * The "Import from URL / Paste" dialog parses what an agent copied from a
 * listing page, lets them review it, and saves it. The save wrote the
 * GENERATED beds/baths/sqft columns, which Postgres refuses outright, so every
 * import failed — and the dialog had already closed and thrown the pasted
 * text away. The payload is built here, as a pure function, so a unit test
 * holds it to the columns the table actually accepts.
 */
import type { NewListing } from '@/hooks/useListings';
import { planLimitKeyFromError } from '@/lib/planLimits';

export interface ImportedListingData {
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  property_type: string;
  status: string;
  description: string;
  mls_number: string;
  lot_size_acres: number | null;
  photos: string[];
}

const blankToNull = (value: string): string | null => (value.trim() ? value : null);

/**
 * The insert for a reviewed import.
 *
 * Canonical columns only, as handleAddListing writes them: bedrooms,
 * bathrooms and square_feet. beds/baths/sqft are GENERATED from those
 * (20260902000007) and types.ts declares them `never` in Insert, so naming one
 * here is a type error. listed_date is set to today, as manual add does, since
 * days on market counts from it.
 */
export function buildImportedListing(data: ImportedListingData, today: string): NewListing {
  return {
    address: data.address,
    city: data.city,
    state: blankToNull(data.state),
    zip_code: blankToNull(data.zip_code),
    price: data.price,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    square_feet: data.square_feet,
    status: data.status || 'active',
    listed_date: today,
    description: blankToNull(data.description),
    mls_number: blankToNull(data.mls_number),
    property_type: data.property_type || null,
    lot_size_acres: data.lot_size_acres,
    photos: data.photos.length > 0 ? data.photos : null,
    image: data.photos[0] ?? null,
  };
}

/**
 * What the dialog shows when the save fails. A plan-limit refusal carries a
 * message written for the agent; anything else is a database error that would
 * mean nothing to them.
 */
export function importErrorMessage(error: unknown): string {
  if (planLimitKeyFromError(error) && error instanceof Object && 'message' in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Could not save this listing. Your details are still here; check them and try again.';
}

/**
 * Pull listing fields out of text an agent copied from a listing page
 * (Zillow, Realtor.com, Redfin, their own site). Moved verbatim from
 * URLImportDialog so it can be tested.
 */
export function parseListingText(text: string): ImportedListingData {
  const data: ImportedListingData = {
    address: '',
    city: '',
    state: '',
    zip_code: '',
    price: '',
    bedrooms: 0,
    bathrooms: 0,
    square_feet: null,
    property_type: 'single_family',
    status: 'active',
    description: '',
    mls_number: '',
    lot_size_acres: null,
    photos: [],
  };

  // Extract price ($XXX,XXX or $X.XM patterns)
  const priceMatch = text.match(/\$[\d,]+(?:\.\d+)?(?:\s*[MmKk])?/);
  if (priceMatch) {
    const priceStr = priceMatch[0].replace(/[$,\s]/g, '');
    if (priceStr.toLowerCase().endsWith('m')) {
      data.price = String(parseFloat(priceStr) * 1000000);
    } else if (priceStr.toLowerCase().endsWith('k')) {
      data.price = String(parseFloat(priceStr) * 1000);
    } else {
      data.price = priceStr;
    }
  }

  // Extract beds/baths patterns: "3 bed" "3 bd" "3 bedroom" "3br"
  const bedMatch = text.match(/(\d+)\s*(?:bed(?:room)?s?|bd|br)\b/i);
  if (bedMatch) data.bedrooms = parseInt(bedMatch[1]);

  const bathMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:bath(?:room)?s?|ba)\b/i);
  if (bathMatch) data.bathrooms = parseFloat(bathMatch[1]);

  // Extract sqft: "1,800 sq ft" "1800sqft" "1,800 square feet"
  const sqftMatch = text.match(/([\d,]+)\s*(?:sq\.?\s*(?:ft|feet)|sqft|square\s*feet)/i);
  if (sqftMatch) data.square_feet = parseInt(sqftMatch[1].replace(/,/g, ''));

  // Extract lot size: "0.25 acres" "10,000 sq ft lot"
  const lotMatch = text.match(/([\d.]+)\s*acres?/i);
  if (lotMatch) data.lot_size_acres = parseFloat(lotMatch[1]);

  // Extract MLS: "MLS# 12345" "MLS: ML12345"
  const mlsMatch = text.match(/MLS[#:\s]*([A-Za-z0-9]+)/i);
  if (mlsMatch) data.mls_number = mlsMatch[1];

  // Extract address - look for street number + street name pattern
  const addressMatch = text.match(
    /(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr|Road|Rd|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl|Terrace|Ter)[.,]?)/i
  );
  if (addressMatch) data.address = addressMatch[1].trim().replace(/[,.]$/, '');

  // Extract city, state, zip from address-like patterns
  const cityStateZipMatch = text.match(
    /([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/
  );
  if (cityStateZipMatch) {
    data.city = cityStateZipMatch[1];
    data.state = cityStateZipMatch[2];
    data.zip_code = cityStateZipMatch[3];
  }

  // Detect property type from keywords
  const textLower = text.toLowerCase();
  if (textLower.includes('condo') || textLower.includes('condominium')) {
    data.property_type = 'condo';
  } else if (textLower.includes('townhouse') || textLower.includes('townhome')) {
    data.property_type = 'townhouse';
  } else if (
    textLower.includes('multi-family') ||
    textLower.includes('duplex') ||
    textLower.includes('triplex')
  ) {
    data.property_type = 'multi_family';
  } else if (
    textLower.includes('land') ||
    textLower.includes('lot') ||
    textLower.includes('vacant')
  ) {
    data.property_type = 'land';
  } else if (
    textLower.includes('commercial') ||
    textLower.includes('office') ||
    textLower.includes('retail')
  ) {
    data.property_type = 'commercial';
  }

  // Use remaining text as description (clean up)
  data.description = text.slice(0, 500).trim();

  return data;
}
