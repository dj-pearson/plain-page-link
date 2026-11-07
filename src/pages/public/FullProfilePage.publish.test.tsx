/**
 * US-265: an unpublished page renders for its owner as a preview — banner,
 * noindex, nothing counted — and a visitor gets one neutral message that does
 * not say whether the account exists.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({
  result: {} as Record<string, unknown>,
  tracked: [] as Array<string | undefined>,
}));

vi.mock('@/hooks/usePublicProfile', () => ({ usePublicProfile: () => h.result }));
vi.mock('@/hooks/useProfileTracking', () => ({
  useProfileTracking: (id: string | undefined) => {
    h.tracked.push(id);
  },
  trackLinkClick: vi.fn(),
}));
vi.mock('@/hooks/useProfileShowsBranding', () => ({ useProfileShowsBranding: () => true }));
vi.mock('@/lib/analyticsEvents', () => ({
  trackContactTap: vi.fn(),
  trackListingView: vi.fn(),
}));
vi.mock('@/components/profile/UpcomingOpenHouses', () => ({ UpcomingOpenHouses: () => null }));
vi.mock('@/components/profile/LeadCaptureCTA', () => ({ LeadCaptureCTA: () => null }));

import FullProfilePage from './FullProfilePage';

const PROFILE = {
  id: 'agent-1',
  username: 'janedoe',
  full_name: 'Jane Doe',
  bio: 'Selling homes in Austin.',
  avatar_url: null,
  theme: null,
  title: null,
  brokerage_name: null,
  brokerage_logo: null,
  years_experience: null,
  certifications: [],
  specialties: [],
  service_cities: [],
  service_zip_codes: [],
  license_number: null,
  license_state: null,
  phone: null,
  sms_enabled: false,
  email_display: null,
  calendly_url: null,
  instagram_url: null,
  facebook_url: null,
  linkedin_url: null,
  tiktok_url: null,
  youtube_url: null,
  zillow_url: null,
  realtor_com_url: null,
  website_url: null,
  seo_title: null,
  seo_description: null,
  og_image: null,
  created_at: '2026-01-01T00:00:00Z',
  is_published: true,
};

const loaded = (isPublished: boolean | null) => ({
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  data: {
    profile: { ...PROFILE, is_published: isPublished },
    listings: [],
    testimonials: [],
    links: [],
    responseHours: null,
    customPage: null,
    settings: {
      show_listings: true,
      show_sold_properties: true,
      show_testimonials: true,
      show_social_proof: true,
      show_contact_buttons: true,
    },
  },
});

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/janedoe']}>
        <Routes>
          <Route path="/:slug" element={<FullProfilePage />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>
  );

const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');

beforeEach(() => {
  h.tracked = [];
});

describe('FullProfilePage publish state', () => {
  it('renders a published page with no preview banner and counts the view', async () => {
    h.result = loaded(true);
    renderPage();
    expect(await screen.findByRole('heading', { name: /Jane Doe/, level: 1 })).toBeInTheDocument();
    expect(screen.queryByText(/only you can see this page/i)).not.toBeInTheDocument();
    expect(h.tracked).toContain('agent-1');
  });

  it('shows the owner a preview of an unpublished page: banner, noindex, no view counted', async () => {
    h.result = loaded(false);
    renderPage();
    expect(await screen.findByText(/only you can see this page/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Publish your page' })).toHaveAttribute(
      'href',
      '/dashboard/settings#publish'
    );
    await waitFor(() => expect(robots()).toMatch(/^noindex/));
    expect(h.tracked.every((id) => id === undefined)).toBe(true);
  });

  it('gives a visitor one neutral message when no published profile matches', async () => {
    h.result = {
      isLoading: false,
      data: undefined,
      refetch: vi.fn(),
      error: Object.assign(new Error('JSON object requested, multiple (or no) rows returned'), {
        code: 'PGRST116',
      }),
    };
    renderPage();
    expect(
      await screen.findByRole('heading', { name: 'This page isn’t available' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Jane Doe/)).not.toBeInTheDocument();
    await waitFor(() => expect(robots()).toBe('noindex, follow'));
  });
});
