import { describe, it, expect, vi } from 'vitest';
import {
  buildCsvListing,
  groupImportFailures,
  importCsvListings,
  normalizeCsvHeader,
  parseCsvRecords,
  parseListingCsv,
  validateListingCsvRow,
  type CsvImportListing,
} from './listingCsvImport';

const HEADER = 'address,city,state,price,bedrooms,status,description,mls_number';

const valid = (overrides: Partial<CsvImportListing> = {}): CsvImportListing => {
  const { errors: _errors, ...rest } = validateListingCsvRow(
    { address: '1 Oak St', city: 'Springfield', state: 'IL', price: '425000' },
    0
  );
  return { ...rest, ...overrides };
};

describe('parseCsvRecords', () => {
  it('keeps a quoted line break inside one field instead of splitting the row', () => {
    const text = `${HEADER}\n"1 Oak St",Springfield,IL,425000,3,active,"Updated kitchen.\nNew roof, 2024.",ML1\n`;
    const rows = parseListingCsv(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe('Updated kitchen.\nNew roof, 2024.');
    expect(rows[0].mls_number).toBe('ML1');
  });

  it('handles CRLF line endings, doubled quotes and blank lines', () => {
    const records = parseCsvRecords('a,b\r\n"say ""hi""",2\r\n\r\n,\r\n3,4');
    expect(records).toEqual([
      ['a', 'b'],
      ['say "hi"', '2'],
      ['3', '4'],
    ]);
  });

  it('drops the byte-order mark Excel writes before the first header', () => {
    const rows = parseListingCsv('\uFEFFaddress,city,state,price\n1 Oak St,Springfield,IL,1');
    expect(rows[0].address).toBe('1 Oak St');
    expect(validateListingCsvRow(rows[0], 0).errors).toEqual([]);
  });

  it('returns no rows for a header with no data', () => {
    expect(parseListingCsv(HEADER)).toEqual([]);
    expect(parseListingCsv('')).toEqual([]);
  });
});

describe('normalizeCsvHeader', () => {
  it.each([
    ['Address', 'address'],
    ['Zip Code', 'zip_code'],
    ['ZIP', 'zip_code'],
    ['MLS #', 'mls_number'],
    ['Beds', 'bedrooms'],
    ['Sq Ft', 'square_feet'],
    ['SqFt', 'square_feet'],
    ['List Price', 'price'],
  ])('%s -> %s', (raw, expected) => {
    expect(normalizeCsvHeader(raw)).toBe(expected);
  });
});

describe('validateListingCsvRow', () => {
  it('numbers rows as the agent sees them, header first', () => {
    expect(validateListingCsvRow({}, 0).row).toBe(2);
    expect(validateListingCsvRow({}, 4).row).toBe(6);
  });

  it('accepts statuses as a spreadsheet writes them', () => {
    const row = { address: 'a', city: 'b', state: 'IL', price: '1' };
    expect(validateListingCsvRow({ ...row, status: 'Under Contract' }, 0).status).toBe(
      'under_contract'
    );
    expect(validateListingCsvRow({ ...row, status: 'Off Market' }, 0).status).toBe('off_market');
    expect(validateListingCsvRow({ ...row, status: 'whatever' }, 0).status).toBe('active');
  });

  it('flags missing required fields and a bad price', () => {
    expect(validateListingCsvRow({ price: 'call' }, 0).errors).toEqual([
      'Address is required',
      'City is required',
      'State is required',
      'Valid price is required',
    ]);
  });

  it('flags a tour URL the database would refuse', () => {
    const parsed = validateListingCsvRow(
      { address: 'a', city: 'b', state: 'IL', price: '1', virtual_tour_url: 'javascript:alert(1)' },
      0
    );
    expect(parsed.errors).toContain(
      'virtual_tour_url must be a web address starting with https://'
    );
  });
});

describe('buildCsvListing', () => {
  it('sets listed_date, and sold_date only for a sold row', () => {
    expect(buildCsvListing(valid(), '2026-11-08')).toMatchObject({
      listed_date: '2026-11-08',
      sold_date: null,
      status: 'active',
      price: '425000',
    });
    expect(buildCsvListing(valid({ status: 'sold' }), '2026-11-08').sold_date).toBe('2026-11-08');
  });

  it('writes no generated column', () => {
    const insert = buildCsvListing(valid(), '2026-11-08') as Record<string, unknown>;
    for (const generated of ['beds', 'baths', 'sqft']) expect(insert).not.toHaveProperty(generated);
  });
});

describe('importCsvListings', () => {
  it('keeps going past a refusal and records each reason by row', async () => {
    const insert = vi
      .fn()
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('plan'))
      .mockResolvedValueOnce({});
    const result = await importCsvListings(
      [valid({ row: 2 }), valid({ row: 3, address: '2 Elm' }), valid({ row: 4, status: 'sold' })],
      { insert, describeError: () => 'Your plan allows 3 active listings.', today: '2026-11-08' }
    );
    expect(insert).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      imported: 2,
      failures: [{ row: 3, address: '2 Elm', reason: 'Your plan allows 3 active listings.' }],
    });
  });
});

describe('groupImportFailures', () => {
  it('groups rows by reason, largest group first', () => {
    expect(
      groupImportFailures([
        { row: 2, address: 'a', reason: 'x' },
        { row: 3, address: 'b', reason: 'limit' },
        { row: 4, address: 'c', reason: 'limit' },
      ])
    ).toEqual([
      { reason: 'limit', rows: [3, 4] },
      { reason: 'x', rows: [2] },
    ]);
  });
});
