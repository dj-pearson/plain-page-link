import { useState } from "react";
import { useParams } from "react-router-dom";
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
import type { Profile, Listing, LinkStackLink } from "@/types";
import type { Testimonial } from "@/types/testimonial";

// Mock data for demonstration
const mockProfile: Profile = {
    id: 1,
    user_id: 1,
    slug: "sarah-johnson-realtor",
    display_name: "Sarah Johnson",
    title: "Realtor® | Luxury Home Specialist",
    bio: "With over 10 years of experience in the luxury real estate market, I've helped hundreds of families find their dream homes. Specializing in waterfront properties and high-end estates, I bring market expertise, negotiation skills, and a personal touch to every transaction.\n\nLet's make your real estate goals a reality!",
    profile_photo: null,
    license_number: "CA-DRE-123456",
    license_state: "CA",
    brokerage_name: "Luxury Homes Realty",
    brokerage_logo: null,
    years_experience: 10,
    specialties: [
        "Luxury Homes",
        "Waterfront Properties",
        "First-Time Buyers",
        "Investment Properties",
    ],
    certifications: ["SRES", "GRI", "CRS"],
    service_cities: ["San Diego", "La Jolla", "Del Mar"],
    service_zip_codes: ["92037", "92014", "92075"],
    phone: "(619) 555-1234",
    sms_enabled: true,
    email_display: "sarah@luxuryhomesrealty.com",
    instagram_url: "https://instagram.com/sarahjohnsonrealtor",
    facebook_url: "https://facebook.com/sarahjohnsonrealtor",
    linkedin_url: "https://linkedin.com/in/sarahjohnsonrealtor",
    tiktok_url: null,
    youtube_url: null,
    zillow_url: "https://zillow.com/profile/sarahjohnson",
    realtor_com_url: null,
    website_url: "https://sarahjohnsonhomes.com",
    is_published: true,
    theme_id: "modern-clean",
    custom_css: null,
    seo_title: "Sarah Johnson - Luxury Real Estate Agent in San Diego",
    seo_description:
        "Find your dream home with Sarah Johnson, a top luxury real estate agent in San Diego specializing in waterfront properties.",
    view_count: 1234,
    lead_count: 45,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2025-10-30T00:00:00Z",
};

const mockListings: Listing[] = [
    {
        id: 1,
        profile_id: 1,
        address_street: "1234 Ocean View Drive",
        address_city: "La Jolla",
        address_state: "CA",
        address_zip: "92037",
        address_full: "1234 Ocean View Drive, La Jolla, CA 92037",
        latitude: 32.8328,
        longitude: -117.2713,
        price: 4500000,
        original_price: null,
        bedrooms: 5,
        bathrooms: 4.5,
        square_feet: 4200,
        lot_size_acres: 0.5,
        property_type: "single_family",
        year_built: 2018,
        title: "Stunning Ocean View Estate",
        description:
            "Breathtaking ocean views from this modern luxury estate. Features include gourmet kitchen, infinity pool, home theater, and smart home technology throughout.",
        highlights: [
            "Ocean views",
            "Infinity pool",
            "Smart home",
            "Home theater",
        ],
        status: "active",
        listed_date: "2025-10-01",
        sold_date: null,
        days_on_market: 29,
        mls_number: "ML123456",
        mls_source: "SDMLS",
        primary_photo: null,
        photos: [],
        virtual_tour_url: null,
        video_url: null,
        open_house_date: "2025-11-02T14:00:00Z",
        open_house_end_date: "2025-11-02T16:00:00Z",
        sort_order: 0,
        is_featured: true,
        created_at: "2025-10-01T00:00:00Z",
        updated_at: "2025-10-30T00:00:00Z",
    },
    {
        id: 2,
        profile_id: 1,
        address_street: "5678 Coastal Lane",
        address_city: "Del Mar",
        address_state: "CA",
        address_zip: "92014",
        address_full: "5678 Coastal Lane, Del Mar, CA 92014",
        latitude: 32.9595,
        longitude: -117.2654,
        price: 3200000,
        original_price: null,
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 3500,
        lot_size_acres: 0.35,
        property_type: "single_family",
        year_built: 2020,
        title: "Modern Coastal Living",
        description:
            "Contemporary design meets California coastal living. Open floor plan, designer finishes, and steps to the beach.",
        highlights: [],
        status: "active",
        listed_date: "2025-09-15",
        sold_date: null,
        days_on_market: 45,
        mls_number: "ML123457",
        mls_source: "SDMLS",
        primary_photo: null,
        photos: [],
        virtual_tour_url: null,
        video_url: null,
        open_house_date: null,
        open_house_end_date: null,
        sort_order: 1,
        is_featured: false,
        created_at: "2025-09-15T00:00:00Z",
        updated_at: "2025-10-30T00:00:00Z",
    },
    {
        id: 3,
        profile_id: 1,
        address_street: "9012 Sunset Boulevard",
        address_city: "San Diego",
        address_state: "CA",
        address_zip: "92101",
        address_full: "9012 Sunset Boulevard, San Diego, CA 92101",
        latitude: 32.7157,
        longitude: -117.1611,
        price: 2800000,
        original_price: 2950000,
        bedrooms: 4,
        bathrooms: 3,
        square_feet: 3200,
        lot_size_acres: 0.25,
        property_type: "single_family",
        year_built: 2015,
        title: null,
        description:
            "Beautiful family home in prime location. Recently updated with modern amenities.",
        highlights: [],
        status: "sold",
        listed_date: "2025-08-01",
        sold_date: "2025-09-20",
        days_on_market: 50,
        mls_number: "ML123458",
        mls_source: "SDMLS",
        primary_photo: null,
        photos: [],
        virtual_tour_url: null,
        video_url: null,
        open_house_date: null,
        open_house_end_date: null,
        sort_order: 2,
        is_featured: false,
        created_at: "2025-08-01T00:00:00Z",
        updated_at: "2025-09-20T00:00:00Z",
    },
];

