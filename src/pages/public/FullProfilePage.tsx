import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { FullPageLoader, ProfileSkeleton } from '@/components/LoadingSpinner';
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
import ListingDetailModal from '@/components/profile/ListingDetailModal';
import { LeadFormModal } from '@/components/profile/LeadFormModal';
import { CalendlyModal } from '@/components/integrations/CalendlyModal';
import { HomeValuationForm } from '@/components/forms/HomeValuationForm';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { QuickNav } from '@/components/profile/QuickNav';
import CustomLinks from '@/components/profile/CustomLinks';
import { useProfileTracking, trackLinkClick } from '@/hooks/useProfileTracking';
import { trackContactTap } from '@/lib/analyticsEvents';
import { usePublicProfile } from '@/hooks/usePublicProfile';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { applyTheme, getCurrentTheme, type ThemeConfig } from '@/lib/themes';
import { selectAvailableListings, selectSoldListings } from '@/lib/publicListingVisibility';
import { formatResponseTime } from '@/lib/responseTime';
import { ProfileLoadError } from '@/components/profile/ProfileLoadError';
import { parsePrice } from '@/lib/format';
import { LISTING_PARAM } from '@/lib/listingShare';
import { getImageUrl } from '@/lib/images';
import { logger } from '@/lib/logger';
import type { PublicProfileListing } from '@/types';
import NotFound from './NotFound';
import { ThreeDBackground } from '@/components/theme/ThreeDBackgroundLazy';
import { GradientMesh } from '@/components/theme/GradientMeshLazy';
import { FloatingGeometry } from '@/components/theme/FloatingGeometryLazy';

