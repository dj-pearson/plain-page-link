/**
 * US-587: the done step reports what was saved, not what was attempted, and
 * names the reason for every row the database refused.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CSVUploadDialog } from './CSVUploadDialog';
import type { CsvImportListing, CsvImportResult } from '@/lib/listingCsvImport';

const CSV = [
  '\uFEFFAddress,City,State,List Price,Status,Description',
  '"1 Oak St",Springfield,IL,425000,Active,"Two lines.\nSecond line, with a comma."',
  '"2 Elm St",Springfield,IL,350000,Sold,',
  '"3 Ash St",Springfield,IL,300000,Active,',
].join('\r\n');

function upload(onImport: (rows: CsvImportListing[]) => Promise<CsvImportResult>) {
  render(<CSVUploadDialog open onOpenChange={vi.fn()} onImport={onImport} />);
  // The dialog renders in a portal, so the input is found on the document.
  const input = document.getElementById('csv-upload') as HTMLInputElement;
  const file = new File([CSV], 'listings.csv', { type: 'text/csv' });
  fireEvent.change(input, { target: { files: [file] } });
}

describe('CSVUploadDialog (US-587)', () => {
  it('parses an Excel export with a BOM and a multi-line description into three rows', async () => {
    const onImport = vi.fn(async (rows: CsvImportListing[]) => ({
      imported: rows.length,
      failures: [],
    }));
    upload(onImport);

    const button = await screen.findByRole('button', { name: /import 3 listings/i });
    fireEvent.click(button);

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    const rows = onImport.mock.calls[0][0];
    expect(rows.map((r) => r.row)).toEqual([2, 3, 4]);
    expect(rows[0].description).toBe('Two lines.\nSecond line, with a comma.');
    expect(rows[1].status).toBe('sold');
    expect(await screen.findByRole('status')).toHaveTextContent('Imported 3 of 3 listings.');
  });

  it('shows the real count and each refusal reason when rows fail', async () => {
    const onImport = vi.fn(async () => ({
      imported: 1,
      failures: [
        { row: 3, address: '2 Elm St', reason: 'Your plan allows 1 sold listing.' },
        { row: 4, address: '3 Ash St', reason: 'Your plan allows 1 active listing.' },
      ],
    }));
    upload(onImport);
    fireEvent.click(await screen.findByRole('button', { name: /import 3 listings/i }));

    expect(await screen.findByText('Import partly complete')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Imported 1 of 3 listings.');
    expect(screen.getByText(/Your plan allows 1 sold listing\./)).toBeInTheDocument();
    expect(screen.getByText(/Your plan allows 1 active listing\./)).toBeInTheDocument();
    expect(screen.queryByText(/successfully imported 3/i)).toBeNull();
  });
});
