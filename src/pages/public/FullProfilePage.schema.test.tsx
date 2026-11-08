/**
 * US-281: the public page's RealEstateAgent and LocalBusiness JSON-LD list
 * every service city in areaServed, cleaned of blanks and repeats.
 */
import { describe, it, expect, vi } from 'vitest';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { render, screen, waitFor } from '@testing-library/react';

const h = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));

vi.mock('@/hooks/usePublicProfile', () => ({ usePublicProfile: () => h.result }));
vi.mock('@/hooks/useProfileTracking', () => ({
  useProfileTracking: vi.fn(),
  trackLinkClick: vi.fn(),
}));
vi.mock('@/hooks/useProfileShowsBranding', () => ({ useProfileShowsBranding: () => true }));
vi.mock('@/hooks/useProfileCustomCss', () => ({ useProfileCustomCss: () => '' }));
vi.mock('@/lib/analyticsEvents', () => ({
  trackContactTap: vi.fn(),
  trackListingView: vi.fn(),
}));
vi.mock('@/components/profile/UpcomingOpenHouses', () => ({ UpcomingOpenHouses: () => null }));
vi.mock('@/components/profile/LeadCaptureCTA', () => ({ LeadCaptureCTA: () => null }));

import FullProfilePage from './FullProfilePage';

const profileWith = (service_cities: unknown[]) => ({
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
  service_cities,
  service_zip_codes: [],
  license_number: 'ABC123',
  license_state: 'TX',
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
});

const loaded = (service_cities: unknown[]) => ({
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  data: {
    profile: profileWith(service_cities),
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

type LdNode = Record<string, unknown>;

/** Every JSON-LD node on the page, flattened out of any @graph nesting. */
function jsonLdNodes(): LdNode[] {
  const out: LdNode[] = [];
  const walk = (n: unknown) => {
    if (!n || typeof n !== 'object') return;
    const node = n as LdNode;
    if (Array.isArray(node['@graph'])) (node['@graph'] as unknown[]).forEach(walk);
    if (node['@type']) out.push(node);
  };
  document.head
    .querySelectorAll('script[type="application/ld+json"]')
    .forEach((s) => walk(JSON.parse(s.textContent || 'null')));
  return out;
}

const nodeOfType = (type: string) => jsonLdNodes().find((n) => n['@type'] === type);

describe('FullProfilePage structured data: service area (US-281)', () => {
  it('lists every service city in areaServed on both the agent and the business', async () => {
    h.result = loaded([' Austin ', 'Round Rock', '', 'austin', 'Cedar Park']);
    renderPage();
    expect(await screen.findByRole('heading', { name: /Jane Doe/, level: 1 })).toBeInTheDocument();

    const expected = [
      { '@type': 'City', name: 'Austin' },
      { '@type': 'City', name: 'Round Rock' },
      { '@type': 'City', name: 'Cedar Park' },
    ];
    await waitFor(() => expect(nodeOfType('RealEstateAgent')?.areaServed).toEqual(expected));
    expect(nodeOfType('LocalBusiness')?.areaServed).toEqual(expected);
    expect((nodeOfType('RealEstateAgent')?.address as LdNode).addressLocality).toBe('Austin');
    expect(screen.getByText(/^Serving/)).toHaveTextContent(
      'Serving Austin, Round Rock and Cedar Park'
    );
  });

  it('omits areaServed when the agent has no service cities', async () => {
    h.result = loaded([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: /Jane Doe/, level: 1 })).toBeInTheDocument();
    await waitFor(() => expect(nodeOfType('RealEstateAgent')).toBeDefined());
    expect(nodeOfType('RealEstateAgent')).not.toHaveProperty('areaServed');
    expect(nodeOfType('LocalBusiness')).not.toHaveProperty('areaServed');
  });
});
