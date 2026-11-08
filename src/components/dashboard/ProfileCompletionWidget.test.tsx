import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileCompletionWidget } from './ProfileCompletionWidget';

const state = vi.hoisted(() => ({ profile: null as Record<string, unknown> | null }));

vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ profile: state.profile }) }));
vi.mock('@/hooks/useListings', () => ({ useListings: () => ({ listings: [{ id: 'l1' }] }) }));
vi.mock('@/hooks/useTestimonials', () => ({
  useTestimonials: () => ({ testimonials: [{ id: 't1' }] }),
}));
vi.mock('@/hooks/useLinks', () => ({ useLinks: () => ({ links: [{ id: 'k1' }] }) }));

const finished = {
  avatar_url: 'https://cdn.example.com/a.jpg',
  bio: 'x'.repeat(60),
  phone: '555-0100',
  email_display: null,
  theme: 'modern',
  brokerage_logo: 'https://cdn.example.com/logo.png',
  service_cities: ['Austin'],
  service_zip_codes: [],
  is_published: true,
};

const renderWidget = () =>
  render(
    <MemoryRouter>
      <ProfileCompletionWidget />
    </MemoryRouter>
  );

describe('ProfileCompletionWidget', () => {
  beforeEach(() => {
    state.profile = null;
  });

  it('hides once everything, publishing included, is done', () => {
    state.profile = finished;
    const { container } = renderWidget();
    expect(container).toBeEmptyDOMElement();
  });

  it('stays up and points at publishing while the page is unpublished', () => {
    state.profile = { ...finished, is_published: false };
    renderWidget();
    expect(screen.getByText('90% complete - 9 of 10 steps done')).toBeInTheDocument();
    expect(screen.getByText('Next: Publish your page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Complete this step →' })).toHaveAttribute(
      'href',
      '/dashboard/settings#publish'
    );
  });

  it('counts a missing logo and missing service areas', () => {
    state.profile = { ...finished, brokerage_logo: null, service_cities: [] };
    renderWidget();
    expect(screen.getByText('80% complete - 8 of 10 steps done')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Add service areas/ })).toHaveAttribute(
      'href',
      '/dashboard/profile?tab=service'
    );
  });
});
