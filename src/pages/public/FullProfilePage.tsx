import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ProfileSkeleton } from '@/components/LoadingSpinner';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ContactButtons from '@/components/profile/ContactButtons';
import SocialLinks from '@/components/profile/SocialLinks';
import ListingGallery from '@/components/profile/ListingGallery';
import SoldProperties from '@/components/profile/SoldProperties';
import { LeadCaptureCTA } from '@/components/profile/LeadCaptureCTA';
import { TestimonialSection } from '@/components/profile/TestimonialSection';
import { ReviewInvite } from '@/components/profile/ReviewInvite';
import { SocialProofBanner } from '@/components/profile/SocialProofBanner';
import { FeaturedListingsCarousel } from '@/components/profile/FeaturedListingsCarousel';
import { StickyActionBar } from '@/components/profile/StickyActionBar';
import { QuickNav } from '@/components/profile/QuickNav';
import CustomLinks from '@/components/profile/CustomLinks';
import { UpcomingOpenHouses } from '@/components/profile/UpcomingOpenHouses';
import { useProfileTracking, trackLinkClick } from '@/hooks/useProfileTracking';
import { trackContactTap } from '@/lib/analyticsEvents';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { useProfileShowsBranding } from '@/hooks/useProfileShowsBranding';
import { useProfileCustomCss } from '@/hooks/useProfileCustomCss';
import { SEOHead } from '@/components/SEOHead';
import { PROFILE_MAIN_STYLE, useProfileTheme } from '@/hooks/useProfileTheme';
import {
  selectAvailableListings,
  reachableListingHref,
  selectSoldListings,
} from '@/lib/publicListingVisibility';
import type { ListingsBlockHref } from '@/components/pageBuilder/blocks/ListingsBlock';
import { formatResponseTime } from '@/lib/responseTime';
import { ProfileLoadError } from '@/components/profile/ProfileLoadError';
import { parsePrice } from '@/lib/format';
import { legacyListingRedirect, listingPagePath } from '@/lib/listingShare';
import {
  addImagePreload,
  FEATURED_LISTING_IMAGE_SIZES,
  PLACEHOLDER_PROPERTY_IMAGE,
  responsiveImage,
} from '@/lib/images';
import type { PublicProfileListing } from '@/types';
import { ProfileUnavailable } from '@/components/profile/ProfileUnavailable';
import { UnpublishedPreviewBanner } from '@/components/profile/UnpublishedPreviewBanner';
import { isUnpublishedPreview } from '@/lib/profilePublishing';
import { ThreeDBackground } from '@/components/theme/ThreeDBackgroundLazy';
import { GradientMesh } from '@/components/theme/GradientMeshLazy';
import { FloatingGeometry } from '@/components/theme/FloatingGeometryLazy';
import { areaServedSchema, cleanServiceCities } from '@/lib/serviceAreas';
import { getBaseUrl } from '@/config/seo.config';
import { websiteId } from '@/config/site-entities';
import { needsCanonicalRedirect, normalizeUsername } from '@/lib/username';
import { LazyLoadErrorBoundary } from '@/components/LazyLoadErrorBoundary';
import { LazyModal } from '@/components/profile/LazyModal';
import { ProfileComplianceFooter } from '@/components/profile/ProfileComplianceFooter';
import { ProfileCustomCssScope } from '@/components/profile/ProfileCustomCssScope';

// Loaded on demand (US-244). These were static imports, so every visitor to
// /:username downloaded react-hook-form, zod, DOMPurify, Radix Dialog and the
// page-builder renderer before the page could render — for forms most of them
// never open. Each modal is now mounted, and its chunk fetched, only while it
// is open; the page-builder blocks only when the agent has built a page.
// (LeadCaptureCTA lazy-loads its own copy of LeadFormModal the same way.)
const LeadFormModal = lazy(() =>
  import('@/components/profile/LeadFormModal').then((m) => ({ default: m.LeadFormModal }))
);
const CalendlyModal = lazy(() =>
  import('@/components/integrations/CalendlyModal').then((m) => ({ default: m.CalendlyModal }))
);
const HomeValuationDialog = lazy(() =>
  import('@/components/forms/HomeValuationDialog').then((m) => ({
    default: m.HomeValuationDialog,
  }))
);
const CustomBlocksSection = lazy(() =>
  import('@/components/profile/CustomBlocksSection').then((m) => ({
    default: m.CustomBlocksSection,
  }))
);