export default function FullProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTheme, setActiveTheme] = useState<ThemeConfig | null>(null);
  const [customPageSlug, setCustomPageSlug] = useState<string | null>(null);
  const [checkingCustomPage, setCheckingCustomPage] = useState(true);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  // The property a showing was requested for, if any. Kept separate from
  // selectedListing so closing the detail modal does not drop the context the
  // lead form and the Calendly header need (US-096).
  const [showingListing, setShowingListing] = useState<PublicProfileListing | null>(null);
  const [isHomeValuationModalOpen, setIsHomeValuationModalOpen] = useState(false);

  // Fetch profile and related data
  const { data, isLoading, error, refetch } = usePublicProfile(slug || '');

  /**
   * Which listing's detail modal is open, derived from ?listing=<id> rather
   * than held in state (US-114).
   *
   * The modal used to be pure component state, so it had no URL: every share
   * button sent the recipient to the top of the profile, and the JSON-LD the
   * modal injects could never be indexed because there was nothing to index it
   * against. Deriving it from the query parameter gives the modal an address,
   * makes Back close it, and makes a pasted link open the right property.
   *
   * An id that matches nothing — a deleted listing, a mangled paste — resolves
   * to null, which renders the profile rather than an error.
   */
  const selectedListingId = searchParams.get(LISTING_PARAM);
  const selectedListing =
    (selectedListingId && data?.listings?.find((l) => l.id === selectedListingId)) || null;

  /**
   * Open or close the detail modal by rewriting the query parameter.
   *
   * `replace` on close and push on open: a visitor who opened a property and
   * pressed Back expects the profile, not the page before it.
   */
  const setSelectedListing = useCallback(
    (listing: PublicProfileListing | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (listing) {
            next.set(LISTING_PARAM, listing.id);
          } else {
            next.delete(LISTING_PARAM);
          }
          return next;
        },
        { replace: !listing }
      );
    },
    [setSearchParams]
  );

  // Check if user has an active custom page
  useEffect(() => {
    const checkForCustomPage = async () => {
      if (!slug || !data?.profile?.id) {
        setCheckingCustomPage(false);
        return;
      }

      try {
        // maybeSingle + limit(1), not single().
        //
        // .single() errors with PGRST116 when there is no row AND when there is
        // more than one. The catch treated both as "no custom page", so an
        // agent with two active published pages silently kept the default
        // profile with no indication why (US-112). maybeSingle returns null for
        // none, and limit(1) makes several a defined outcome rather than an
        // error.
        const { data: customPage, error } = await supabase
          .from('custom_pages')
          .select('slug')
          .eq('user_id', data.profile.id)
          .eq('is_active', true)
          .eq('published', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && customPage) {
          setCustomPageSlug(customPage.slug);
        }
      } catch (err) {
        logger.error('Error checking for custom page', err as Error);
      } finally {
        setCheckingCustomPage(false);
      }
    };

    if (data) {
      checkForCustomPage();
    } else if (!isLoading) {
      // Profile failed to load or doesn't exist — stop spinner
      setCheckingCustomPage(false);
    }
  }, [slug, data, isLoading]);

  // Track the view — but only for a page that is actually being shown.
  //
  // An agent with a page-builder page got the full profile fetch and a view
  // recorded here, and was then redirected to /p/<slug>, which tracked nothing
  // at all. So a page-builder agent's own visits were counted against their
  // profile while the page their visitors actually saw had no analytics
  // whatever. PublicPage now records through this same hook, and this one waits
  // until the custom-page check has settled so one visit is one view (US-115).
  const shouldTrackProfileView = !checkingCustomPage && !customPageSlug;
  useProfileTracking(shouldTrackProfileView ? data?.profile?.id : undefined, slug || '');

  // Apply theme when profile loads - IMPORTANT: All hooks must be before conditional returns
  useEffect(() => {
    if (data?.profile?.theme) {
      try {
        // Check if theme is a valid JSON string or just a theme name like "default"
        if (typeof data.profile.theme === 'string') {
          // Only try to parse if it looks like JSON (starts with { or [)
          if (
            data.profile.theme.trim().startsWith('{') ||
            data.profile.theme.trim().startsWith('[')
          ) {
            const parsedTheme = JSON.parse(data.profile.theme);
            setActiveTheme(parsedTheme);
            applyTheme(data.profile.theme);
          } else {
            // A preset NAME, which is what the onboarding wizard stores. This
            // used to log "skip applying" and do nothing, so the wizard's
            // mandatory template step changed nothing on the public page
            // whichever card the agent chose (US-108). getCurrentTheme falls
            // back to 'modern' for an unknown name rather than leaving the
            // page unstyled.
            const preset = getCurrentTheme(data.profile.theme);
            setActiveTheme(preset);
            applyTheme(JSON.stringify(preset));
          }
        } else {
          // It's already an object, stringify it
          setActiveTheme(data.profile.theme as ThemeConfig);
          applyTheme(JSON.stringify(data.profile.theme));
        }
      } catch (e) {
        logger.error('Failed to apply profile theme', e as Error);
      }
    }
  }, [data]);

  // Preload featured listing images and avatar for faster rendering
  useEffect(() => {
    if (!data) return;
    const imagesToPreload: string[] = [];

    // Preload avatar
    if (data.profile?.avatar_url) {
      imagesToPreload.push(data.profile.avatar_url);
    }

    // Preload first image of each featured listing
    // No inline shapes here: data.listings is PublicProfileListing[], and the
    // hand-written annotations disagreed with it (is_featured is nullable).
    const featured = data.listings?.filter((l) => l.is_featured) || [];
    featured.slice(0, 5).forEach((listing) => {
      const imgSrc = getImageUrl(listing.image || listing.photos?.[0], 'listings');
      if (imgSrc && imgSrc !== '/placeholder-property.jpg') {
        imagesToPreload.push(imgSrc);
      }
    });

    // Preload via link tags for browser-level priority
    imagesToPreload.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    return () => {
      // Cleanup preload links on unmount
      document.querySelectorAll('link[rel="preload"][as="image"]').forEach((el) => el.remove());
    };
  }, [data]);

  /**
   * A showing request on a specific property. Routes to the agent's Calendly
   * when they have one and to the lead form otherwise, carrying the listing
   * either way — so the Calendly header names the property and the lead lands
   * in the CRM with listing_id and property_address set (US-096).
   */
  const handleRequestShowing = (listing: PublicProfileListing) => {
    setShowingListing(listing);
    setSelectedListing(null);
    if (data?.profile?.calendly_url) {
      setIsCalendlyModalOpen(true);
    } else {
      setIsLeadModalOpen(true);
    }
  };

  // Redirect to custom page if active
  if (checkingCustomPage) {
    return <FullPageLoader text="Loading profile..." />;
  }

  if (customPageSlug) {
    return <Navigate to={`/p/${customPageSlug}`} replace />;
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
    return <NotFound />;
  }

  if (!data) {
    return <NotFound />;
  }

  const { profile, listings, testimonials, links, settings } = data;

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

  // Generate SEO data with safe origin detection for SSR/crawlers
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://agentbio.net';
  const seoTitle =
    profile.seo_title || `${profile.full_name || profile.username} - Real Estate Agent`;
  const seoDescription =
    profile.seo_description ||
    profile.bio ||
    `Browse properties and connect with ${profile.full_name || profile.username}, a trusted real estate professional.`;
  const currentUrl = `${origin}/${slug}`;

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
          Array.isArray(profile.service_cities) &&
          profile.service_cities[0] &&
          profile.license_state
            ? {
                '@type': 'PostalAddress',
                addressLocality: profile.service_cities[0] as string,
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
        ...(Array.isArray(profile.service_cities) &&
          profile.service_cities.length > 0 && {
            areaServed: (profile.service_cities as string[]).map((city: string) => ({
              '@type': 'City',
              name: city,
            })),
          }),
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
        ...(Array.isArray(profile.service_cities) &&
          profile.service_cities[0] &&
          profile.license_state && {
            address: {
              '@type': 'PostalAddress',
              addressLocality: profile.service_cities[0] as string,
              addressRegion: profile.license_state,
              addressCountry: 'US',
            },
          }),
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
        isPartOf: {
          '@id': `${origin}/#website`,
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
        keywords={
          [
            profile.full_name || profile.username,
            'real estate agent',
            profile.license_state || '',
            ...(Array.isArray(profile.specialties) ? profile.specialties : []),
            ...(Array.isArray(profile.service_cities) ? profile.service_cities : []),
          ].filter(Boolean) as string[]
        }
        schema={personSchema}
      />
      {render3DBackground()}
      <QuickNav hasListings={activeListings.length > 0} hasTestimonials={testimonials.length > 0} />
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen relative"
        style={{
          backgroundColor: `hsl(var(--theme-background, 217 33% 97%))`,
          color: `hsl(var(--theme-text, 222 47% 11%))`,
        }}
      >
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-5xl relative z-10 pb-24 sm:pb-8">
          <div className="space-y-4 sm:space-y-6">
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
                onContactClick={(method) => void trackContactTap(profile.id, method)}
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
                  onViewDetails={(listing) => setSelectedListing(listing)}
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
                  onListingClick={(listing) => setSelectedListing(listing)}
                />
              </section>
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
                <SoldProperties
                  listings={listings}
                  onListingClick={(listing) => setSelectedListing(listing)}
                />
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

            {/* Custom Links */}
            {links.length > 0 && (
              <CustomLinks
                links={links}
                onLinkClick={async (link) => {
                  // trackLinkClick already calls increment_link_clicks;
                  // calling it again here counted every click twice.
                  await trackLinkClick(link.id.toString(), profile.id, link.title);
                }}
              />
            )}

            {/* Social Links */}
            <SocialLinks profile={profile} />

            {/* Compliance Footer with Equal Housing */}
            <footer className="mt-8 sm:mt-12 pt-6 sm:pt-8 pb-4 sm:pb-6 border-t border-gray-200 bg-gray-50 rounded-lg">
              <div className="text-center px-3 sm:px-4">
                {/* Equal Housing Opportunity Logo */}
                <div className="flex justify-center mb-2 sm:mb-3">
                  <svg
                    className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600"
                    viewBox="0 0 100 100"
                    fill="currentColor"
                    role="img"
                    aria-label="Equal Housing Opportunity"
                  >
                    {/* Simple Equal Housing symbol */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                    />
                    <rect
                      x="30"
                      y="20"
                      width="40"
                      height="60"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <line x1="35" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="3" />
                    <line x1="35" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth="3" />
                  </svg>
                </div>

                {/* Equal Housing Statement */}
                <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  Equal Housing Opportunity
                </p>
                <p className="text-xs text-gray-600 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed">
                  We are pledged to the letter and spirit of U.S. policy for the achievement of
                  equal housing opportunity throughout the Nation.
                </p>

                {/* License Information */}
                {profile.license_number && (
                  <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-300">
                    <p className="text-xs sm:text-sm text-gray-700 font-medium">
                      {profile.full_name || profile.username}
                      {profile.title && ` | ${profile.title}`}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {profile.brokerage_name && `${profile.brokerage_name} | `}
                      License #{profile.license_number} ({profile.license_state})
                    </p>
                  </div>
                )}

                {/* Legal Links */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 text-xs text-gray-500 mb-2 sm:mb-3">
                  <a
                    href="/terms"
                    className="hover:text-blue-600 active:text-blue-700 hover:underline min-h-[32px] flex items-center"
                  >
                    Terms of Service
                  </a>
                  <span>•</span>
                  <a
                    href="/privacy"
                    className="hover:text-blue-600 active:text-blue-700 hover:underline min-h-[32px] flex items-center"
                  >
                    Privacy Policy
                  </a>
                </div>

                {/* Copyright */}
                <p className="text-xs text-gray-500">
                  © {new Date().getFullYear()} {profile.full_name || profile.username}. All rights
                  reserved.
                </p>
                <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                  Powered by{' '}
                  <a
                    href="https://agentbio.net"
                    className="hover:text-blue-600 active:text-blue-700 hover:underline"
                    target="_blank"
                    rel="noopener"
                  >
                    AgentBio.net
                  </a>
                </p>
              </div>
            </footer>
          </div>
        </div>

        {/* Listing Detail Modal */}
        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            isOpen={!!selectedListing}
            onClose={() => setSelectedListing(null)}
            calendlyUrl={data?.profile?.calendly_url ?? undefined}
            onRequestShowing={handleRequestShowing}
          />
        )}

        {/* Lead Form Modal */}
        <LeadFormModal
          isOpen={isLeadModalOpen}
          onClose={() => {
            setIsLeadModalOpen(false);
            setShowingListing(null);
          }}
          formType="contact"
          agentId={profile.id}
          agentName={profile.full_name || profile.username}
          listing={
            showingListing ? { id: showingListing.id, address: showingListing.address } : undefined
          }
        />

        {/* Calendly Modal */}
        {profile.calendly_url && (
          <CalendlyModal
            isOpen={isCalendlyModalOpen}
            onClose={() => {
              setIsCalendlyModalOpen(false);
              setShowingListing(null);
            }}
            calendlyUrl={profile.calendly_url}
            title="Schedule a Showing"
            subtitle="Choose a time that works best for you"
            listingAddress={showingListing?.address}
          />
        )}

        {/* Home Valuation Modal */}
        <Dialog open={isHomeValuationModalOpen} onOpenChange={setIsHomeValuationModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Hidden: HomeValuationForm renders its own visible heading, but a
                dialog without a title is announced unnamed (US-112). */}
            <DialogTitle className="sr-only">Home valuation request</DialogTitle>
            <HomeValuationForm
              agentId={profile.id}
              agentName={profile.full_name || profile.username}
              onSuccess={() => setIsHomeValuationModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

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
