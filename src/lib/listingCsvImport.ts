/**
 * Bulk listing import from a CSV file (US-587).
 *
 * This lived inside CSVUploadDialog and Listings.tsx, untested, and lost data
 * in four ways:
 *
 * - Lines were split on newlines before quotes were read, so a description
 *   with a line break in it (MLS exports and Excel both write them) cut the
 *   row in two: the first half imported with a truncated description and
 *   every later column missing, the second half was a row of garbage.
 * - Excel's "CSV UTF-8" puts a byte-order mark before the first header, so
 *   the first column was named "\uFEFFaddress" and every row failed with
 *   "Address is required".
 * - Nothing set listed_date (days on market counts from it) or sold_date on a
 *   sold row, which the add form and the URL import both do.
 * - A row the database refused (a plan limit, a refused tour URL) was counted
 *   as "failed" with no reason, and the dialog then said "Successfully
 *   imported N listings" with N the number it had *tried*.
 *
 * Everything here is pure so a unit test holds it.
 */
import type { NewListing } from '@/hooks/useListings';
import { parseSquareFeet } from '@/lib/format';
import { CLOSED_LISTING_STATUSES, LISTING_STATUSES } from '@/lib/listingStatus';
import { sanitizeExternalUrl } from '@/utils/sanitizeUrl';

export type CsvRow = Record<string, string>;

export interface ParsedCsvListing {
  /** The record's position as the agent sees it: the header is row 1. */
  row: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  property_type: string;
  status: string;
  description: string | null;
  mls_number: string | null;
  lot_size_acres: number | null;
  is_featured: boolean;
  virtual_tour_url: string | null;
  year_built: number | null;
  errors: string[];
}

export type CsvImportListing = Omit<ParsedCsvListing, 'errors'>;

export interface CsvImportFailure {
  row: number;
  address: string;
  reason: string;
}

export interface CsvImportResult {
  imported: number;
  failures: CsvImportFailure[];
}

/**
 * Header spellings other tools export, mapped to the column this importer
 * reads. Headers are normalised first (lowercase, runs of anything that is
 * not a letter or digit become one underscore), so "MLS #" arrives as "mls"
 * and "Zip Code" as "zip_code".
 */
const HEADER_ALIASES: Record<string, string> = {
  street: 'address',
  street_address: 'address',
  property_address: 'address',
  zip: 'zip_code',
  zipcode: 'zip_code',
  postal_code: 'zip_code',
  list_price: 'price',
  listing_price: 'price',
  asking_price: 'price',
  beds: 'bedrooms',
  baths: 'bathrooms',
  sqft: 'square_feet',
  sq_ft: 'square_feet',
  square_footage: 'square_feet',
  living_area: 'square_feet',
  type: 'property_type',
  mls: 'mls_number',
  mls_id: 'mls_number',
  lot_size_acres: 'lot_size',
  virtual_tour: 'virtual_tour_url',
  tour_url: 'virtual_tour_url',
  featured: 'is_featured',
};

export function normalizeCsvHeader(header: string): string {
  const key = header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return HEADER_ALIASES[key] ?? key;
}

/**
 * RFC 4180 records: quoted fields may hold commas, doubled quotes and line
 * breaks. A quote inside an unquoted field is kept as a literal character. A leading byte-order mark is dropped, and a record whose every field
 * is blank (a trailing newline, a spacer row) is skipped.
 */
export function parseCsvRecords(text: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let inQuotes = false;

  const endRecord = () => {
    record.push(field);
    field = '';
    if (record.some((value) => value.trim() !== '')) records.push(record);
    record = [];
  };

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"' && field === '') {
      // Only a quote that opens the field starts quote mode. A stray one
      // inside an unquoted field (12" tiles) is a literal; treating it as an
      // opener would swallow every following row into this field.
      inQuotes = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      endRecord();
    } else {
      field += char;
    }
  }
  if (field !== '' || record.length > 0) endRecord();
  return records;
}

