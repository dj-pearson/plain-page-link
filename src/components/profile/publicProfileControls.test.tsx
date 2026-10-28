/**
 * US-245: icon-only controls on the public profile had no accessible name.
 * Screen readers announced "button" for the testimonial arrows and the listing
 * photo prev/next/thumbnails; on mobile the Filters and Sort buttons were bare
 * icons (their text was `hidden`, not `sr-only`), and the search box had only
 * a placeholder for a label.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListingGallery from './ListingGallery';
import { TestimonialSection } from './TestimonialSection';
import ListingDetailModal from './ListingDetailModal';
import type { PublicProfileListing } from '@/types';
import type { PublicTestimonial } from '@/types/testimonial';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const listing = (id: string, overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id,
    image: null,
    photos: ['https://example.com/1.jpg', 'https://example.com/2.jpg', 'https://example.com/3.jpg'],
    address: `${id} Maple Avenue`,
    city: 'Salt Lake City',
    price: '525000',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1980,
    status: 'active',
    sort_order: 1,
    is_featured: false,
    days_on_market: 12,
    description: null,
    property_type: 'condo',
    state: 'UT',
    zip_code: '84103',
    mls_number: null,
    lot_size_acres: null,
    virtual_tour_url: null,
    highlights: [],
    created_at: '2026-03-01T12:00:00.000Z',
    ...overrides,
  }) as unknown as PublicProfileListing;

const testimonial = (n: number) =>
  ({
    id: `t${n}`,
    client_name: `Client ${n}`,
    client_photo: null,
    rating: 5,
    review: `Review number ${n} was great.`,
    property_type: 'Condo',
    transaction_type: 'buyer',
    date: '2026-01-01',
    is_featured: false,
    sort_order: n,
  }) as unknown as PublicTestimonial;

describe('ListingGallery controls (US-245)', () => {
  it('labels the search box', () => {
    render(<ListingGallery listings={[listing('1')]} />);
    expect(screen.getByRole('searchbox', { name: 'Search properties' })).toBeInTheDocument();
  });

  it('names the filter and sort toggles and reports whether they are expanded', async () => {
    const user = userEvent.setup();
    render(<ListingGallery listings={[listing('1')]} />);

    const filters = screen.getByRole('button', { name: 'Filters' });
    const sort = screen.getByRole('button', { name: 'Sort: Newest First' });
    expect(filters).toHaveAttribute('aria-expanded', 'false');
    expect(sort).toHaveAttribute('aria-expanded', 'false');

    await user.click(filters);
    expect(filters).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('group', { name: 'Minimum Bedrooms' });
    expect(group).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '2+', pressed: false }));
    expect(screen.getByRole('button', { name: '2+' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Filters, 1 active' })).toBeInTheDocument();

    await user.click(sort);
    expect(sort).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(sort).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the button names on mobile, where the visible text is sr-only rather than hidden', () => {
    render(<ListingGallery listings={[listing('1')]} />);
    const filters = screen.getByRole('button', { name: 'Filters' });
    // `hidden` is display:none and removes the name; `sr-only` keeps it.
    expect(filters.querySelector('.hidden')).toBeNull();
  });
});

describe('TestimonialSection arrows (US-245)', () => {
  it('names the previous/next arrows', () => {
    render(<TestimonialSection testimonials={[1, 2, 3, 4].map(testimonial)} />);
    expect(screen.getByRole('button', { name: 'Previous testimonials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next testimonials' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous testimonial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next testimonial' })).toBeInTheDocument();
  });
});

describe('ListingDetailModal photo controls (US-245)', () => {
  it('names prev/next and the thumbnails, and marks the current thumbnail', async () => {
    const user = userEvent.setup();
    render(<ListingDetailModal listing={listing('1')} isOpen onClose={vi.fn()} />);

    expect(await screen.findByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    const thumb1 = screen.getByRole('button', { name: 'Show photo 1 of 3' });
    expect(thumb1).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('button', { name: 'Show photo 2 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(thumb1).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'Show photo 3 of 3' }));
    expect(screen.getByRole('button', { name: 'Show photo 3 of 3' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