// Mock LinkStack links
const mockLinks: LinkStackLink[] = [
    {
        id: 1,
        user_id: 1,
        link: "https://example.com/market-report",
        title: "Download Free Market Report",
        type: "link",
        type_params: null,
        button_id: 1,
        custom_icon: "fa-solid fa-download",
        custom_css: "",
        order: 0,
        up_link: "yes",
        click_number: 45,
        created_at: "2025-10-01T00:00:00Z",
        updated_at: "2025-10-30T00:00:00Z",
    },
    {
        id: 2,
        user_id: 1,
        link: null,
        title: "Connect With Me",
        type: "heading",
        type_params: null,
        button_id: null,
        custom_icon: "",
        custom_css: "",
        order: 1,
        up_link: "yes",
        click_number: 0,
        created_at: "2025-10-01T00:00:00Z",
        updated_at: "2025-10-30T00:00:00Z",
    },
    {
        id: 3,
        user_id: 1,
        link: "https://instagram.com/sarahjohnsonrealtor",
        title: "Instagram",
        type: "predefined",
        type_params: { service_name: "instagram", username: "sarahjohnsonrealtor" },
        button_id: null,
        custom_icon: "fa-brands fa-instagram",
        custom_css: "",
        order: 2,
        up_link: "yes",
        click_number: 123,
        created_at: "2025-10-01T00:00:00Z",
        updated_at: "2025-10-30T00:00:00Z",
    },
    {
        id: 4,
        user_id: 1,
        link: "tel:+16195551234",
        title: "Call or Text Me",
        type: "telephone",
        type_params: { phone_number: "+16195551234", country_code: "+1" },
        button_id: null,
        custom_icon: "fa-solid fa-phone",
        custom_css: "",
        order: 3,
        up_link: "yes",
        click_number: 67,
        created_at: "2025-10-01T00:00:00Z",
        updated_at: "2025-10-30T00:00:00Z",
    },
];

