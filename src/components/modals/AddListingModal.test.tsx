import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AddListingModal, type ListingFormData } from './AddListingModal';

/**
 * US-570: the final "Add Listing" button was never disabled while the save
 * ran, and react-hook-form's handleSubmit does not block a second submit, so a
 * double-click inserted two listings, each counted against the plan. Closing
 * mid-save also hid a failed save's error.
 */

interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (err: Error) => void;
}

function deferred(): Deferred {
  let resolve!: () => void;
  let reject!: (err: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup() {
  const pending: Deferred[] = [];
  const onSave = vi.fn<(data: ListingFormData) => Promise<void>>(() => {
    const d = deferred();
    pending.push(d);
    return d.promise;
  });
  const onOpenChange = vi.fn();
  render(<AddListingModal open onOpenChange={onOpenChange} onSave={onSave} />);
  return { onSave, onOpenChange, pending };
}

async function next() {
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
}

/** Fills the required fields and walks to the last step. */
async function fillToLastStep() {
  fireEvent.change(screen.getByLabelText(/street address/i), { target: { value: '1 Main St' } });
  fireEvent.change(screen.getByLabelText(/^city/i), { target: { value: 'Town' } });
  fireEvent.change(screen.getByLabelText(/^state/i), { target: { value: 'CA' } });
  fireEvent.change(screen.getByLabelText(/^zip/i), { target: { value: '94102' } });
  await next();
  await screen.findByLabelText(/square/i);
  fireEvent.change(screen.getByLabelText(/square/i), { target: { value: '2,400' } });
  await next();
  await screen.findByLabelText(/listing price/i);
  fireEvent.change(screen.getByLabelText(/listing price/i), { target: { value: '500000' } });
  await next();
  await screen.findByText(/step 4 of 6/i);
  await next();
  await screen.findByText(/step 5 of 6/i);
  await next();
  await screen.findByRole('button', { name: /add listing/i });
}

describe('AddListingModal save in flight (US-570)', () => {
  it('a double submit calls onSave once and the button reads Saving…', async () => {
    const { onSave, pending } = setup();
    await fillToLastStep();

    const submit = screen.getByRole('button', { name: /add listing/i });
    const form = submit.closest('form') as HTMLFormElement;
    // Two submits in the same tick: the second must not get past the guard.
    act(() => {
      fireEvent.submit(form);
      fireEvent.submit(form);
    });

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saving = await screen.findByRole('button', { name: /saving/i });
    expect(saving).toBeDisabled();

    // Further submits while saving are ignored too.
    fireEvent.submit(form);
    fireEvent.click(saving);
    await act(async () => {
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending[0].resolve();
    });
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
  });

  it('Back, Escape and the X do not close the dialog while saving; a failure stays visible', async () => {
    const { onSave, onOpenChange, pending } = setup();
    await fillToLastStep();

    fireEvent.click(screen.getByRole('button', { name: /add listing/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await screen.findByRole('button', { name: /saving/i });

    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).not.toHaveBeenCalledWith(false);

    await act(async () => {
      pending[0].reject(new Error('Upload failed.'));
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/upload failed/i);
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    // The agent can retry once the save has settled.
    const retry = screen.getByRole('button', { name: /add listing/i });
    expect(retry).not.toBeDisabled();
    fireEvent.click(retry);
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
  });

  it('closes after a save that lands', async () => {
    const { onSave, onOpenChange, pending } = setup();
    await fillToLastStep();
    fireEvent.click(screen.getByRole('button', { name: /add listing/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await act(async () => {
      pending[0].resolve();
    });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
