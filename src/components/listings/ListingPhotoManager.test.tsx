/** US-235: agents had nowhere to describe a listing photo. */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';
import { ListingPhotoManager, draftAltText } from './ListingPhotoManager';

vi.mock('@/hooks/useListingImageUpload', () => ({
  useListingImageUpload: () => ({ uploadListingImages: vi.fn(), uploading: false, progress: { current: 0, total: 0 } }),
}));

describe('ListingPhotoManager alt text', () => {
  it('has a labelled description field per photo that updates that photo only', async () => {
    const onChange = vi.fn();
    const photos = [
      { url: '/a.jpg', alt: '' },
      { url: '/b.jpg', alt: 'Pool' },
    ];
    renderWithProviders(<ListingPhotoManager photos={photos} onChange={onChange} />);
    const field = screen.getByLabelText('Description of photo 1');
    await userEvent.type(field, 'K');
    expect(onChange).toHaveBeenLastCalledWith([
      { url: '/a.jpg', alt: 'K' },
      { url: '/b.jpg', alt: 'Pool' },
    ]);
    expect(screen.getByLabelText('Description of photo 2')).toHaveValue('Pool');
  });

  it('Suggest drafts from the listing details without overwriting what the agent wrote', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ListingPhotoManager
        photos={[{ url: '/a.jpg', alt: '' }, { url: '/b.jpg', alt: 'Mine' }]}
        onChange={onChange}
        details={{ address: '1 Main St', propertyType: 'Condo', bedrooms: 2, bathrooms: 1 }}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Suggest a description for photo 1' }));
    expect(onChange).toHaveBeenLastCalledWith([
      { url: '/a.jpg', alt: '2-bedroom, 1-bathroom condo at 1 Main St: ' },
      { url: '/b.jpg', alt: 'Mine' },
    ]);
    onChange.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'Suggest a description for photo 2' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('drafts sensibly with little to go on', () => {
    expect(draftAltText(undefined, 0)).toBe('Home: ');
    expect(draftAltText({ address: '9 Elm' }, 2)).toBe('Home at 9 Elm, photo 3: ');
  });
});
