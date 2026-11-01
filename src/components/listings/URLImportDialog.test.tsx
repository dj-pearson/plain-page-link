import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { URLImportDialog } from './URLImportDialog';

const PASTED = '$425,000 | 3 bed | 2 bath | 1,800 sqft\n123 Oak Street, Springfield, IL 62701';

function openToReview(onImport: () => Promise<void>, onOpenChange = vi.fn()) {
  render(<URLImportDialog open onOpenChange={onOpenChange} onImport={onImport} />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: PASTED } });
  fireEvent.click(screen.getByRole('button', { name: /extract details/i }));
  return onOpenChange;
}

describe('URLImportDialog (US-253)', () => {
  it('offers no URL-scrape tab', () => {
    render(<URLImportDialog open onOpenChange={vi.fn()} onImport={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /from url/i })).toBeNull();
  });

  it('stays open with the error inline and the pasted text intact when the save fails', async () => {
    const onImport = vi.fn().mockRejectedValue(new Error('cannot insert into column "beds"'));
    const onOpenChange = openToReview(onImport);

    fireEvent.click(screen.getByRole('button', { name: /import listing/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not save this listing/i);
    expect(onImport).toHaveBeenCalledTimes(1);
    expect(onOpenChange).not.toHaveBeenCalled();
    // The reviewed fields are still there…
    expect(screen.getByDisplayValue('123 Oak Street')).toBeInTheDocument();
    // …and so is what the agent pasted.
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByRole('textbox')).toHaveValue(PASTED);
  });

  it('closes only once the save resolves', async () => {
    let resolve: () => void = () => undefined;
    const onImport = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const onOpenChange = openToReview(onImport);

    fireEvent.click(screen.getByRole('button', { name: /import listing/i }));
    expect(await screen.findByRole('button', { name: /saving/i })).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();

    resolve();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
