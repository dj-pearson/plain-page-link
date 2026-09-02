/**
 * US-113: the badge read `transaction_type === 'buyer' ? 'Buyer' : 'Seller'`,
 * so a client the review form recorded as "Both (Buyer & Seller)" was
 * published on the agent's profile as a seller.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestimonialCard } from './TestimonialCard';
import type { PublicTestimonial } from '@/types/testimonial';

const testimonial = (overrides: Partial<PublicTestimonial> = {}): PublicTestimonial => ({
  id: '55555555-5555-5555-5555-555555555555',
  client_name: 'Dana Rivers',
  client_title: null,
  client_photo: null,
  review: 'She found us three houses in a week.',
  rating: 5,
  sort_order: null,
  date: '2026-03-01T12:00:00.000Z',
  is_featured: false,
  transaction_type: 'both',
  property_type: null,
  created_at: '2026-03-01T12:00:00.000Z',
  is_published: true,
  ...overrides,
});

describe('TestimonialCard transaction badge', () => {
  it("shows 'both' as Buyer & Seller", () => {
    render(<TestimonialCard testimonial={testimonial()} />);
    expect(screen.getByText('Buyer & Seller')).toBeInTheDocument();
    expect(screen.queryByText(/^Seller$/)).toBeNull();
  });

  it('shows the single-sided values unchanged', () => {
    const { rerender } = render(
      <TestimonialCard testimonial={testimonial({ transaction_type: 'buyer' })} />
    );
    expect(screen.getByText('Buyer')).toBeInTheDocument();

    rerender(<TestimonialCard testimonial={testimonial({ transaction_type: 'seller' })} />);
    expect(screen.getByText('Seller')).toBeInTheDocument();
  });

  it('shows no badge for a value it cannot name', () => {
    render(<TestimonialCard testimonial={testimonial({ transaction_type: null })} />);
    expect(screen.queryByText(/buyer|seller/i)).toBeNull();
  });
});