export default function FullProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [isHomeValuationModalOpen, setIsHomeValuationModalOpen] = useState(false);

  // Fetch profile and related data
  const { data, isLoading, error, refetch } = usePublicProfile(slug || '');

  // US-265: the owner previewing their unpublished page is not a visitor —
  // count no view, no listing view, nothing that would show up in Analytics.
  const isPreview = isUnpublishedPreview(data?.profile);
  const profileId = isPreview ? undefined : data?.profile?.id;

  /**
   * A listing opens its own page (US-275). It used to open a modal addressed by
   * ?listing=<id> (US-114); the page has the gallery, the open houses and a URL
   * a crawler can index, and the listing_view is counted there.
   *
   * Cards link to it with a real href (US-408) rather than navigating in a
   * click handler, so the listing pages are discoverable from the profile and
   * a visitor can open one in a new tab.
   */
  const listingHref = useCallback(
    (listing: PublicProfileListing) =>
      listingPagePath(data?.profile?.username ?? normalizeUsername(slug), listing.id),
    [data?.profile?.username, slug]
  );

  /**
   * The same page for a card in a page-builder listings block, but only when
   * that page would show the listing: a sold home while the agent hides sold
   * properties is not linked, so a visitor never taps through to "not found".
   */
  const blockListingHref = useMemo<ListingsBlockHref>(
    () => reachableListingHref(data?.profile?.username ?? normalizeUsername(slug), data?.settings),
    [data?.profile?.username, data?.settings, slug]
  );

  // One page, one view (US-115). This used to run alongside a redirect to
  // /p/<slug>, so an agent with a page-builder page had the view counted here
  // and the page their visitors actually saw tracked nothing at all. There is
  // no redirect any more (US-116): the blocks render below, on this page.
  useProfileTracking(profileId, slug || '');
  // Plans with removeBranding hide "Powered by AgentBio" (20260923000002).
  const showBranding = useProfileShowsBranding(data?.profile?.id);
  // The agent's custom CSS, sanitised and scoped (US-514); '' for none.
  const customCss = useProfileCustomCss(data?.profile?.id);

  const activeTheme = useProfileTheme(data?.profile?.theme);

  // Preload the one image that is the page's LCP candidate: the carousel's
  // first slide.
  //
  // This preloaded the avatar and the full-size original of up to five
  // featured listings - including sold ones the carousel never shows - all at
  // the same priority, so on a phone they competed with each other and with
  // the page's own scripts. And its cleanup removed every image preload in the
  // document, not just its own (US-243).
  useEffect(() => {
    if (!data || data.settings?.show_listings === false) return;

    // The same choice FeaturedListingsCarousel makes for slide 0: the first
    // featured listing among the available ones, in their display order.
    const first = selectAvailableListings(data.listings ?? []).find((l) => l.is_featured);
    if (!first) return;

    const image = responsiveImage(first.image || first.photos?.[0]);
    if (image.original === PLACEHOLDER_PROPERTY_IMAGE) return;

    return addImagePreload(image, FEATURED_LISTING_IMAGE_SIZES);
  }, [data]);

  const closeLeadModal = () => setIsLeadModalOpen(false);
  const closeCalendlyModal = () => setIsCalendlyModalOpen(false);

  // One profile, one URL. The lookup below is case-insensitive, so
  // /JaneDoe would otherwise render the same page as /janedoe at a second
  // address — splitting the view counter, the link-click attribution and
  // whatever a search engine decided to index. Send the visitor to the
  // canonical form and keep their query string and hash.
  //
  // Placed after every hook so the hook order is unconditional.
  if (needsCanonicalRedirect(slug)) {
    const query = searchParams.toString();
    const target = `/${encodeURIComponent(normalizeUsername(slug))}${query ? `?${query}` : ''}${
      typeof window === 'undefined' ? '' : window.location.hash
    }`;
    return <Navigate to={target} replace />;
  }

  // An old /:username?listing=<id> link — shared before US-275, printed on a
  // flyer — goes to the listing's page, keeping its campaign parameters.
  const legacyListingTarget = legacyListingRedirect(normalizeUsername(slug), searchParams);
  if (legacyListingTarget) {
    return <Navigate to={legacyListingTarget} replace />;
  }

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  // A missing profile is a 404. A network failure is not.
  //
  // This rendered NotFound for ANY error, so a visitor who hit a transient
  // fetch failure was told the agent does not exist — and had no way to retry
  // short of guessing that reloading might help (US-112). PGRST116 from the
  // profile query is the real "no such username"; everything else is a fault
  // worth offering a retry for.
  if (error) {
    const code = (error as { code?: string }).code;
    const message = error instanceof Error ? error.message : String(error);
    const isMissing = code === 'PGRST116' || /Profile not found/i.test(message);
    if (!isMissing) {
      return <ProfileLoadError onRetry={() => refetch()} />;
    }
    // One neutral page for "no such username" and "not published" (US-265),
    // so the response says nothing about whether an account exists.
    return <ProfileUnavailable />;
  }

  if (!data) {
    return <ProfileUnavailable />;
  }

  const { profile, listings, testimonials, links, settings, customPage } = data;

  // Active, pending and under_contract — active first. This filtered on
  // status === 'active' alone, so marking a listing Pending made it vanish
  // from the agent's public page (US-110). The rules live in
  // lib/publicListingVisibility so they can be tested.
  const activeListings = selectAvailableListings(listings as PublicProfileListing[]);
  const soldListings = selectSoldListings(listings as PublicProfileListing[]);

  // Calculate social proof stats
  const totalVolume = soldListings.reduce(
    (sum: number, listing: PublicProfileListing) => sum + parsePrice(listing.price),
    0
  );
  const averageRating =
    testimonials.length > 0
      ? testimonials.reduce((sum: number, t) => sum + (t.rating || 0), 0) / testimonials.length
      : 0;

  // The configured origin, not the visitor's host (US-595). On the *.pages.dev
  // alias the host made this page self-canonicalise as a duplicate of the
  // agent's agentbio.net page; nothing serves a profile from a custom domain,
  // so the configured origin is the only canonical address it has. The
  // crawler HTML (functions/_lib/site-origin.ts) applies the same rule.
  const origin = getBaseUrl();
  const seoTitle =
    profile.seo_title || `${profile.full_name || profile.username} - Real Estate Agent`;
  const seoDescription =
    profile.seo_description ||
    profile.bio ||
    `Browse properties and connect with ${profile.full_name || profile.username}, a trusted real estate professional.`;
  const currentUrl = `${origin}/${slug}`;

  // Every service city, cleaned once, for the address, areaServed and keywords (US-281).
  const serviceCities = cleanServiceCities(profile.service_cities);
  const areaServed = areaServedSchema(serviceCities);

  // Generate comprehensive structured data for SEO (dual schema for better coverage)
  const personSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      // RealEstateAgent schema
      {
        '@type': 'RealEstateAgent',
        '@id': `${currentUrl}#agent`,
        name: profile.full_name || profile.username,
        description: profile.bio,
        telephone: profile.phone,
        email: profile.email_display,
        image: profile.avatar_url,
        url: currentUrl,
        address:
          serviceCities[0] && profile.license_state
            ? {
                '@type': 'PostalAddress',
                addressLocality: serviceCities[0],
                addressRegion: profile.license_state,
                addressCountry: 'US',
              }
            : {
                '@type': 'PostalAddress',
                addressRegion: profile.license_state,
                addressCountry: 'US',
              },
        jobTitle: profile.title || 'Real Estate Agent',
        ...(profile.years_experience && {
          yearsInBusiness: profile.years_experience,
        }),
        ...(Array.isArray(profile.specialties) &&
          profile.specialties.length > 0 && {
            knowsAbout: profile.specialties,
          }),
        ...(areaServed && { areaServed }),
        ...(profile.brokerage_name && {
          memberOf: {
            '@type': 'Organization',
            name: profile.brokerage_name,
          },
        }),
        ...(testimonials.length > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating.toFixed(1),
            reviewCount: testimonials.length,
            bestRating: '5',
            worstRating: '1',
          },
        }),
      },
      // LocalBusiness schema for local SEO
      {
        '@type': 'LocalBusiness',
        '@id': `${currentUrl}#business`,
        name: `${profile.full_name || profile.username} - ${profile.brokerage_name || 'Real Estate Services'}`,
        description: profile.bio,
        image: profile.avatar_url,
        telephone: profile.phone,
        email: profile.email_display,
        url: currentUrl,
        ...(serviceCities[0] &&
          profile.license_state && {
            address: {
              '@type': 'PostalAddress',
              addressLocality: serviceCities[0],
              addressRegion: profile.license_state,
              addressCountry: 'US',
            },
          }),
        ...(areaServed && { areaServed }),
        priceRange: '$$',
        ...(testimonials.length > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: averageRating.toFixed(1),
            reviewCount: testimonials.length,
            bestRating: '5',
          },
        }),
        ...(soldListings.length > 0 && {
          numberOfEmployees: {
            '@type': 'QuantitativeValue',
            value: 1,
          },
        }),
      },
      // WebPage schema
      {
        '@type': 'WebPage',
        '@id': `${currentUrl}#webpage`,
        url: currentUrl,
        name: seoTitle,
        description: seoDescription,
        // The WebSite is agentbio.net itself, so its id comes from the
        // configured base URL, never the host that served this page: on a
        // preview host window.location named a WebSite node no other page
        // declares (US-380).
        isPartOf: {
          '@id': websiteId(getBaseUrl()),
        },
        about: {
          '@id': `${currentUrl}#agent`,
        },
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: profile.avatar_url,
        },
      },
      // BreadcrumbList schema
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: origin,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: profile.full_name || profile.username,
            item: currentUrl,
          },
        ],
      },
      // Individual Review schemas
      // The columns are client_name/review/date — not author/content. This map
      // was annotated with the latter, so every Review emitted
      // "Anonymous" as the author and dropped reviewBody entirely.
      ...(testimonials.length > 0
        ? testimonials.slice(0, 10).map((testimonial, index: number) => {
            const publishedOn = testimonial.date ?? testimonial.created_at;
            return {
              '@type': 'Review',
              '@id': `${currentUrl}#review-${index}`,
              itemReviewed: {
                '@id': `${currentUrl}#agent`,
              },
              author: {
                '@type': 'Person',
                name: testimonial.client_name || 'Anonymous',
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: testimonial.rating?.toString() || '5',
                bestRating: '5',
              },
              reviewBody: testimonial.review,
              ...(publishedOn && {
                datePublished: new Date(publishedOn).toISOString().split('T')[0],
              }),
            };
          })
        : []),
    ],
  };

  // Render 3D background based on theme
  const render3DBackground = () => {
    if (!activeTheme?.has3D || !activeTheme?.threeDEffect) return null;

    const primaryColor = activeTheme.colors?.primary || '#2563eb';
    const secondaryColor = activeTheme.colors?.secondary || '#10b981';

    switch (activeTheme.threeDEffect) {
      case '3d-particles':
        return <ThreeDBackground variant="particles" color={primaryColor} />;
      case '3d-mesh':
        return <GradientMesh color1={primaryColor} color2={secondaryColor} />;
      case '3d-floating':
        return <FloatingGeometry color={primaryColor} />;
      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        ogImage={profile.og_image || profile.avatar_url || undefined}
        canonicalUrl={currentUrl}
        noindex={isPreview}
        keywords={
          [
            profile.full_name || profile.username,
            'real estate agent',
            profile.license_state || '',
            ...(Array.isArray(profile.specialties) ? profile.specialties : []),
            ...serviceCities,
          ].filter(Boolean) as string[]
        }
        schema={personSchema}
      />
      {isPreview && <UnpublishedPreviewBanner />}
      {render3DBackground()}
      <QuickNav hasListings={activeListings.length > 0} hasTestimonials={testimonials.length > 0} />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen relative"
        style={PROFILE_MAIN_STYLE}
      >
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl relative z-10 pb-24 sm:pb-8">
          <div className="space-y-4 sm:space-y-6">
            {/* Everything the agent's custom CSS may style (US-514). The
                compliance footer stays outside it. */}
            <ProfileCustomCssScope css={customCss} className="space-y-4 sm:space-y-6">
              {/* Profile Header */}
              <section id="about" className="scroll-mt-16 sm:scroll-mt-20">
                <ProfileHeader
                  profile={profile}
                  stats={{
                    propertiesSold: soldListings.length,
                    averageRating: averageRating,
                    reviewCount: testimonials.length,
                    // Computed, or absent. This was the literal string
                    // '< 1 hour' for every agent (US-111).
                    responseTime: formatResponseTime(data.responseHours),
                  }}
                />
              </section>
              {/* Contact Buttons */}
              {settings?.show_contact_buttons !== false && (
                <ContactButtons
                  profile={profile}
                  // logger.info wrote this to the visitor's own console and
                  // nowhere else, so an agent never learned that thirty people
                  // tapped Call this week (US-115).
                  onContactClick={(method) => {
                    if (!isPreview) void trackContactTap(profile.id, method);
                  }}
                />
              )}

              {/* Social Proof Banner */}
              {settings?.show_social_proof !== false && (
                <div className="pt-2 sm:pt-4">
                  <SocialProofBanner
                    stats={{
                      propertiesSold: soldListings.length,
                      totalVolume: totalVolume,
                      averageRating: averageRating,
                      reviewCount: testimonials.length,
                      yearsExperience: profile.years_experience ?? undefined,
                    }}
                  />
                </div>
              )}

              {/* Featured Listings Carousel */}
              {settings?.show_listings !== false && activeListings.length > 0 && (
                <section className="pt-4 sm:pt-6">
                  <FeaturedListingsCarousel
                    listings={activeListings}
                    listingHref={listingHref}
                    autoRotate={true}
                    interval={4000}
                  />
                </section>
              )}

              {/* Active Listings */}
              {settings?.show_listings !== false && activeListings.length > 0 && (
                <section id="listings" className="pt-4 sm:pt-6 scroll-mt-16 sm:scroll-mt-20">
                  <ListingGallery
                    listings={activeListings}
                    title="All Properties"
                    listingHref={listingHref}
                  />
                </section>
              )}

              {/* Upcoming open houses. Renders nothing when there are none. */}
              {settings?.show_listings !== false && (
                <UpcomingOpenHouses
                  agentId={profile.id}
                  agentName={profile.full_name || profile.username}
                  profileUrl={currentUrl}
                  listingHref={(listingId) => {
                    const listing = activeListings.find((l) => l.id === listingId);
                    return listing ? listingHref(listing) : null;
                  }}
                />
              )}

              {/* Lead Capture CTAs */}
              <section id="contact" className="pt-4 sm:pt-8 scroll-mt-16 sm:scroll-mt-20">
                <LeadCaptureCTA
                  agentId={profile.id}
                  agentName={profile.full_name || profile.username}
                />
              </section>

              {/* Sold Properties */}
              {settings?.show_sold_properties !== false && (
                <div className="pt-2 sm:pt-4">
                  <SoldProperties listings={listings} listingHref={listingHref} />
                </div>
              )}

              {/* Testimonials.
                  Not gated on testimonials.length: the review invitation belongs
                  on a profile that has no reviews yet more than on one that has
                  plenty, and TestimonialSection already renders nothing when the
                  list is empty (US-113). */}
              {settings?.show_testimonials !== false && (
                <section id="testimonials" className="pt-4 sm:pt-8 scroll-mt-16 sm:scroll-mt-20">
                  <TestimonialSection testimonials={testimonials} />
                  <ReviewInvite
                    username={profile.username}
                    agentName={profile.full_name || profile.username}
                  />
                </section>
              )}

              {/* Anything the agent built in the page builder.
                  A section of this page, not a replacement for it: building a
                  page used to redirect /:username to /p/<slug> and take the
                  listings, testimonials, contact buttons and lead capture off
                  the public web entirely (US-116). */}
              {customPage && (
                <LazyLoadErrorBoundary fallback={null}>
                  <Suspense fallback={<div className="min-h-[200px]" aria-hidden="true" />}>
                    <CustomBlocksSection
                      blocks={customPage.blocks}
                      userId={profile.id}
                      title={customPage.title}
                      listingHref={blockListingHref}
                    />
                  </Suspense>
                </LazyLoadErrorBoundary>
              )}

              {/* Custom Links */}
              {links.length > 0 && (
                <CustomLinks
                  links={links}
                  onLinkClick={async (link) => {
                    // trackLinkClick already calls increment_link_clicks;
                    // calling it again here counted every click twice.
                    if (isPreview) return;
                    await trackLinkClick(link.id.toString(), profile.id, link.title);
                  }}
                />
              )}

              {/* Social Links */}
              <SocialLinks profile={profile} />
            </ProfileCustomCssScope>

            {/* Compliance Footer with Equal Housing */}
            <ProfileComplianceFooter profile={profile} showBranding={showBranding} />
          </div>
        </div>

        {/* Lead Form Modal */}
        {isLeadModalOpen && (
          <LazyModal onClose={closeLeadModal}>
            <LeadFormModal
              isOpen={isLeadModalOpen}
              onClose={closeLeadModal}
              formType="contact"
              agentId={profile.id}
              agentName={profile.full_name || profile.username}
            />
          </LazyModal>
        )}

        {/* Calendly Modal */}
        {profile.calendly_url && isCalendlyModalOpen && (
          <LazyModal onClose={closeCalendlyModal}>
            <CalendlyModal
              isOpen={isCalendlyModalOpen}
              onClose={closeCalendlyModal}
              calendlyUrl={profile.calendly_url}
              agentId={profile.id}
              title="Schedule a Showing"
              subtitle="Choose a time that works best for you"
            />
          </LazyModal>
        )}

        {/* Home Valuation Modal */}
        {isHomeValuationModalOpen && (
          <LazyModal onClose={() => setIsHomeValuationModalOpen(false)}>
            <HomeValuationDialog
              open={isHomeValuationModalOpen}
              onOpenChange={setIsHomeValuationModalOpen}
              agentId={profile.id}
              agentName={profile.full_name || profile.username}
            />
          </LazyModal>
        )}

        {/* Sticky Action Bar */}
        <StickyActionBar
          profile={profile}
          onScheduleShowing={() => {
            // Open Calendly modal if available, otherwise lead form
            if (profile.calendly_url) {
              setIsCalendlyModalOpen(true);
            } else {
              setIsLeadModalOpen(true);
            }
          }}
          onGetHomeValue={() => {
            // Open home valuation modal
            setIsHomeValuationModalOpen(true);
          }}
          onContactFormOpen={() => setIsLeadModalOpen(true)}
        />
      </main>
    </>
  );
}
