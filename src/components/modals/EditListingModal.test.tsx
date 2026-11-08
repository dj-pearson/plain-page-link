import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * US-461: ListingPhotoManager uploads the moment files are picked. The dialog
 * has to hand back what it uploaded so a cancel, or a photo removed before the
 * save, does not leave public objects behind. The manager is replaced by a
 * stub whose buttons simulate a finished upload and a removal.
 */
let uploadNext: string[] = [];
let lastOnUploaded: ((urls: string[]) => void) | undefined;

vi.mock('@/components/listings/ListingPhotoManager', () => ({
  ListingPhotoManager: ({
    photos,
    onChange,
    onUploaded,
  }: {
    photos: string[];
    onChange: (photos: string[]) => void;
    onUploaded?: (urls: string[]) => void;
  }) => {
    lastOnUploaded = onUploaded;
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            onUploaded?.(uploadNext);
            onChange([...photos, ...uploadNext]);
          }}
        >
          stub upload
        </button>
        <button type="button" onClick={() => onChange(photos.slice(0, -1))}>
          stub remove last
        </button>
      </div>
    );
  },
}));

import { EditListingModal, type EditListingFormData } from './EditListingModal';

const SAVED = 'https://db.example.com/storage/v1/object/public/listing-photos/u1/l1/saved.jpg';
const NEW_A = 'https://db.example.com/storage/v1/object/public/listing-photos/u1/l1/a.jpg';
const NEW_B = 'https://db.example.com/storage/v1/object/public/listing-photos/u1/l1/b.jpg';

const initialData: EditListingFormData = {
  address: '1 Main St',
  city: 'Town',
  price: '100000',
  bedrooms: 3,
  bathrooms: 2,
  status: 'active',
  photos: [SAVED],
};

function setup() {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const onDiscardUploads = vi.fn();
  render(
    <EditListingModal
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      onDiscardUploads={onDiscardUploads}
      initialData={initialData}
      listingId="l1"
    />
  );
  return { onClose, onSubmit, onDiscardUploads };
}

describe('EditListingModal photo uploads (US-461)', () => {
  beforeEach(() => {
    uploadNext = [];
    lastOnUploaded = undefined;
  });

  it('discards the uploads of a cancelled edit and never the saved photos', () => {
    const { onClose, onDiscardUploads } = setup();
    uploadNext = [NEW_A, NEW_B];
    fireEvent.click(screen.getByText('stub upload'));
    // Removing the saved photo in the form does not make it a candidate.
    fireEvent.click(screen.getByText('stub remove last'));
    fireEvent.click(screen.getByText('stub remove last'));
    fireEvent.click(screen.getByText('stub remove last'));

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDiscardUploads).toHaveBeenCalledTimes(1);
    expect(onDiscardUploads).toHaveBeenCalledWith([NEW_A, NEW_B]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call discard when nothing was uploaded', () => {
    const { onClose, onDiscardUploads } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDiscardUploads).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closing with Escape discards as well', () => {
    const { onClose, onDiscardUploads } = setup();
    uploadNext = [NEW_A];
    fireEvent.click(screen.getByText('stub upload'));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onDiscardUploads).toHaveBeenCalledWith([NEW_A]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('passes the session uploads to onSubmit and discards nothing itself', () => {
    const { onSubmit, onDiscardUploads } = setup();
    uploadNext = [NEW_A, NEW_B];
    fireEvent.click(screen.getByText('stub upload'));
    fireEvent.click(screen.getByText('stub remove last'));

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [data, uploaded] = onSubmit.mock.calls[0] as [EditListingFormData, string[]];
    expect(data.photos).toEqual([SAVED, NEW_A]);
    expect(uploaded).toEqual([NEW_A, NEW_B]);
    expect(onDiscardUploads).not.toHaveBeenCalled();
  });

  it('discards an upload that finishes after the dialog closed', () => {
    const { onDiscardUploads } = setup();
    const onUploaded = lastOnUploaded;
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onDiscardUploads).not.toHaveBeenCalled();

    onUploaded?.([NEW_A]);
    expect(onDiscardUploads).toHaveBeenCalledWith([NEW_A]);
  });
});
