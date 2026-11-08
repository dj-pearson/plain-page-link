/**
 * US-275: a listing has its own page at /:username/listing/:id, and the old
 * /:username?listing=<id> links redirect to it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const h = vi.hoisted(() => ({
  result: {} as Record<string, unknown>,
  listingViews: [] as Array<[string | undefined, string, string | null | undefined]>,
  openHouseListing: [] as Array<string | undefined>,
  leadForms: [] as Array<{ formType: string; listing?: { id: string; address: string } }>,
  calendly: [] as Array<{ listingId?: string; listingAddress?: string }>,
}));

vi.mock('@/hooks/usePublicProfile', () => ({ usePublicProfile: () => h.result }));
vi.mock('@/hooks/useProfileTracking', () => ({
  useProfileTracking: vi.fn(),
  trackLinkClick: vi.fn(),
}));
vi.mock('@/hooks/useProfileShowsBranding', () => ({ useProfileShowsBranding: () => true }));
vi.mock('@/hooks/useProfileCustomCss', () => ({ useProfileCustomCss: () => '' }));
vi.mock('@/lib/analyticsEvents', () => ({
  trackContactTap: vi.fn(),
  trackListingView: (userId: string | undefined, id: string, address?: string | null) => {
    h.listingViews.push([userId, id, address]);
    return Promise.resolve();
  },
}));
vi.mock('@/components/profile/UpcomingOpenHouses', () => ({
  UpcomingOpenHouses: ({ listingId }: { listingId?: string }) => {
    h.openHouseListing.push(listingId);
    return null;
  },
}));
vi.mock('@/components/profile/LeadFormModal', () => ({
  LeadFormModal: (props: { formType: string; listing?: { id: string; address: string } }) => {
    h.leadForms.push({ formType: props.formType, listing: props.listing });
    return <div role="dialog" aria-label="Lead form" />;
  },
}));
vi.mock('@/components/integrations/CalendlyModal', () => ({
  CalendlyModal: (props: { listingId?: string; listingAddress?: string }) => {
    h.calendly.push({ listingId: props.listingId, listingAddress: props.listingAddress });
    return <div role="dialog" aria-label="Calendly" />;
  },
}));
vi.mock('@/components/profile/LeadCaptureCTA', () => ({ LeadCaptureCTA: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { trackContactTap } from '@/lib/analyticsEvents';
import ListingPage, { listingMetaDescription, MORE_LISTINGS_LIMIT } from './ListingPage';
import FullProfilePage from './FullProfilePage';
import type { PublicProfileListing } from '@/types';

const PROFILE = {
  id: 'agent-1',
  username: 'janedoe',
  full_name: 'Jane Doe',
  bio: null,
  avatar_url: null,
  theme: null,
  title: null,
  brokerage_name: 'Acme Realty',
  brokerage_logo: null,
  years_experience: null,
  certifications: [],
  specialties: [],
  service_cities: [],
  service_zip_codes: [],
  license_number: 'SA123',
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
};

const listing = (id: string, overrides: Partial<Record<string, unknown>> = {}) =>
  ({
    id,
    image: null,
    photos: [`https://example.com/${id}.jpg`],
    address: `${id} Oak Street`,
    city: 'Austin',
    state: 'TX',
    zip_code: '78701',
    price: '450000',
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800,
    status: 'active',
    sort_order: 1,
    is_featured: false,
    days_on_market: 5,
    description: 'Bright corner home near the park.',
    property_type: 'single_family',
    mls_number: null,
    lot_size_acres: null,
    virtual_tour_url: null,
    highlights: [],
    created_at: '2026-03-01T12:00:00.000Z',
    ...overrides,
  }) as unknown as PublicProfileListing;

const loaded = ({
  listings = [listing('l1'), listing('l2'), listing('l3', { status: 'sold' })],
  isPublished = true as boolean | null,
  settings = {} as Record<string, boolean>,
  profile = {} as Record<string, unknown>,
} = {}) => ({
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  data: {
    profile: { ...PROFILE, ...profile, is_published: isPublished },
    listings,
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
      ...settings,
    },
  },
});

function Where() {
  const location = useLocation();
  return <output data-testid="where">{`${location.pathname}${location.search}`}</output>;
}

const renderAt = (path: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/:username/listing/:listingId" element={<ListingPage />} />
          <Route path="/:slug" element={<FullProfilePage />} />
        </Routes>
        <Where />
      </MemoryRouter>
    </HelmetProvider>
  );

const where = () => screen.getByTestId('where').textContent;
const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content');
const canonical = () =>
  document.head.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';

beforeEach(() => {
  h.listingViews = [];
  h.openHouseListing = [];
  h.leadForms = [];
  h.calendly = [];
  vi.mocked(trackContactTap).mockClear();
});

describe('ListingPage', () => {
  it('renders the listing as a page and counts the listing view', async () => {
    h.result = loaded();
    renderAt('/janedoe/listing/l1');

    expect(
      await screen.findByRole('heading', { level: 1, name: /l1 Oak Street, Austin, TX 78701/ })
    ).toBeInTheDocument();
    expect(h.listingViews).toEqual([['agent-1', 'l1', 'l1 Oak Street']]);
    // Its own open houses, not the agent's whole calendar.
    expect(h.openHouseListing).toContain('l1');
    // The way back to the profile, and the profile's compliance footer.
    expect(screen.getByRole('link', { name: /Jane Doe/ })).toHaveAttribute('href', '/janedoe');
    expect(screen.getByText('Equal Housing Opportunity')).toBeInTheDocument();
    expect(screen.getByText(/License #SA123/)).toBeInTheDocument();
    await waitFor(() => expect(canonical()).toMatch(/\/janedoe\/listing\/l1$/));
  });

  it('lists more of the agent’s available homes, without this one or sold ones', async () => {
    h.result = loaded();
    renderAt('/janedoe/listing/l1');

    const more = await screen.findByRole('region', { name: 'More from Jane Doe' });
    expect(more).toHaveTextContent('l2 Oak Street');
    expect(more).not.toHaveTextContent('l1 Oak Street');
    expect(more).not.toHaveTextContent('l3 Oak Street');
  });

  it('caps "More from" and opens another listing on its own page', async () => {
    const user = userEvent.setup();
    h.result = loaded({
      listings: Array.from({ length: MORE_LISTINGS_LIMIT + 3 }, (_, i) => listing(`m${i}`)),
    });
    renderAt('/janedoe/listing/m0');

    const more = await screen.findByRole('region', { name: 'More from Jane Doe' });
    expect(more.querySelectorAll('h3')).toHaveLength(MORE_LISTINGS_LIMIT);

    const next = screen.getByRole('link', { name: /View listing:\s*m1 Oak Street/ });
    // A real href (US-408), so it can be opened in a new tab too.
    expect(next).toHaveAttribute('href', '/janedoe/listing/m1');
    await user.click(next);
    expect(where()).toBe('/janedoe/listing/m1');
    expect(
      await screen.findByRole('heading', { level: 1, name: /m1 Oak Street/ })
    ).toBeInTheDocument();
    expect(h.listingViews.map(([, id]) => id)).toEqual(['m0', 'm1']);
  });

  it('sends a visitor holding a link to a removed home to the agent’s listings', async () => {
    h.result = loaded();
    renderAt('/janedoe/listing/gone');

    expect(
      await screen.findByRole('heading', { name: 'This home is no longer listed' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See Jane Doe.s listings/ })).toHaveAttribute(
      'href',
      '/janedoe'
    );
    await waitFor(() => expect(robots()).toMatch(/^noindex/));
    expect(h.listingViews).toEqual([]);
  });

  it('does not show a sold home at its address when the agent hides sold properties', async () => {
    h.result = loaded({ settings: { show_sold_properties: false } });
    renderAt('/janedoe/listing/l3');
    expect(
      await screen.findByRole('heading', { name: 'This home is no longer listed' })
    ).toBeInTheDocument();
  });

  it('does not count the owner previewing an unpublished page', async () => {
    h.result = loaded({ isPublished: false });
    renderAt('/janedoe/listing/l1');
    expect(await screen.findByText(/only you can see this page/i)).toBeInTheDocument();
    await waitFor(() => expect(robots()).toMatch(/^noindex/));
    expect(h.listingViews).toEqual([]);
  });

  it('redirects a mixed-case username to the canonical listing URL', async () => {
    h.result = loaded();
    renderAt('/JaneDoe/listing/l1?utm_source=ig');
    await waitFor(() => expect(where()).toBe('/janedoe/listing/l1?utm_source=ig'));
  });
});

describe('the phone contact bar (US-361)', () => {
  const bar = async () => screen.findByRole('region', { name: 'Contact about this home' });

  it('is phone-only and keeps both actions in reach', async () => {
    h.result = loaded();
    renderAt('/janedoe/listing/l1');
    const region = await bar();
    expect(region).toHaveClass('fixed', 'bottom-0', 'sm:hidden');
    expect(within(region).getByRole('button', { name: 'Ask a question' })).toBeInTheDocument();
    expect(within(region).getByRole('button', { name: 'Request a showing' })).toBeInTheDocument();
    // No phone on the profile, no Call button.
    expect(within(region).queryByRole('link', { name: /Call/ })).toBeNull();
  });

  it('opens the lead form with this listing attached, so the lead carries listing_id', async () => {
    const user = userEvent.setup();
    h.result = loaded();
    renderAt('/janedoe/listing/l1');
    await user.click(within(await bar()).getByRole('button', { name: 'Request a showing' }));
    await screen.findByRole('dialog', { name: 'Lead form' });
    expect(h.leadForms.at(-1)?.listing).toEqual({ id: 'l1', address: 'l1 Oak Street' });
    expect(trackContactTap).toHaveBeenCalledWith('agent-1', 'schedule');
  });

  it('asks a question about this listing, not the agent in general', async () => {
    const user = userEvent.setup();
    h.result = loaded();
    renderAt('/janedoe/listing/l1');
    await user.click(within(await bar()).getByRole('button', { name: 'Ask a question' }));
    await screen.findByRole('dialog', { name: 'Lead form' });
    expect(h.leadForms.at(-1)?.listing).toEqual({ id: 'l1', address: 'l1 Oak Street' });
    expect(trackContactTap).toHaveBeenCalledWith('agent-1', 'contact');
  });

  it('books through Calendly with the listing when the agent has a link', async () => {
    const user = userEvent.setup();
    h.result = loaded({ profile: { calendly_url: 'https://calendly.com/jane' } });
    renderAt('/janedoe/listing/l1');
    await user.click(within(await bar()).getByRole('button', { name: 'Schedule a showing' }));
    await screen.findByRole('dialog', { name: 'Calendly' });
    expect(h.calendly.at(-1)).toEqual({ listingId: 'l1', listingAddress: 'l1 Oak Street' });
  });

  it('offers no showing for a sold home, only a question', async () => {
    h.result = loaded();
    renderAt('/janedoe/listing/l3');
    const region = await bar();
    expect(within(region).getByRole('button', { name: 'Ask a question' })).toBeInTheDocument();
    expect(within(region).queryByRole('button', { name: /showing/i })).toBeNull();
  });

  it('shows Call only when the agent shows contact buttons', async () => {
    const user = userEvent.setup();
    h.result = loaded({ profile: { phone: '(512) 555-0100' } });
    const { unmount } = renderAt('/janedoe/listing/l1');
    const call = within(await bar()).getByRole('link', { name: 'Call Jane Doe' });
    expect(call).toHaveAttribute('href', 'tel:5125550100');
    call.addEventListener('click', (e) => e.preventDefault());
    await user.click(call);
    expect(trackContactTap).toHaveBeenCalledWith('agent-1', 'phone');
    unmount();

    h.result = loaded({
      profile: { phone: '(512) 555-0100' },
      settings: { show_contact_buttons: false },
    });
    renderAt('/janedoe/listing/l1');
    expect(within(await bar()).queryByRole('link', { name: /Call/ })).toBeNull();
  });

  it('counts nothing while the owner previews an unpublished page', async () => {
    const user = userEvent.setup();
    h.result = loaded({ isPublished: false });
    renderAt('/janedoe/listing/l1');
    await user.click(within(await bar()).getByRole('button', { name: 'Ask a question' }));
    expect(trackContactTap).toHaveBeenCalledWith(undefined, 'contact');
  });
});

describe('the old ?listing= links (US-114)', () => {
  it('redirect from the profile to the listing page, keeping campaign parameters', async () => {
    h.result = loaded();
    renderAt('/janedoe?utm_source=ig&listing=l2');
    await waitFor(() => expect(where()).toBe('/janedoe/listing/l2?utm_source=ig'));
    expect(
      await screen.findByRole('heading', { level: 1, name: /l2 Oak Street/ })
    ).toBeInTheDocument();
  });

  it('open the listing page when a card on the profile is chosen', async () => {
    const user = userEvent.setup();
    h.result = loaded();
    renderAt('/janedoe');

    const links = await screen.findAllByRole('link', { name: /View listing:\s*l2 Oak Street/ });
    // Crawlable from the profile (US-408): every card is an <a href>.
    for (const link of links) expect(link).toHaveAttribute('href', '/janedoe/listing/l2');
    await user.click(links[0]);
    expect(where()).toBe('/janedoe/listing/l2');
  });
});

describe('listingMetaDescription', () => {
  it('uses the listing’s own description, trimmed to a snippet', () => {
    const long = 'word '.repeat(60);
    const text = listingMetaDescription(listing('x', { description: long }), 'Jane');
    expect(text.length).toBeLessThanOrEqual(155);
    expect(text.endsWith('…')).toBe(true);
  });

  it('falls back to the facts when there is no description', () => {
    expect(listingMetaDescription(listing('x', { description: null }), 'Jane Doe')).toBe(
      'x Oak Street, Austin, TX — 3 bed, 2 bath, 1,800 sq ft. Listed by Jane Doe.'
    );
  });
});