/** The data rows, keyed by normalised header. */
export function parseListingCsv(text: string): CsvRow[] {
  const records = parseCsvRecords(text);
  if (records.length < 2) return [];
  const headers = records[0].map(normalizeCsvHeader);
  return records.slice(1).map((values) => {
    const row: CsvRow = {};
    headers.forEach((header, i) => {
      // The first of two columns that map to the same name wins.
      if (header && row[header] === undefined) row[header] = (values[i] ?? '').trim();
    });
    return row;
  });
}

const VALID_STATUSES = new Set(LISTING_STATUSES.map((s) => s.value));
const VALID_TYPES = new Set([
  'single_family',
  'condo',
  'townhouse',
  'multi_family',
  'land',
  'commercial',
]);

const normalizeChoice = (value: string | undefined): string =>
  (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

/** Check one row and coerce it to what the insert takes. `index` is 0-based over the data rows. */
export function validateListingCsvRow(row: CsvRow, index: number): ParsedCsvListing {
  const errors: string[] = [];

  if (!row.address) errors.push('Address is required');
  if (!row.city) errors.push('City is required');
  if (!row.state) errors.push('State is required');

  const price = Number(String(row.price || '0').replace(/[^0-9.]/g, ''));
  if (!price || price <= 0) errors.push('Valid price is required');

  const bedrooms = Number(row.bedrooms) || 0;
  const bathrooms = Number(row.bathrooms) || 0;
  const sqft = parseSquareFeet(row.square_feet);
  const lotSize = row.lot_size ? Number(row.lot_size.replace(/[^0-9.]/g, '')) || null : null;
  // A year outside the CHECK range is rejected here so the insert does not
  // fail the whole row (US-106).
  const yearBuilt = row.year_built ? Number(row.year_built.replace(/[^0-9]/g, '')) : null;
  if (yearBuilt !== null && (!Number.isFinite(yearBuilt) || yearBuilt < 1600 || yearBuilt > 2200)) {
    errors.push('year_built must be a four-digit year');
  }

  // The database refuses a virtual tour that is not an http(s) address
  // (listings_virtual_tour_url_scheme, US-456). A bare host is given https://
  // here, as the database would; anything else is flagged on the row.
  const rawTour = row.virtual_tour_url?.trim() || '';
  const virtualTourUrl = rawTour ? sanitizeExternalUrl(rawTour) : '';
  if (rawTour && !virtualTourUrl) {
    errors.push('virtual_tour_url must be a web address starting with https://');
  }

  // "Under Contract" and "under_contract" are the same status.
  const status = normalizeChoice(row.status);
  const propType = normalizeChoice(row.property_type);

  return {
    row: index + 2,
    address: row.address || '',
    city: row.city || '',
    state: (row.state || '').toUpperCase().slice(0, 2),
    zip_code: row.zip_code || '',
    price,
    bedrooms,
    bathrooms,
    square_feet: sqft,
    property_type: VALID_TYPES.has(propType) ? propType : 'single_family',
    status: VALID_STATUSES.has(status) ? status : 'active',
    description: row.description || null,
    mls_number: row.mls_number || null,
    lot_size_acres: lotSize,
    is_featured: ['true', 'yes', 'y', '1'].includes((row.is_featured ?? '').trim().toLowerCase()),
    virtual_tour_url: virtualTourUrl || null,
    year_built: yearBuilt,
    errors,
  };
}

/**
 * The insert for one row. Canonical columns only (beds/baths/sqft are
 * GENERATED), and the two dates manual add writes: listed_date today, and
 * sold_date today for a row that arrives sold, since the file has no close
 * date to give.
 */
export function buildCsvListing(listing: CsvImportListing, today: string): NewListing {
  return {
    address: listing.address,
    city: listing.city,
    state: listing.state || null,
    zip_code: listing.zip_code || null,
    price: String(listing.price),
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    square_feet: listing.square_feet,
    status: listing.status,
    listed_date: today,
    sold_date: CLOSED_LISTING_STATUSES.has(listing.status) ? today : null,
    description: listing.description,
    mls_number: listing.mls_number,
    property_type: listing.property_type,
    lot_size_acres: listing.lot_size_acres,
    is_featured: listing.is_featured,
    virtual_tour_url: listing.virtual_tour_url,
    year_built: listing.year_built,
  };
}

/** Rows per batched insert. Small enough that a refused chunk's row-by-row retry stays cheap. */
export const CSV_IMPORT_CHUNK_SIZE = 25;

/**
 * Whether an insert error is the database refusing the statement (a plan
 * limit, a CHECK, a bad value) rather than the request not completing.
 *
 * PostgREST and Postgres errors carry a code (a SQLSTATE such as 23514, or
 * PGRSTxxx). A dropped connection or a timeout carries none, and the
 * statement may still have committed, so retrying its rows one by one could
 * insert them twice.
 */
export function isDatabaseRefusal(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) return false;
  const code = (error as { code: unknown }).code;
  return typeof code === 'string' && code.trim() !== '';
}

