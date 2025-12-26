import { useState, useEffect, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { FullPageLoader } from "@/components/LoadingSpinner";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ContactButtons from "@/components/profile/ContactButtons";
import SocialLinks from "@/components/profile/SocialLinks";
import ListingGallery from "@/components/profile/ListingGallery";
import SoldProperties from "@/components/profile/SoldProperties";
import { LeadCaptureCTA } from "@/components/profile/LeadCaptureCTA";
import { TestimonialSection } from "@/components/profile/TestimonialSection";
import { SocialProofBanner } from "@/components/profile/SocialProofBanner";
import { FeaturedListingsCarousel } from "@/components/profile/FeaturedListingsCarousel";
import { StickyActionBar } from "@/components/profile/StickyActionBar";
import ListingDetailModal from "@/components/profile/ListingDetailModal";
import { LeadFormModal } from "@/components/profile/LeadFormModal";
import { CalendlyModal } from "@/components/integrations/CalendlyModal";
import { HomeValuationForm } from "@/components/forms/HomeValuationForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QuickNav } from "@/components/profile/QuickNav";
import LinkStackBlocks from "@/components/profile/LinkStackBlocks";
import { useProfileTracking, trackLinkClick } from "@/hooks/useProfileTracking";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { applyTheme, type ThemeConfig } from "@/lib/themes";
import { parsePrice } from "@/lib/format";
import type { Listing } from "@/types";
import NotFound from "./NotFound";
import { ThreeDBackground } from "@/components/theme/ThreeDBackgroundLazy";
import { GradientMesh } from "@/components/theme/GradientMeshLazy";
import { FloatingGeometry } from "@/components/theme/FloatingGeometryLazy";

export default function FullProfilePage() {
    const { slug } = useParams<{ slug: string }>();
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
    const [activeTheme, setActiveTheme] = useState<ThemeConfig | null>(null);
    const [customPageSlug, setCustomPageSlug] = useState<string | null>(null);
    const [checkingCustomPage, setCheckingCustomPage] = useState(true);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
    const [isHomeValuationModalOpen, setIsHomeValuationModalOpen] = useState(false);

    // Fetch profile and related data
    const { data, isLoading, error } = usePublicProfile(slug || '');

    // Check if user has an active custom page
    useEffect(() => {
        const checkForCustomPage = async () => {
            if (!slug || !data?.profile?.id) {
                setCheckingCustomPage(false);
                return;
            }

            try {
                const { data: customPage, error } = await supabase
                    .from('custom_pages')
                    .select('slug')
                    .eq('user_id', data.profile.id)
                    .eq('is_active', true)
                    .eq('published', true)
                    .single();

                if (!error && customPage) {
                    setCustomPageSlug(customPage.slug);
                }
            } catch (err) {
                console.error('Error checking for custom page:', err);
            } finally {
                setCheckingCustomPage(false);
            }
        };

        if (data) {
            checkForCustomPage();
        }
    }, [slug, data]);

    // Track profile view analytics - must be called before any conditional returns
    // We pass the profile.id only when data is available
    useProfileTracking(data?.profile?.id, slug || "");

    // Apply theme when profile loads - IMPORTANT: All hooks must be before conditional returns
    useEffect(() => {
        if (data?.profile?.theme) {
            try {
                // Check if theme is a valid JSON string or just a theme name like "default"
                if (typeof data.profile.theme === 'string') {
                    // Only try to parse if it looks like JSON (starts with { or [)
                    if (data.profile.theme.trim().startsWith('{') || data.profile.theme.trim().startsWith('[')) {
                        const parsedTheme = JSON.parse(data.profile.theme);
                        setActiveTheme(parsedTheme);
                        applyTheme(data.profile.theme);
                    } else {
                        // It's just a theme name like "default", skip applying
                        console.log('[Theme] Using theme preset:', data.profile.theme);
                    }
                } else {
                    // It's already an object, stringify it
                    setActiveTheme(data.profile.theme as ThemeConfig);
                    applyTheme(JSON.stringify(data.profile.theme));
                }
            } catch (e) {
                console.error('Failed to apply profile theme:', e);
            }
        }
    }, [data]);

    // Redirect to custom page if active
    if (checkingCustomPage) {
        return <FullPageLoader text="Loading profile..." />;
    }

    if (customPageSlug) {
        return <Navigate to={`/p/${customPageSlug}`} replace />;
    }

    if (isLoading) {
        return <FullPageLoader text="Loading profile..." />;
    }

    if (error || !data) {
        return <NotFound />;
    }

    const { profile, listings, testimonials, links, settings } = data;

    const activeListings = listings.filter((l: any) => l.status === "active");
    const soldListings = listings.filter((l: any) => l.status === "sold");

    // Calculate social proof stats
    const totalVolume = soldListings.reduce(
        (sum: number, listing: any) => sum + parsePrice(listing.price),
        0
    );
    const averageRating =
        testimonials.length > 0
            ? testimonials.reduce((sum: number, t: any) => sum + (t.rating || 0), 0) /
              testimonials.length
            : 0;

    // Generate SEO data with safe origin detection for SSR/crawlers
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://agentbio.net';
    const seoTitle = profile.seo_title || `${profile.full_name || profile.username} - Real Estate Agent`;
    const seoDescription = profile.seo_description || profile.bio || `Browse properties and connect with ${profile.full_name || profile.username}, a trusted real estate professional.`;
    const currentUrl = `${origin}/${slug}`;

    // Generate comprehensive structured data for SEO (dual schema for better coverage)
    const personSchema = {
        "@context": "https://schema.org",
        "@graph": [
            // RealEstateAgent schema
            {
                "@type": "RealEstateAgent",
                "@id": `${currentUrl}#agent`,
                "name": profile.full_name || profile.username,
                "description": profile.bio,
                "telephone": profile.phone,
                "email": profile.email_display,
                "image": profile.avatar_url,
                "url": currentUrl,
                "address": profile.city && profile.license_state ? {
                    "@type": "PostalAddress",
                    "addressLocality": profile.city,
                    "addressRegion": profile.license_state,
                    "addressCountry": "US"
                } : {
                    "@type": "PostalAddress",
                    "addressRegion": profile.license_state,
                    "addressCountry": "US"
                },
                "jobTitle": profile.title || "Real Estate Agent",
                ...(profile.years_experience && {
                    "yearsInBusiness": profile.years_experience
                }),
                ...(profile.specialties && profile.specialties.length > 0 && {
                    "knowsAbout": profile.specialties
                }),
                ...(profile.service_cities && profile.service_cities.length > 0 && {
                    "areaServed": profile.service_cities.map((city: string) => ({
                        "@type": "City",
                        "name": city
                    }))
                }),
                ...(profile.brokerage_name && {
                    "memberOf": {
                        "@type": "Organization",
                        "name": profile.brokerage_name
                    }
                }),
                ...(testimonials.length > 0 && {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": averageRating.toFixed(1),
                        "reviewCount": testimonials.length,
                        "bestRating": "5",
                        "worstRating": "1"
                    }
                })
            },
            // LocalBusiness schema for local SEO
            {
                "@type": "LocalBusiness",
                "@id": `${currentUrl}#business`,
                "name": `${profile.full_name || profile.username} - ${profile.brokerage_name || 'Real Estate Services'}`,
                "description": profile.bio,
                "image": profile.avatar_url,
                "telephone": profile.phone,
                "email": profile.email_display,
                "url": currentUrl,
                ...(profile.city && profile.license_state && {
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": profile.city,
                        "addressRegion": profile.license_state,
                        "addressCountry": "US"
                    }
                }),
                "priceRange": "$$",
                ...(testimonials.length > 0 && {
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": averageRating.toFixed(1),
                        "reviewCount": testimonials.length,
                        "bestRating": "5"
                    }
                }),
                ...(soldListings.length > 0 && {
                    "numberOfEmployees": {
                        "@type": "QuantitativeValue",
                        "value": 1
                    }
                })
            },
            // WebPage schema
            {
                "@type": "WebPage",
                "@id": `${currentUrl}#webpage`,
                "url": currentUrl,
                "name": seoTitle,
                "description": seoDescription,
                "isPartOf": {
                    "@id": `${origin}/#website`
                },
                "about": {
                    "@id": `${currentUrl}#agent`
                },
                "primaryImageOfPage": {
                    "@type": "ImageObject",
                    "url": profile.avatar_url
                }
            },
            // BreadcrumbList schema
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": origin
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": profile.full_name || profile.username,
                        "item": currentUrl
                    }
                ]
            },
            // Individual Review schemas
            ...(testimonials.length > 0 ? testimonials.slice(0, 10).map((testimonial: any, index: number) => ({
                "@type": "Review",
                "@id": `${currentUrl}#review-${index}`,
                "itemReviewed": {
                    "@id": `${currentUrl}#agent`
                },
                "author": {
                    "@type": "Person",
                    "name": testimonial.author || "Anonymous"
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": testimonial.rating?.toString() || "5",
                    "bestRating": "5"
                },
                "reviewBody": testimonial.content,
                ...(testimonial.created_at && {
                    "datePublished": new Date(testimonial.created_at).toISOString().split('T')[0]
                })
            })) : [])
        ]
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
                ogImage={profile.og_image || profile.avatar_url}
                canonicalUrl={currentUrl}
                keywords={[
                    profile.full_name || profile.username,
                    "real estate agent",
                    profile.license_state || "",
                    ...(profile.specialties || []),
                    ...(profile.service_cities || [])
                ].filter(Boolean)}
                schema={personSchema}
            />
            {render3DBackground()}
            <QuickNav
                hasListings={activeListings.length > 0}
                hasTestimonials={testimonials.length > 0}
            />
            <div className="min-h-screen relative"
                 style={{
                     backgroundColor: `hsl(var(--theme-background, 217 33% 97%))`,
                     color: `hsl(var(--theme-text, 222 47% 11%))`
                 }}>
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
                                responseTime: '< 1 hour',
                            }}
                        />
                    </section>
                    {/* Contact Buttons */}
                    {settings?.show_contact_buttons !== false && (
                        <ContactButtons
                            profile={profile}
                            onContactClick={(method) =>
                                console.log("Contact clicked:", method)
                            }
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
                                    yearsExperience: profile.years_experience,
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
                                onListingClick={(listing) =>
                                    setSelectedListing(listing)
                                }
                                calendlyUrl={data?.profile?.calendly_url}
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
                                onListingClick={(listing) =>
                                    setSelectedListing(listing)
                                }
                            />
                        </div>
                    )}

                    {/* Testimonials */}
                    {settings?.show_testimonials !== false && testimonials.length > 0 && (
                        <section id="testimonials" className="pt-4 sm:pt-8 scroll-mt-16 sm:scroll-mt-20">
                            <TestimonialSection testimonials={testimonials} />
                        </section>
                    )}

                    {/* Custom LinkStack Blocks */}
                    {links.length > 0 && (
                        <LinkStackBlocks
                            links={links as any}
                            onLinkClick={async (link: any) => {
                                // Track link click analytics
                                trackLinkClick(link.id.toString());
                                // Increment click count
                                await supabase.rpc('increment_link_clicks', {
                                    link_id: link.id
                                });
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
                                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="3" fill="none" />
                                    <rect x="30" y="20" width="40" height="60" fill="none" stroke="currentColor" strokeWidth="3" />
                                    <line x1="35" y1="45" x2="65" y2="45" stroke="currentColor" strokeWidth="3" />
                                    <line x1="35" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth="3" />
                                </svg>
                            </div>

                            {/* Equal Housing Statement */}
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                                Equal Housing Opportunity
                            </p>
                            <p className="text-xs text-gray-600 mb-3 sm:mb-4 max-w-2xl mx-auto leading-relaxed">
                                We are pledged to the letter and spirit of U.S. policy for the achievement of equal housing opportunity throughout the Nation.
                            </p>

                            {/* License Information */}
                            {profile.license_number && (
                                <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-300">
                                    <p className="text-xs sm:text-sm text-gray-700 font-medium">
                                        {profile.display_name}
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
                                <a href="/terms" className="hover:text-blue-600 active:text-blue-700 hover:underline min-h-[32px] flex items-center">
                                    Terms of Service
                                </a>
                                <span>•</span>
                                <a href="/privacy" className="hover:text-blue-600 active:text-blue-700 hover:underline min-h-[32px] flex items-center">
                                    Privacy Policy
                                </a>
                            </div>

                            {/* Copyright */}
                            <p className="text-xs text-gray-500">
                                © {new Date().getFullYear()} {profile.display_name}. All rights reserved.
                            </p>
                            <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                                Powered by{" "}
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
                    calendlyUrl={data?.profile?.calendly_url}
                />
            )}

            {/* Lead Form Modal */}
            <LeadFormModal
                isOpen={isLeadModalOpen}
                onClose={() => setIsLeadModalOpen(false)}
                formType="contact"
                agentId={profile.id}
                agentName={profile.full_name || profile.username}
            />

            {/* Calendly Modal */}
            {profile.calendly_url && (
                <CalendlyModal
                    isOpen={isCalendlyModalOpen}
                    onClose={() => setIsCalendlyModalOpen(false)}
                    calendlyUrl={profile.calendly_url}
                    title="Schedule a Showing"
                    subtitle="Choose a time that works best for you"
                />
            )}

            {/* Home Valuation Modal */}
            <Dialog open={isHomeValuationModalOpen} onOpenChange={setIsHomeValuationModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
        </div>
        </>
    );
}
