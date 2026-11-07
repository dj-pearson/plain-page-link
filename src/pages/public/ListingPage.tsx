/**
 * One listing on an agent's public profile: /:username/listing/:listingId
 * (US-275, first slice of US-141's listing pages).
 *
 * Until now a listing was a modal over the profile, addressed by ?listing=<id>
 * (US-114). A modal is not a page: a crawler could not index it, a sitemap
 * could not list it, and a share preview described the agent rather than the
 * home. This is the page — the photos and facts the modal had, the home's own
 * open houses, more of the agent's listings, and the same compliance footer as
 * the profile. The old ?listing= links redirect here (FullProfilePage).
 *
 * It reads the profile query, not a listing query: arriving from the profile
 * costs no round trip, and arriving cold costs the one read the profile makes
 * (ProfileRoute starts it while this chunk downloads).
 */
import { lazy, useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ProfileSkeleton } from '@/components/LoadingSpinner';
import ListingDetails, { listingPhotos } from '@/components/profile/ListingDetails';
import ListingCard from '@/components/profile/ListingCard';
import { UpcomingOpenHouses } from '@/components/profile/UpcomingOpenHouses';
import { ProfileComplianceFooter } from '@/components/profile/ProfileComplianceFooter';
import { ProfileLoadError } from '@/components/profile/ProfileLoadError';
import { ProfileUnavailable } from '@/components/profile/ProfileUnavailable';
import { UnpublishedPreviewBanner } from '@/components/profile/UnpublishedPreviewBanner';
import { LazyModal } from '@/components/profile/LazyModal';
import {
  ListingContactBar,
  LISTING_CONTACT_BAR_SPACER,
} from '@/components/profile/ListingContactBar';
import { SEOHead } from '@/components/SEOHead';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useProfileShowsBranding } from '@/hooks/useProfileShowsBranding';
import { PROFILE_MAIN_STYLE, useProfileTheme } from '@/hooks/useProfileTheme';
import { trackListingView } from '@/lib/analyticsEvents';
import { formatPrice, parsePrice } from '@/lib/format';
import { listingPagePath } from '@/lib/listingShare';
import { isUnpublishedPreview } from '@/lib/profilePublishing';
import { selectAvailableListings, selectListingForPage } from '@/lib/publicListingVisibility';
import { realEstateListingSchema } from '@/lib/structured-data';
import { needsCanonicalRedirect, normalizeUsername } from '@/lib/username';
import { getSafeOrigin } from '@/lib/utils';
import type { PublicProfileListing } from '@/types';

// Mounted, and fetched, only while open (US-244).
const LeadFormModal = lazy(() =>
  import('@/components/profile/LeadFormModal').then((m) => ({ default: m.LeadFormModal }))
);
const CalendlyModal = lazy(() =>
  import('@/components/integrations/CalendlyModal').then((m) => ({ default: m.CalendlyModal }))
);

/** How many of the agent's other listings "More from" shows. */
export const MORE_LISTINGS_LIMIT = 6;

/** A meta description: the listing's own text if it has some, else its facts. */
export function listingMetaDescription(listing: PublicProfileListing, agentName: string): string {
  const own = (listing.description ?? '').replace(/\s+/g, ' ').trim();
  if (own) return own.length > 155 ? `${own.slice(0, 154).trimEnd()}…` : own;
  const facts = [
    listing.bedrooms ? `${listing.bedrooms} bed` : null,
    listing.bathrooms ? `${listing.bathrooms} bath` : null,
    listing.square_feet ? `${listing.square_feet.toLocaleString('en-US')} sq ft` : null,
  ].filter(Boolean);
  const place = [listing.address, listing.city, listing.state].filter(Boolean).join(', ');
  return `${place}${facts.length ? ` — ${facts.join(', ')}` : ''}. Listed by ${agentName}.`;
}

