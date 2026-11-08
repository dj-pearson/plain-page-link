/**
 * US-461: photos uploaded in the edit dialog that never reach a saved row are
 * handed to discardUnsavedPhotos, so they do not stay public in the
 * listing-photos bucket. A failed add-listing insert is handled inside
 * useListings' addListing (see useListings.test.ts).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const BASE = 'https://db.example.com/storage/v1/object/public/listing-photos/u1';
const SAVED = `${BASE}/a/saved.jpg`;
const NEW_A = `${BASE}/a/new-a.jpg`;
const NEW_B = `${BASE}/a/new-b.jpg`;

const mocks = vi.hoisted(() => ({
  discardUnsavedPhotos: vi.fn(async (_urls: readonly string[]) => undefined),
  updateMutateAsync: vi.fn(),
}));

vi.mock('@/components/modals/EditListingModal', () => ({
  EditListingModal: ({
    isOpen,
    initialData,
    onSubmit,
    onDiscardUploads,
  }: {
    isOpen: boolean;
    initialData: { photos: string[] };
    onSubmit: (data: Record<string, unknown>, uploaded: string[]) => void;
    onDiscardUploads?: (urls: string[]) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Edit listing">
        <button
          type="button"
          onClick={() =>
            onSubmit(
              {
                address: '1 First St',
                city: 'Springfield',
                price: '450000',
                bedrooms: 3,
                bathrooms: 2,
                status: 'active',
                photos: [...initialData.photos, NEW_A],
              },
              [NEW_A, NEW_B]
            )
          }
        >
          stub submit
        </button>
        <button type="button" onClick={() => onDiscardUploads?.([NEW_A])}>
          stub cancel
        </button>
      </div>
    ) : null,
}));
vi.mock('@/components/listings/CSVUploadDialog', () => ({ CSVUploadDialog: () => null }));
vi.mock('@/components/listings/URLImportDialog', () => ({ URLImportDialog: () => null }));
vi.mock('@/components/listings/SocialShareDialog', () => ({ SocialShareDialog: () => null }));
vi.mock('@/components/UpgradeModal', () => ({ UpgradeModal: () => null }));
vi.mock('@/hooks/useListingViewStats', () => ({
  useListingViewStats: () => ({ stats: {}, isReady: true, isLoading: false, isError: false }),
}));
vi.mock('@/hooks/useListings', () => ({
  useListings: () => ({
    listings: [
      {
        id: 'a',
        user_id: 'u1',
        address: '1 First St',
        city: 'Springfield',
        price: '450000',
        bedrooms: 3,
        bathrooms: 2,
        status: 'active',
        photos: [SAVED],
        image: SAVED,
        sort_order: 0,
        created_at: '2026-01-01T00:00:00Z',
      },
    ],
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    addListing: { mutateAsync: vi.fn() },
    updateListing: { mutateAsync: mocks.updateMutateAsync },
    deleteListing: { mutateAsync: vi.fn() },
    reorderListings: { mutateAsync: vi.fn() },
    discardUnsavedPhotos: mocks.discardUnsavedPhotos,
  }),
}));
vi.mock('@/hooks/useListingImageUpload', () => ({
  useListingImageUpload: () => ({
    uploadListingImages: vi.fn(),
    uploading: false,
    progress: 0,
  }),
}));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: null, canAdd: () => true }),
}));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: null }) }));
vi.mock('@/components/PlanLimitNotice', () => ({ PlanLimitNotice: () => null }));
vi.mock('@/components/dashboard/QuickStatusUpdate', () => ({ QuickStatusUpdate: () => null }));

import Listings from './Listings';

describe('Listings discards edit-dialog photos that were never saved (US-461)', () => {
  beforeEach(() => {
    mocks.discardUnsavedPhotos.mockClear();
    mocks.updateMutateAsync.mockReset();
  });

  it('after a saved edit, removes only the uploads the save dropped', async () => {
    mocks.updateMutateAsync.mockResolvedValue({});
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: 'Edit 1 First St' }));
    await user.click(await screen.findByRole('button', { name: 'stub submit' }));

    await waitFor(() => expect(mocks.discardUnsavedPhotos).toHaveBeenCalledWith([NEW_B]));
    expect(mocks.updateMutateAsync.mock.calls[0][0].photos).toEqual([SAVED, NEW_A]);
  });

  it('discards nothing when the edit save fails, so a retry can still use them', async () => {
    mocks.updateMutateAsync.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: 'Edit 1 First St' }));
    await user.click(await screen.findByRole('button', { name: 'stub submit' }));

    await waitFor(() => expect(mocks.updateMutateAsync).toHaveBeenCalledTimes(1));
    expect(mocks.discardUnsavedPhotos).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Edit listing' })).toBeInTheDocument();
  });

  it('wires a cancelled edit to discardUnsavedPhotos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Listings />);
    await user.click(screen.getByRole('button', { name: 'Edit 1 First St' }));
    await user.click(await screen.findByRole('button', { name: 'stub cancel' }));

    expect(mocks.discardUnsavedPhotos).toHaveBeenCalledWith([NEW_A]);
  });
});