const mockTestimonials: Testimonial[] = [
    {
        id: 1,
        profile_id: 1,
        client_name: "Michael & Jennifer Chen",
        client_photo: null,
        client_title: "First-Time Homebuyers",
        rating: 5,
        review_text:
            "Sarah made our first home buying experience absolutely seamless! She was patient, knowledgeable, and went above and beyond to find us the perfect home within our budget. We couldn't have asked for a better agent!",
        property_type: "Single Family Home",
        transaction_type: "buyer",
        date: "2025-09-15",
        is_featured: true,
        sort_order: 0,
        created_at: "2025-09-20T00:00:00Z",
        updated_at: "2025-09-20T00:00:00Z",
    },
    {
        id: 2,
        profile_id: 1,
        client_name: "Robert Thompson",
        client_photo: null,
        client_title: "Luxury Home Seller",
        rating: 5,
        review_text:
            "Working with Sarah to sell my waterfront property was a pleasure. She priced it perfectly, marketed it beautifully, and we had multiple offers within days. Her negotiation skills got me $200k over asking!",
        property_type: "Waterfront Estate",
        transaction_type: "seller",
        date: "2025-08-22",
        is_featured: true,
        sort_order: 1,
        created_at: "2025-08-25T00:00:00Z",
        updated_at: "2025-08-25T00:00:00Z",
    },
    {
        id: 3,
        profile_id: 1,
        client_name: "Amanda Rodriguez",
        client_photo: null,
        client_title: "Investment Property Buyer",
        rating: 5,
        review_text:
            "As an out-of-state investor, I needed someone I could trust completely. Sarah exceeded all expectations - from property research to coordinating inspections remotely. She's now my go-to agent for all San Diego investments!",
        property_type: "Multi-Family",
        transaction_type: "buyer",
        date: "2025-07-10",
        is_featured: false,
        sort_order: 2,
        created_at: "2025-07-15T00:00:00Z",
        updated_at: "2025-07-15T00:00:00Z",
    },
    {
        id: 4,
        profile_id: 1,
        client_name: "David & Lisa Martinez",
        client_photo: null,
        client_title: "Downsizing to Condo",
        rating: 5,
        review_text:
            "After 30 years in our family home, the thought of selling was overwhelming. Sarah handled everything with such care and professionalism. She helped us find the perfect condo and made the transition stress-free.",
        property_type: "Condo",
        transaction_type: "buyer",
        date: "2025-06-05",
        is_featured: false,
        sort_order: 3,
        created_at: "2025-06-10T00:00:00Z",
        updated_at: "2025-06-10T00:00:00Z",
    },
    {
        id: 5,
        profile_id: 1,
        client_name: "Emily Watson",
        client_photo: null,
        client_title: "Relocating Family",
        rating: 5,
        review_text:
            "Moving from New York to San Diego with two kids was daunting, but Sarah made it easy. She learned exactly what we needed, showed us great neighborhoods, and found our dream home before we even arrived!",
        property_type: "Single Family Home",
        transaction_type: "buyer",
        date: "2025-05-18",
        is_featured: false,
        sort_order: 4,
        created_at: "2025-05-20T00:00:00Z",
        updated_at: "2025-05-20T00:00:00Z",
    },
];

export default function FullProfilePage() {
    const { slug } = useParams<{ slug: string }>();
    const [selectedListing, setSelectedListing] = useState<Listing | null>(
        null
    );

    // In real app, fetch profile and listings based on slug
    const profile = mockProfile;
    const listings = mockListings;
    const testimonials = mockTestimonials;
    const activeListings = listings.filter((l) => l.status === "active");
    const soldListings = listings.filter((l) => l.status === "sold");

    // Calculate social proof stats
    const totalVolume = soldListings.reduce(
        (sum, listing) => sum + listing.price,
        0
    );
    const averageRating =
        testimonials.length > 0
            ? testimonials.reduce((sum, t) => sum + t.rating, 0) /
              testimonials.length
            : 0;

    return (
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
                            agentId={profile.id.toString()}
                            agentName={profile.display_name}
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
                    <LinkStackBlocks
                        links={mockLinks}
                        onLinkClick={(link) => {
                            // Track click analytics
                            console.log("Link clicked:", link);
                        }}
                    />

                    {/* Social Links */}
                    <SocialLinks profile={profile} />

                    {/* Footer */}
                    <div className="text-center py-8 text-sm text-gray-500">
                        <p>
                            © 2025 {profile.display_name}. All rights reserved.
                        </p>
                        <p className="mt-2">
                            Powered by{" "}
                            <a
                                href="https://agentbio.net"
                                className="text-blue-600 hover:text-blue-700"
                            >
                                AgentBio.net
                            </a>
                        </p>
                    </div>
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
    );
}
