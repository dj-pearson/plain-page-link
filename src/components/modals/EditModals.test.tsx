/**
 * US-257: Edit Listing and Edit Testimonial copied `initialData` into state and
 * then reset that state in an effect keyed on `initialData`. Both callers build
 * initialData inline, so every re-render of the page (a refetch on window
 * focus, a toast, a status change elsewhere) handed in a new object and wiped
 * whatever the agent had typed. They were also hand-built overlays: no dialog
 * role, no name, no Escape, no focus trap, and an unnamed close button.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditListingModal, type EditListingFormData } from './EditListingModal';
import { EditTestimonialModal, type EditTestimonialFormData } from './EditTestimonialModal';

vi.mock('@/hooks/useListingImageUpload', () => ({
  useListingImageUpload: () => ({
    uploadListingImages: vi.fn(),
    uploading: false,
    progress: 0,
  }),
}));

const listingData = (): EditListingFormData => ({
  address: '1 Main St',
  city: 'Springfield',
  price: '$450,000',
  bedrooms: 3,
  bathrooms: 2,
  status: 'active',
  photos: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
});

const testimonialData = (): EditTestimonialFormData => ({
  client_name: 'Pat Client',
  review: 'Great agent',
  rating: 5,
});

describe('EditListingModal (US-257)', () => {
  it('keeps typed values and photo edits when the parent re-renders with equal-but-new initialData', async () => {
    const user = userEvent.setup();
    const props = { isOpen: true, onClose: vi.fn(), onSubmit: vi.fn(), listingId: 'l1' };
    const { rerender } = render(<EditListingModal {...props} initialData={listingData()} />);

    const address = await screen.findByLabelText('Street Address *');
    await user.clear(address);
    await user.type(address, '22 Elm Ave');
    await user.click(screen.getByRole('button', { name: 'Remove photo 2' }));
    expect(screen.queryByAltText('Photo 2')).not.toBeInTheDocument();

    rerender(<EditListingModal {...props} initialData={listingData()} />);

    expect(screen.getByLabelText('Street Address *')).toHaveValue('22 Elm Ave');
    expect(screen.getByAltText('Photo 1')).toBeInTheDocument();
    expect(screen.queryByAltText('Photo 2')).not.toBeInTheDocument();
  });

  it('is a named dialog with a Close button, and Escape closes it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EditListingModal isOpen onClose={onClose} onSubmit={vi.fn()} initialData={listingData()} />
    );

    expect(
      await screen.findByRole('dialog', { name: 'Edit Property Listing' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    // One Description field, not two inputs sharing id="description".
    expect(screen.getAllByLabelText('Description')).toHaveLength(1);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('submits the edited values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <EditListingModal isOpen onClose={vi.fn()} onSubmit={onSubmit} initialData={listingData()} />
    );
    const city = await screen.findByLabelText('City *');
    await user.clear(city);
    await user.type(city, 'Shelbyville');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ city: 'Shelbyville' }));
  });
});

describe('EditTestimonialModal (US-257)', () => {
  it('keeps typed values when the parent re-renders with equal-but-new initialData', async () => {
    const user = userEvent.setup();
    const props = { isOpen: true, onClose: vi.fn(), onSubmit: vi.fn() };
    const { rerender } = render(
      <EditTestimonialModal {...props} initialData={testimonialData()} />
    );

    const review = await screen.findByLabelText('Review *');
    await user.clear(review);
    await user.type(review, 'Sold above asking');

    rerender(<EditTestimonialModal {...props} initialData={testimonialData()} />);

    expect(screen.getByLabelText('Review *')).toHaveValue('Sold above asking');
  });

  it('is a named dialog with a Close button, and Escape closes it', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EditTestimonialModal
        isOpen
        onClose={onClose}
        onSubmit={vi.fn()}
        initialData={testimonialData()}
      />
    );
    expect(await screen.findByRole('dialog', { name: 'Edit Testimonial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
