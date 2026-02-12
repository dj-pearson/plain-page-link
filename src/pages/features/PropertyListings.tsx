import * as React from "react";
import { Link } from "react-router-dom";
import { Home, Image, DollarSign, MapPin, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSectionLazy } from "@/components/hero";

export default function PropertyListings() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Property Listing Galleries - AgentBio Feature",
        "description": "Showcase your real estate listings with full photo galleries, pricing, and details. Display active and sold properties with MLS compliance built-in.",
        "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "AgentBio Property Listings",
            "applicationCategory": "BusinessApplication",
            "featureList": [
                "Unlimited property listings with photo galleries",
                "Property details: price, beds/baths, square footage, MLS#",
                "Status badges: Active, Pending, Sold",
                "Virtual tour integration",
                "MLS compliance features",
                "Mobile-optimized property browsing"
            ]
        }
    };

    return (
        <>
            <SEOHead
                title="Property Listing Galleries | Showcase Real Estate on Your Bio Page"
                description="Showcase your real estate listings with full photo galleries, pricing, and details. Display active and sold properties with MLS compliance built-in."
                keywords={[
                    "property listing gallery",
                    "showcase real estate listings",
                    "link in bio with property listings",
                    "real estate portfolio page",
                    "MLS compliant listing display"
                ]}
                canonicalUrl={`${window.location.origin}/features/property-listings`}
                schema={schema}
            />
            <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
                <PublicHeader />

                {/* Direct Answer */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio's property listing galleries let real estate agents showcase unlimited properties</strong> with full photo galleries, pricing, beds/baths, square footage, MLS numbers, and property descriptions directly on their bio page. Unlike generic link-in-bio tools, each listing includes status badges (active, pending, sold), virtual tour integration, and MLS compliance features—all optimized for mobile browsing from Instagram and social media.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSectionLazy
                    title="Property Listing Galleries"
                    subtitle="Showcase Your Real Estate Portfolio Like Never Before"
                    description="Display unlimited properties with full photo galleries, pricing, and details. Turn your Instagram bio into a mobile-optimized real estate showroom."
                    primaryCta={{
                        text: "Start Showcasing Properties Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See Example Portfolios",
                        href: "/#demo-profiles"
                    }}
                    badge={{
                        icon: <Home className="h-4 w-4" aria-hidden="true" />,
                        text: "Unlimited Listings on Pro Plan"
                    }}
                    showStats={false}
                />

                {/* What You Can Display */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Everything Buyers Want to See</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Display all the property information buyers need to make a decision
                            </p>
                        </header>

                        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
                            <FeatureCard
                                icon={<Image />}
                                title="Full Photo Galleries"
                                description="Upload unlimited photos per listing. Buyers can swipe through all property images without leaving your bio page. Support for both landscape and portrait photos."
                            />

                            <FeatureCard
                                icon={<DollarSign />}
                                title="Complete Pricing Information"
                                description="Display asking price, price per square foot, estimated monthly payment. Show recent price reductions to attract buyer attention."
                            />

                            <FeatureCard
                                icon={<Home />}
                                title="Property Details"
                                description="Beds, baths, square footage, lot size, year built, HOA fees. Add custom details like pool, garage, school district, and more."
                            />

                            <FeatureCard
                                icon={<MapPin />}
                                title="Location & MLS Info"
                                description="Full address or area display. MLS number for compliance. Neighborhood information and nearby amenities."
                            />
                        </div>
                    </div>
                </section>

                {/* Active vs Sold Properties */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Active Listings + Sold Properties = Complete Portfolio</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="mb-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-light mb-4">
                                        <span className="text-green-400">Active Listings</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-light text-foreground mb-4">Showcase What's Available</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Highlight your best listings first</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Mark as "Just Listed" or "Price Reduced"</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Add virtual tour links</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Include open house dates</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="mb-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-sm font-light mb-4">
                                        <span className="text-blue-400">Sold Properties</span>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-light text-foreground mb-4">Prove Your Track Record</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Display sale prices and close dates</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Show before/after photos</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Add client success stories</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <Check className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                        <span className="glass-body">Build credibility with volume</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* MLS Compliance Built-In */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">MLS Compliance Built-In</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Stay compliant with MLS rules and Fair Housing requirements automatically
                            </p>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: "Equal Housing Logo",
                                        description: "Automatically included on all listing displays"
                                    },
                                    {
                                        title: "MLS Attribution",
                                        description: "Display MLS source and listing ID when required"
                                    },
                                    {
                                        title: "License Number",
                                        description: "Your license number appears on your profile"
                                    },
                                    {
                                        title: "Fair Housing Disclaimer",
                                        description: "Included in footer of all pages"
                                    },
                                    {
                                        title: "Status Accuracy",
                                        description: "Mark listings as Active, Pending, or Sold accurately"
                                    },
                                    {
                                        title: "Privacy Compliance",
                                        description: "GDPR and data protection standards met"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                        <h3 className="text-lg font-light text-foreground mb-2">{item.title}</h3>
                                        <p className="text-sm glass-body text-muted-foreground">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Add Listings in 3 Easy Steps</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <StepCard
                                number={1}
                                title="Upload Property Photos"
                                description="Drag and drop photos or upload from your device. Add as many photos as you want—unlimited on Pro plan."
                            />

                            <StepCard
                                number={2}
                                title="Fill in Property Details"
                                description="Add price, beds/baths, square footage, address, MLS number, and description. Takes 2 minutes per listing."
                            />

                            <StepCard
                                number={3}
                                title="Publish & Share"
                                description="Your listing appears instantly on your bio page. Share the link in Instagram Stories, posts, and DMs."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Ready to Showcase Your Listings?</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Create your professional real estate portfolio with unlimited property listings
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Start Free Trial</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • 3 free listings • Upgrade anytime
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border hover:border-[#80d0c7] transition-all">
            <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]">
                {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
            </div>
            <div>
                <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
                <p className="glass-body leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-xl font-light">
                {number}
            </div>
            <div>
                <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
                <p className="glass-body leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
