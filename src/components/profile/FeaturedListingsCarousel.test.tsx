/**
 * US-113: the carousel auto-advanced every 4s, paused on hover only, and
 * ignored prefers-reduced-motion.
 *
 * Hover is the one input a phone does not have, so the visitor most likely to
 * lose their place — a thumb on a small panel — was the one who could not stop
 * it; and a visitor who had asked their OS for stillness got motion anyway.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FeaturedListingsCarousel } from './FeaturedListingsCarousel';
import type { PublicProfileListing } from '@/types';

const listing = (id: string, address: string): PublicProfileListing =>
  ({
    id,
    image: null,
    photos: [],
    address,
    city: 'Salt Lake City',
    price: '525000',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1980,
    status: 'active',
    sort_order: 1,
    is_featured: true,
    days_on_market: 12,
    description: null,
    property_type: 'Single Family',
    state: 'UT',
    zip_code: '84103',
    mls_number: null,
    lot_size_acres: null,
    virtual_tour_url: null,
    highlights: [],
    created_at: '2026-03-01T12:00:00.000Z',
  }) as unknown as PublicProfileListing;

const LISTINGS = [listing('a', '412 Maple Avenue'), listing('b', '77 Birch Street')];

/** matchMedia does not exist in jsdom; the component calls it optionally. */
const stubReducedMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
};

const renderCarousel = () =>
  render(
    <MemoryRouter>
      <FeaturedListingsCarousel listings={LISTINGS} interval={4000} />
    </MemoryRouter>
  );

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe('FeaturedListingsCarousel auto-rotation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('advances on its own by default', () => {
    renderCarousel();
    // The slide counter, not the slide: AnimatePresence mode="wait" holds the
    // outgoing panel until its exit animation finishes, and framer-motion's
    // rAF-driven animations do not advance under fake timers.
    expect(screen.getByText('1 / 2')).toBeInTheDocument();

    advance(4000);
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
  });

  it('does not auto-rotate under prefers-reduced-motion', () => {
    stubReducedMotion(true);
    renderCarousel();

    advance(20000);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('pauses on touch, not only on hover', () => {
    const { container } = renderCarousel();
    fireEvent.touchStart(container.firstElementChild as Element);

    advance(20000);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('pauses while a control inside it has focus', () => {
    const { container } = renderCarousel();
    fireEvent.focus(container.firstElementChild as Element);

    advance(20000);
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });
});