/**
 * Insert the rows and record why each refused one failed (US-597).
 *
 * Rows go in chunks of CSV_IMPORT_CHUNK_SIZE through `insertMany`, so a
 * 100-row file is four requests instead of one hundred. A multi-row insert is
 * one statement, all or nothing, so when the database refuses a chunk its rows
 * are retried one at a time through `insert`: every row that fits is kept and
 * each refused row gets its own reason.
 *
 * It does not stop at the first plan-limit refusal: active and sold listings
 * are metered separately, so a sold row can still fit after the active
 * allowance is used up. The limit trigger runs per row and sees the rows
 * inserted earlier in the same statement, so a chunk cannot slip past it.
 *
 * A chunk that fails without a database refusal (the request did not
 * complete) is not retried, because it may have been saved: its rows are
 * reported with the reason instead.
 *
 * Without `insertMany` every row is inserted on its own.
 */
export async function importCsvListings(
  listings: readonly CsvImportListing[],
  options: {
    insert: (listing: NewListing) => Promise<unknown>;
    insertMany?: (listings: NewListing[]) => Promise<unknown>;
    describeError: (error: unknown) => string;
    today: string;
    chunkSize?: number;
  }
): Promise<CsvImportResult> {
  let imported = 0;
  const failures: CsvImportFailure[] = [];
  const fail = (listing: CsvImportListing, error: unknown) => {
    failures.push({
      row: listing.row,
      address: listing.address,
      reason: options.describeError(error),
    });
  };

  const insertOneByOne = async (rows: readonly CsvImportListing[]) => {
    for (const listing of rows) {
      try {
        await options.insert(buildCsvListing(listing, options.today));
        imported++;
      } catch (error) {
        fail(listing, error);
      }
    }
  };

  const { insertMany } = options;
  if (!insertMany) {
    await insertOneByOne(listings);
    return { imported, failures };
  }

  const size = Math.max(1, Math.floor(options.chunkSize ?? CSV_IMPORT_CHUNK_SIZE));
  for (let start = 0; start < listings.length; start += size) {
    const chunk = listings.slice(start, start + size);
    if (chunk.length === 1) {
      await insertOneByOne(chunk);
      continue;
    }
    try {
      await insertMany(chunk.map((listing) => buildCsvListing(listing, options.today)));
      imported += chunk.length;
    } catch (error) {
      if (isDatabaseRefusal(error)) {
        await insertOneByOne(chunk);
      } else {
        for (const listing of chunk) fail(listing, error);
      }
    }
  }
  return { imported, failures };
}

/** Failures grouped by reason, largest group first, for a short summary. */
export function groupImportFailures(
  failures: readonly CsvImportFailure[]
): { reason: string; rows: number[] }[] {
  const groups = new Map<string, number[]>();
  for (const failure of failures) {
    const rows = groups.get(failure.reason) ?? [];
    rows.push(failure.row);
    groups.set(failure.reason, rows);
  }
  return [...groups.entries()]
    .map(([reason, rows]) => ({ reason, rows }))
    .sort((a, b) => b.rows.length - a.rows.length);
}
