import { describe, it, expect, vi } from 'vitest';
import {
  buildCsvListing,
  groupImportFailures,
  importCsvListings,
  isDatabaseRefusal,
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

  it('keeps a stray quote inside an unquoted field literal and does not swallow later rows', () => {
    const text =
      'address,city,state,price,description\n' +
      '1 Oak,Spr,IL,100,Has 12" tiles\n' +
      '2 Elm,Spr,IL,200,ok\n' +
      '3 Ash,Spr,IL,300,ok\n';
    const rows = parseListingCsv(text);
    expect(rows).toHaveLength(3);
    expect(rows[0].description).toBe('Has 12" tiles');
    expect(rows.map((r) => r.address)).toEqual(['1 Oak', '2 Elm', '3 Ash']);
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

describe('importCsvListings with batched inserts (US-597)', () => {
  const rows = (n: number) =>
    Array.from({ length: n }, (_, i) => valid({ row: i + 2, address: `${i + 1} Oak St` }));
  const planRefusal = { code: '23514', message: 'Your plan allows 3 active listings.' };

  it('inserts a 100-row file in four chunks of 25 and never row by row', async () => {
    const insertMany = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn();
    const result = await importCsvListings(rows(100), {
      insert,
      insertMany,
      describeError: () => 'x',
      today: '2026-11-08',
    });
    expect(insertMany).toHaveBeenCalledTimes(4);
    expect(insertMany.mock.calls.map(([chunk]) => chunk.length)).toEqual([25, 25, 25, 25]);
    expect(insert).not.toHaveBeenCalled();
    expect(result).toEqual({ imported: 100, failures: [] });
  });

  it('builds each payload like a single-row import', async () => {
    const insertMany = vi.fn().mockResolvedValue(undefined);
    await importCsvListings([valid({ row: 2 }), valid({ row: 3, status: 'sold' })], {
      insert: vi.fn(),
      insertMany,
      describeError: () => 'x',
      today: '2026-11-08',
    });
    expect(insertMany.mock.calls[0][0]).toEqual([
      buildCsvListing(valid({ row: 2 }), '2026-11-08'),
      buildCsvListing(valid({ row: 3, status: 'sold' }), '2026-11-08'),
    ]);
  });

  it('retries a refused chunk row by row so the rows that fit are kept with each reason', async () => {
    const insertMany = vi.fn().mockRejectedValueOnce(planRefusal).mockResolvedValue(undefined);
    const insert = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(planRefusal)
      .mockResolvedValueOnce(undefined);
    const result = await importCsvListings(rows(5), {
      insert,
      insertMany,
      describeError: (error) => (error as { message: string }).message,
      today: '2026-11-08',
      chunkSize: 3,
    });
    // Chunk 1 (rows 2-4) refused and retried one by one; chunk 2 (rows 5-6) saved in one go.
    expect(insertMany).toHaveBeenCalledTimes(2);
    expect(insert).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      imported: 4,
      failures: [{ row: 3, address: '2 Oak St', reason: 'Your plan allows 3 active listings.' }],
    });
  });

  it('does not retry a chunk whose request did not complete, since it may have been saved', async () => {
    const insertMany = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const insert = vi.fn();
    const result = await importCsvListings(rows(2), {
      insert,
      insertMany,
      describeError: () => 'Network problem',
      today: '2026-11-08',
    });
    expect(insert).not.toHaveBeenCalled();
    expect(result.imported).toBe(0);
    expect(result.failures.map((f) => f.row)).toEqual([2, 3]);
  });

  it('sends a lone last row through the single insert, not a batch', async () => {
    const insertMany = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn().mockResolvedValue(undefined);
    const result = await importCsvListings(rows(26), {
      insert,
      insertMany,
      describeError: () => 'x',
      today: '2026-11-08',
    });
    expect(insertMany).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(26);
  });
});

describe('isDatabaseRefusal', () => {
  it('is true for a PostgREST or Postgres error and false for a dropped request', () => {
    expect(isDatabaseRefusal({ code: '23514', message: 'limit' })).toBe(true);
    expect(isDatabaseRefusal({ code: 'PGRST204', message: 'column' })).toBe(true);
    expect(isDatabaseRefusal({ code: '', message: 'TypeError: Failed to fetch' })).toBe(false);
    expect(isDatabaseRefusal(new TypeError('Failed to fetch'))).toBe(false);
    expect(isDatabaseRefusal(null)).toBe(false);
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
