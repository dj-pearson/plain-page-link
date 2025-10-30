import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { FullPageLoader } from "@/components/LoadingSpinner";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ContactButtons from "@/components/profile/ContactButtons";
import SocialLinks from "@/components/profile/SocialLinks";
import ListingGallery from "@/components/profile/ListingGallery";
import SoldProperties from "@/components/profile/SoldProperties";
import { LeadCaptureCTA } from "@/components/profile/LeadCaptureCTA";
import { TestimonialSection } from "@/components/profile/TestimonialSection";
import { SocialProofBanner } from "@/components/profile/SocialProofBanner";
import ListingDetailModal from "@/components/profile/ListingDetailModal";
import LinkStackBlocks from "@/components/profile/LinkStackBlocks";
import { useProfileTracking, trackLinkClick } from "@/hooks/useProfileTracking";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { applyTheme } from "@/lib/themes";
import type { Listing } from "@/types";

export default function FullProfilePage() {
    const { slug } = useParams<{ slug: string }>();
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    // Fetch profile and related data
    const { data, isLoading, error } = usePublicProfile(slug || '');

    // Apply theme when profile loads
    useEffect(() => {
        if (data?.profile?.theme) {
            try {
                const theme = typeof data.profile.theme === 'string' 
                    ? JSON.parse(data.profile.theme) 
                    : data.profile.theme;
                applyTheme(theme);
            } catch (e) {
                console.error('Failed to apply profile theme:', e);
            }
        }
    }, [data]);

    if (isLoading) {
        return <FullPageLoader text="Loading profile..." />;
    }

    if (error || !data) {
        return <Navigate to="/404" replace />;
    }

    const { profile, listings, testimonials, links } = data;

    // Track profile view analytics
    useProfileTracking(profile.id, slug || "");
    const activeListings = listings.filter((l: any) => l.status === "active");
    const soldListings = listings.filter((l: any) => l.status === "sold");

    // Calculate social proof stats
    const totalVolume = soldListings.reduce(
        (sum: number, listing: any) => sum + (listing.price || 0),
        0
    );
    const averageRating =
        testimonials.length > 0
            ? testimonials.reduce((sum: number, t: any) => sum + (t.rating || 0), 0) /
              testimonials.length
            : 0;

    // Generate SEO data
    const seoTitle = profile.seo_title || `${profile.full_name || profile.username} - Real Estate Agent`;
    const seoDescription = profile.seo_description || profile.bio || `Browse properties and connect with ${profile.full_name || profile.username}, a trusted real estate professional.`;
    const currentUrl = `${window.location.origin}/${slug}`;
    
    // Generate structured data for SEO
    const personSchema = {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": profile.full_name || profile.username,
        "description": profile.bio,
        "telephone": profile.phone,
        "email": profile.email_display,
        "image": profile.avatar_url,
        "address": {
            "@type": "PostalAddress",
            "addressRegion": profile.license_state
        },
        "jobTitle": profile.title,
        "aggregateRating": testimonials.length > 0 ? {
            "@type": "AggregateRating",
            "ratingValue": averageRating,
            "reviewCount": testimonials.length
        } : undefined
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="space-y-6">
                    {/* Profile Header */}
                    <ProfileHeader profile={profile} />

                    {/* Contact Buttons */}
                    <ContactButtons
                        profile={profile}
                        onContactClick={(method) =>
                            console.log("Contact clicked:", method)
                        }
                    />

                    {/* Social Proof Banner */}
                    <div className="pt-4">
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

                    {/* Active Listings */}
                    {activeListings.length > 0 && (
                        <div className="pt-4">
                            <ListingGallery
                                listings={activeListings}
                                title="Featured Properties"
                                onListingClick={(listing) =>
                                    setSelectedListing(listing)
                                }
                            />
                        </div>
                    )}

                    {/* Lead Capture CTAs */}
                    <div className="pt-8">
                        <LeadCaptureCTA
                            agentId={profile.id}
                            agentName={profile.full_name || profile.username}
                        />
                    </div>

                    {/* Sold Properties */}
                    <div className="pt-4">
                        <SoldProperties
                            listings={listings}
                            onListingClick={(listing) =>
                                setSelectedListing(listing)
                            }
                        />
                    </div>

                    {/* Testimonials */}
                    {testimonials.length > 0 && (
                        <div className="pt-8">
                            <TestimonialSection testimonials={testimonials} />
                        </div>
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
                    <footer className="mt-12 pt-8 pb-6 border-t border-gray-200 bg-gray-50 rounded-lg">
                        <div className="text-center">
                            {/* Equal Housing Opportunity Logo */}
                            <div className="flex justify-center mb-3">
                                <svg
                                    className="h-10 w-10 text-blue-600"
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
                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                Equal Housing Opportunity
                            </p>
                            <p className="text-xs text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed px-4">
                                We are pledged to the letter and spirit of U.S. policy for the achievement of equal housing opportunity throughout the Nation.
                            </p>

                            {/* License Information */}
                            {profile.license_number && (
                                <div className="mb-4 pb-4 border-b border-gray-300">
                                    <p className="text-xs text-gray-700 font-medium">
                                        {profile.display_name}
                                        {profile.title && ` | ${profile.title}`}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {profile.brokerage_name && `${profile.brokerage_name} | `}
                                        License #{profile.license_number} ({profile.license_state})
                                    </p>
                                </div>
                            )}

                            {/* Legal Links */}
                            <div className="flex flex-wrap justify-center gap-3 text-xs text-gray-500 mb-3">
                                <a href="/terms" className="hover:text-blue-600 hover:underline">
                                    Terms of Service
                                </a>
                                <span>•</span>
                                <a href="/privacy" className="hover:text-blue-600 hover:underline">
                                    Privacy Policy
                                </a>
                            </div>

                            {/* Copyright */}
                            <p className="text-xs text-gray-500">
                                © {new Date().getFullYear()} {profile.display_name}. All rights reserved.
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Powered by{" "}
                                <a
                                    href="https://agentbio.net"
                                    className="hover:text-blue-600 hover:underline"
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
                />
            )}
        </div>
        </>
    );
}