export default function ListingPage() {
  const { username: rawUsername, listingId } = useParams<{
    username: string;
    listingId: string;
  }>();
  const location = useLocation();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);

  const username = normalizeUsername(rawUsername);
  const { data, isLoading, error, refetch } = usePublicProfile(username);
  const showBranding = useProfileShowsBranding(data?.profile?.id);
  useProfileTheme(data?.profile?.theme);

  const listing = data ? selectListingForPage(data.listings ?? [], listingId, data.settings) : null;

  // US-265: the owner previewing an unpublished page is not a visitor.
  const isPreview = isUnpublishedPreview(data?.profile);
  const profileId = isPreview ? undefined : data?.profile?.id;

  // US-227: a listing opened is a funnel stage; US-274 dedupes repeats.
  useEffect(() => {
    if (profileId && listing) {
      void trackListingView(profileId, listing.id, listing.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, listing?.id]);

  // Moving to another listing from "More from" starts at the top of it.
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      try {
        window.scrollTo({ top: 0 });
      } catch {
        /* jsdom */
      }
    }
  }, [listingId]);

  // One listing, one URL: /JaneDoe/listing/x becomes /janedoe/listing/x.
  if (needsCanonicalRedirect(rawUsername) && listingId) {
    return <Navigate to={`${listingPagePath(username, listingId)}${location.search}`} replace />;
  }

  if (isLoading) return <ProfileSkeleton />;

  if (error) {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : String(error);
    const isMissing = code === 'PGRST116' || /Profile not found/i.test(message);
    return isMissing ? <ProfileUnavailable /> : <ProfileLoadError onRetry={() => refetch()} />;
  }

  if (!data) return <ProfileUnavailable />;

  const { profile } = data;
  const agentName = profile.full_name || profile.username;
  const profilePath = `/${encodeURIComponent(profile.username)}`;
  const origin = getSafeOrigin();
  const profileUrl = `${origin}${profilePath}`;

  // Sold and withdrawn homes come off a profile; an old link to one should land
  // somewhere useful rather than on an error.
  if (!listing) {
    return (
      <>
        <SEOHead
          title={`Listing not available | ${agentName}`}
          description={`See ${agentName}'s current listings.`}
          canonicalUrl={profileUrl}
          noindex
        />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-h-screen flex items-center justify-center px-4"
          style={PROFILE_MAIN_STYLE}
        >
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-semibold">This home is no longer listed</h1>
            <p className="mt-3 text-base opacity-80">
              It may have sold or been taken off the market. {agentName} may have something similar.
            </p>
            <Link
              to={profilePath}
              className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              See {agentName}&rsquo;s listings
            </Link>
          </div>
        </main>
      </>
    );
  }

  const price = parsePrice(listing.price);
  const photos = listingPhotos(listing);
  const pageUrl = `${origin}${listingPagePath(profile.username, listing.id)}`;
  const place = [listing.address, listing.city].filter(Boolean).join(', ');
  const title = `${place || 'Property'}${price > 0 ? ` — ${formatPrice(price)}` : ''} | ${agentName}`;
  const description = listingMetaDescription(listing, agentName);

  const { '@context': _context, ...listingNode } = realEstateListingSchema({
    title: place || 'Property listing',
    description: listing.description ?? undefined,
    price: price || undefined,
    address: listing.address,
    city: listing.city,
    state: listing.state ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    squareFeet: listing.square_feet ?? undefined,
    images: photos,
    url: pageUrl,
    status: listing.status ?? undefined,
  }) as Record<string, unknown>;
  void _context;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { ...listingNode, '@id': `${pageUrl}#listing` },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin },
          { '@type': 'ListItem', position: 2, name: agentName, item: profileUrl },
          { '@type': 'ListItem', position: 3, name: place || 'Listing', item: pageUrl },
        ],
      },
    ],
  };

  const moreListings = selectAvailableListings(data.listings ?? [])
    .filter((l) => l.id !== listing.id)
    .slice(0, MORE_LISTINGS_LIMIT);

  // Every enquiry from this page is about this home, so the lead reaches the
  // CRM with listing_id and property_address set (US-096).
  const requestShowing = () => {
    if (profile.calendly_url) setIsCalendlyModalOpen(true);
    else setIsLeadModalOpen(true);
  };
  const closeLeadModal = () => setIsLeadModalOpen(false);
  const canRequestShowing = listing.status !== 'sold';
  // Call follows the agent's own "show contact buttons" choice, as on the profile.
  const contactPhone = data.settings?.show_contact_buttons !== false ? profile.phone : null;

  return (
    <>
      <SEOHead
        title={title}
        description={description}
        ogImage={photos[0] || profile.og_image || profile.avatar_url || undefined}
        ogType="product"
        canonicalUrl={pageUrl}
        noindex={isPreview}
        schema={schema}
      />
      {isPreview && <UnpublishedPreviewBanner />}
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen relative"
        style={PROFILE_MAIN_STYLE}
      >
        <div
          className={`container mx-auto max-w-5xl px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 ${LISTING_CONTACT_BAR_SPACER}`}
        >
          {/* Who listed it, and the way back to everything else they list. */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3">
            <Link
              to={profilePath}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg pr-3 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              )}
              <span>
                {agentName}
                {profile.brokerage_name && (
                  <span className="hidden sm:inline font-normal opacity-75">
                    {' '}
                    · {profile.brokerage_name}
                  </span>
                )}
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(true)}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Ask about this home
            </button>
          </nav>

          <ListingDetails
            listing={listing}
            calendlyUrl={profile.calendly_url ?? undefined}
            onRequestShowing={requestShowing}
          />

          {/* This home's own open houses. Renders nothing when there are none. */}
          <UpcomingOpenHouses
            agentId={profile.id}
            agentName={agentName}
            profileUrl={pageUrl}
            listingId={listing.id}
          />

          {moreListings.length > 0 && (
            <section aria-labelledby="more-listings-heading">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="more-listings-heading" className="text-xl sm:text-2xl font-bold">
                  More from {agentName}
                </h2>
                <Link to={`${profilePath}#listings`} className="text-sm font-medium underline">
                  See all
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {moreListings.map((other) => (
                  <ListingCard
                    key={other.id}
                    listing={other}
                    href={listingPagePath(username, other.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <ProfileComplianceFooter profile={profile} showBranding={showBranding} />
        </div>

        {/* US-361: on a phone the Showing button is below the fold; this keeps
            asking about and seeing the home one tap away while scrolling. */}
        <ListingContactBar
          profileId={profileId}
          agentName={agentName}
          phone={contactPhone}
          onAsk={() => setIsLeadModalOpen(true)}
          onRequestShowing={canRequestShowing ? requestShowing : undefined}
          hasCalendly={Boolean(profile.calendly_url)}
        />

        {isLeadModalOpen && (
          <LazyModal onClose={closeLeadModal}>
            <LeadFormModal
              isOpen={isLeadModalOpen}
              onClose={closeLeadModal}
              formType="contact"
              agentId={profile.id}
              agentName={agentName}
              listing={{ id: listing.id, address: listing.address }}
            />
          </LazyModal>
        )}

        {profile.calendly_url && isCalendlyModalOpen && (
          <LazyModal onClose={() => setIsCalendlyModalOpen(false)}>
            <CalendlyModal
              isOpen={isCalendlyModalOpen}
              onClose={() => setIsCalendlyModalOpen(false)}
              calendlyUrl={profile.calendly_url}
              agentId={profile.id}
              title="Schedule a Showing"
              subtitle="Choose a time that works best for you"
              listingAddress={listing.address}
              listingId={listing.id}
            />
          </LazyModal>
        )}
      </main>
    </>
  );
}
