/**
 * US-305: the Stats and Testimonial blocks show the agent's real figures and
 * published reviews, and never the invented ones a template saved into a page.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsBlock } from './StatsBlock';
import { TestimonialBlock } from './TestimonialBlock';
import type { StatsBlockConfig, TestimonialBlockConfig } from '@/types/pageBuilder';
import type { AgentPageFacts, AgentTestimonial } from '@/lib/agentPageFacts';

type QueryState = {
  data?: { facts: AgentPageFacts; testimonials: AgentTestimonial[] };
  isLoading: boolean;
};

const mockQuery = vi.fn<(userId: string | undefined, enabled?: boolean) => QueryState>();

vi.mock('@/hooks/useAgentPageFacts', () => ({
  useAgentPageFacts: (userId: string | undefined, enabled?: boolean) => mockQuery(userId, enabled),
}));

const facts: AgentPageFacts = {
  soldListings: 12,
  activeListings: 2,
  yearsExperience: null,
  reviewCount: 1,
  averageRating: 5,
};

const realTestimonial: AgentTestimonial = {
  id: 'r1',
  name: 'Dana K.',
  role: 'Seller',
  content: 'Sold our condo and kept us informed the whole way.',
  rating: 5,
};

// What a page built from "Premium Showcase" before US-305 still holds.
const legacyStats: StatsBlockConfig = {
  type: 'stats',
  title: 'By The Numbers',
  layout: 'cards',
  stats: [
    { id: 's1', value: '200', label: 'Homes Sold', icon: 'home', suffix: '+' },
    { id: 's2', value: '98', label: 'Client Satisfaction', icon: 'star', suffix: '%' },
    { id: 's3', value: '15', label: 'Years Experience', icon: 'award', suffix: '+' },
    { id: 's4', value: '50', label: 'M in Sales', icon: 'dollar', prefix: '$' },
  ],
};

const liveStats: StatsBlockConfig = {
  type: 'stats',
  title: 'By The Numbers',
  layout: 'row',
  stats: [
    { id: 's1', source: 'sold_listings', value: '', label: 'Homes sold', icon: 'home' },
    { id: 's2', source: 'years_experience', value: '', label: 'Years experience', icon: 'award' },
    { id: 's3', source: 'average_rating', value: '', label: 'Average rating', icon: 'star' },
  ],
};

const legacyTestimonials: TestimonialBlockConfig = {
  type: 'testimonial',
  title: 'What My Clients Say',
  layout: 'grid',
  testimonials: [
    {
      id: 't2',
      name: 'Michael R.',
      role: 'Home Seller',
      content:
        'Sold our home in just 5 days above asking price. The marketing strategy was top-notch and communication was excellent throughout.',
      rating: 5,
    },
  ],
};

beforeEach(() => {
  mockQuery.mockReset();
  mockQuery.mockReturnValue({ data: { facts, testimonials: [realTestimonial] }, isLoading: false });
});

describe('StatsBlock (US-305)', () => {
  it('never shows the figures a template invented on the public page', () => {
    const { container } = render(<StatsBlock config={legacyStats} userId="u1" />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Client Satisfaction')).not.toBeInTheDocument();
  });

  it('tells the agent in the editor why they are hidden', () => {
    render(<StatsBlock config={legacyStats} userId="u1" isEditing />);
    expect(screen.getByText(/4 example figures from a template are hidden/)).toBeInTheDocument();
    expect(screen.queryByText('$50')).not.toBeInTheDocument();
  });

  it("shows the agent's real counts and leaves out a figure that does not exist", () => {
    render(<StatsBlock config={liveStats} userId="u1" />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Homes sold')).toBeInTheDocument();
    expect(screen.getByText('5.0 / 5')).toBeInTheDocument();
    expect(screen.queryByText('Years experience')).not.toBeInTheDocument();
    expect(mockQuery).toHaveBeenCalledWith('u1', true);
  });

  it('does not query for a block of typed figures', () => {
    render(
      <StatsBlock
        config={{
          type: 'stats',
          layout: 'row',
          stats: [{ id: 'a', value: '3', label: 'Languages' }],
        }}
        userId="u1"
      />
    );
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(mockQuery).toHaveBeenCalledWith('u1', false);
  });

  it('renders nothing while live figures load', () => {
    mockQuery.mockReturnValue({ isLoading: true });
    const { container } = render(<StatsBlock config={liveStats} userId="u1" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('TestimonialBlock (US-305)', () => {
  it("shows the agent's published testimonials when it reads the profile", () => {
    render(
      <TestimonialBlock
        config={{ type: 'testimonial', source: 'profile', layout: 'grid', testimonials: [] }}
        userId="u1"
      />
    );
    expect(screen.getByText('Dana K.')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '5 out of 5 stars' })).toBeInTheDocument();
  });

  it('renders nothing for visitors when the agent has no published testimonials', () => {
    mockQuery.mockReturnValue({
      data: { facts: { ...facts, reviewCount: 0 }, testimonials: [] },
      isLoading: false,
    });
    const { container } = render(
      <TestimonialBlock
        config={{ type: 'testimonial', source: 'profile', layout: 'slider', testimonials: [] }}
        userId="u1"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('never shows a review a template invented', () => {
    const { container } = render(<TestimonialBlock config={legacyTestimonials} userId="u1" />);
    expect(container).toBeEmptyDOMElement();

    render(<TestimonialBlock config={legacyTestimonials} userId="u1" isEditing />);
    expect(screen.getByText(/1 example review from a template is hidden/)).toBeInTheDocument();
    expect(screen.queryByText(/5 days above asking/)).not.toBeInTheDocument();
  });

  it('names its slider controls', () => {
    mockQuery.mockReturnValue({
      data: {
        facts,
        testimonials: [realTestimonial, { ...realTestimonial, id: 'r2', name: 'Lee P.' }],
      },
      isLoading: false,
    });
    render(
      <TestimonialBlock
        config={{ type: 'testimonial', source: 'profile', layout: 'slider', testimonials: [] }}
        userId="u1"
      />
    );
    expect(screen.getByRole('button', { name: 'Next testimonial' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show testimonial 2 of 2' })).toBeInTheDocument();
  });
});
