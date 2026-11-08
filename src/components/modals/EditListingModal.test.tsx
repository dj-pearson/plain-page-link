import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

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

function setup(submitResult: () => Promise<boolean> = () => Promise.resolve(true)) {
  const onClose = vi.fn();
  const onSubmit = vi.fn<(data: EditListingFormData, uploaded: string[]) => Promise<boolean>>(() =>
    submitResult()
  );
  const onDiscardUploads = vi.fn();
  const view = render(
    <EditListingModal
      isOpen
      onClose={onClose}
      onSubmit={onSubmit}
      onDiscardUploads={onDiscardUploads}
      initialData={initialData}
      listingId="l1"
    />
  );
  return { onClose, onSubmit, onDiscardUploads, unmount: view.unmount };
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

describe('EditListingModal virtual tour URL (US-517)', () => {
  function typeTour(value: string) {
    fireEvent.change(screen.getByLabelText('Virtual Tour URL'), { target: { value } });
  }

  it('refuses javascript: next to the field and does not submit', () => {
    const { onSubmit } = setup();
    typeTour('javascript:x');
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).not.toHaveBeenCalled();
    const input = screen.getByLabelText('Virtual Tour URL');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(
      'The virtual tour link must be a full web address starting with https://.'
    );
  });

  it('saves a bare host with https://', () => {
    const { onSubmit } = setup();
    typeTour('my.matterport.com/show/?m=abc');
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const [data] = onSubmit.mock.calls[0] as [EditListingFormData, string[]];
    expect(data.virtual_tour_url).toBe('https://my.matterport.com/show/?m=abc');
  });

  it('clears the error once the agent edits the field', () => {
    setup();
    typeTour('javascript:x');
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    typeTour('https://tour.example.com');
    expect(screen.getByLabelText('Virtual Tour URL')).not.toHaveAttribute('aria-invalid');
  });
});

describe('EditListingModal unmounted without saving (US-512)', () => {
  beforeEach(() => {
    uploadNext = [];
    lastOnUploaded = undefined;
  });

  it('discards the session uploads when it unmounts with the dialog open', () => {
    const { onDiscardUploads, unmount } = setup();
    uploadNext = [NEW_A, SAVED];
    fireEvent.click(screen.getByText('stub upload'));
    unmount();
    expect(onDiscardUploads).toHaveBeenCalledTimes(1);
    expect(onDiscardUploads).toHaveBeenCalledWith([NEW_A]);
  });

  it('does not discard twice after a cancel followed by the unmount', () => {
    const { onDiscardUploads, unmount } = setup();
    uploadNext = [NEW_A];
    fireEvent.click(screen.getByText('stub upload'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    unmount();
    expect(onDiscardUploads).toHaveBeenCalledTimes(1);
  });

  it('keeps the uploads of a save that landed when the dialog then unmounts', async () => {
    const { onSubmit, onDiscardUploads, unmount } = setup();
    uploadNext = [NEW_A];
    fireEvent.click(screen.getByText('stub upload'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    unmount();
    expect(onDiscardUploads).not.toHaveBeenCalled();
  });

  it('waits for a save in flight, and discards only if that save fails', async () => {
    let finish: (saved: boolean) => void = () => undefined;
    const { onDiscardUploads, unmount } = setup(
      () => new Promise<boolean>((resolve) => (finish = resolve))
    );
    uploadNext = [NEW_A];
    fireEvent.click(screen.getByText('stub upload'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    unmount();
    expect(onDiscardUploads).not.toHaveBeenCalled();

    finish(false);
    await waitFor(() => expect(onDiscardUploads).toHaveBeenCalledWith([NEW_A]));
  });

  it('does not discard after an in-flight save succeeds', async () => {
    let finish: (saved: boolean) => void = () => undefined;
    const { onDiscardUploads, unmount } = setup(
      () => new Promise<boolean>((resolve) => (finish = resolve))
    );
    uploadNext = [NEW_A];
    fireEvent.click(screen.getByText('stub upload'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    unmount();
    finish(true);
    await new Promise((r) => setTimeout(r, 0));
    expect(onDiscardUploads).not.toHaveBeenCalled();
  });

  it('discards an upload that finishes after the unmount', () => {
    const { onDiscardUploads, unmount } = setup();
    const onUploaded = lastOnUploaded;
    unmount();
    expect(onDiscardUploads).not.toHaveBeenCalled();
    onUploaded?.([NEW_B]);
    expect(onDiscardUploads).toHaveBeenCalledWith([NEW_B]);
  });
});
