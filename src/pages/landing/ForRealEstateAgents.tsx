import * as React from "react";
import { Link } from "react-router-dom";
import { Home, Users, Calendar, Star, TrendingUp, Check, X } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSectionLazy } from "@/components/hero";
import { generateEnhancedOrganizationSchema } from "@/lib/seo";

export default function ForRealEstateAgents() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            // Add Organization schema with social signals
            generateEnhancedOrganizationSchema(),
            {
                "@type": "WebPage",
                "@id": `${window.location.origin}/for-real-estate-agents`,
                "url": `${window.location.origin}/for-real-estate-agents`,
                "name": "Link in Bio Built for Real Estate Agents | AgentBio",
                "description": "AgentBio is a specialized link-in-bio platform for real estate agents that includes property listings, lead forms, and calendar booking—features not found in generic tools like Linktree.",
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Why do real estate agents need a specialized link-in-bio tool?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Generic link-in-bio tools like Linktree can't showcase property listings with photos and pricing, don't have lead capture forms specific to real estate, and lack features like appointment booking for showings. Real estate agents need a platform built for their specific workflow and lead generation needs."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What features does AgentBio include for real estate agents?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio includes property listing galleries with photos and pricing, buyer and seller lead capture forms, calendar integration for showing appointments, testimonial display, sold properties showcase, MLS compliance features, and real estate-specific analytics."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Link in Bio Built for Real Estate Agents | AgentBio"
                description="AgentBio is a specialized link-in-bio platform for real estate agents that includes property listings, lead forms, and calendar booking—features not found in generic tools like Linktree."
                keywords={[
                    "link in bio for real estate agents",
                    "real estate link in bio tool",
                    "agent bio page platform",
                    "realtor link in bio",
                    "real estate Instagram bio link"
                ]}
                canonicalUrl={`${window.location.origin}/for-real-estate-agents`}
                schema={schema}
            />
            <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
                <PublicHeader />

                {/* Direct Answer Section */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio is a specialized link-in-bio platform for real estate agents</strong> that includes property listing galleries, lead capture forms, calendar booking, and testimonials—features not found in generic tools like Linktree. Real estate professionals use AgentBio to convert Instagram and social media followers into qualified buyer and seller leads through a mobile-optimized portfolio page.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSectionLazy
                    title="Link in Bio Built for Real Estate Agents"
                    subtitle="Everything Generic Tools Are Missing for Converting Social Media Traffic"
                    description="AgentBio isn't just another link tool—it's a complete real estate portfolio designed specifically for agents who need more than basic link organization."
                    primaryCta={{
                        text: "Create Your Agent Bio Page Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See Pricing",
                        href: "/pricing"
                    }}
                    badge={{
                        icon: <Home className="h-4 w-4" aria-hidden="true" />,
                        text: "Built for Real Estate Professionals"
                    }}
                    showStats={false}
                />

                {/* Why Generic Link-in-Bio Tools Fail for Realtors */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Why Generic Link-in-Bio Tools Fail for Realtors</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Linktree, Beacons, and other generic platforms weren't built for real estate. Here's what you're missing...
                            </p>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="flex items-start gap-4 mb-4">
                                        <X className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-light text-foreground mb-2">No Property Showcase</h3>
                                            <p className="glass-body">
                                                Generic tools can't display property listings with photos, pricing, beds/baths, and MLS details. You're limited to basic links that don't convert.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="flex items-start gap-4 mb-4">
                                        <X className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-light text-foreground mb-2">Basic Lead Capture</h3>
                                            <p className="glass-body">
                                                Generic contact forms don't qualify leads. No buyer vs seller differentiation, no pre-qualification questions, no home valuation requests.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="flex items-start gap-4 mb-4">
                                        <X className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-light text-foreground mb-2">No Appointment Booking</h3>
                                            <p className="glass-body">
                                                Without integrated calendar booking, you're playing phone tag with interested buyers instead of letting them self-schedule showings.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="flex items-start gap-4 mb-4">
                                        <X className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                                        <div>
                                            <h3 className="text-xl font-light text-foreground mb-2">No Social Proof</h3>
                                            <p className="glass-body">
                                                Can't showcase testimonials, sold properties, or client reviews—missing crucial trust signals that convert followers into clients.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AgentBio Features Real Estate Professionals Need */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">AgentBio Features Real Estate Professionals Need</span>
                            </h2>
                        </header>

                        <div className="max-w-5xl mx-auto space-y-8">
                            <FeatureCard
                                icon={<Home />}
                                title="Property Listing Galleries"
                                description="Display active and sold listings with full photo galleries, pricing, square footage, beds/baths, MLS numbers, and property descriptions. Add virtual tour links and mark properties as active, pending, or sold."
                            />

                            <FeatureCard
                                icon={<Users />}
                                title="Lead Capture & Qualification"
                                description="Built-in forms for buyer inquiries, seller leads, and home valuation requests. Pre-qualification questions help you prioritize hot leads. Email notifications sent instantly when leads submit."
                            />

                            <FeatureCard
                                icon={<Calendar />}
                                title="Appointment Booking"
                                description="Integrated Calendly and Google Calendar support. Buyers can self-schedule showing appointments without phone tag. Time zone detection for out-of-area buyers."
                            />

                            <FeatureCard
                                icon={<Star />}
                                title="Testimonial Showcase"
                                description="Display client reviews and success stories prominently. Add video testimonials for maximum social proof. Show 5-star ratings to build immediate credibility with new visitors."
                            />

                            <FeatureCard
                                icon={<TrendingUp />}
                                title="Real Estate Analytics"
                                description="Track which listings get the most views, where leads come from (Instagram Story vs Post), and which properties generate inquiries. Lead scoring shows hot/warm/cold prospects."
                            />
                        </div>
                    </div>
                </section>

                {/* Comparison Table */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">AgentBio vs Generic Link Tools</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-glass-border">
                                        <th className="text-left p-4 glass-body font-light">Feature</th>
                                        <th className="text-center p-4 glass-body font-light">AgentBio</th>
                                        <th className="text-center p-4 glass-body font-light">Linktree</th>
                                        <th className="text-center p-4 glass-body font-light">Beacons</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feature: "Property Listing Galleries", agentbio: true, linktree: false, beacons: false },
                                        { feature: "Lead Capture Forms", agentbio: true, linktree: "Basic", beacons: "Basic" },
                                        { feature: "Calendar Booking", agentbio: true, linktree: "Limited", beacons: "Limited" },
                                        { feature: "Testimonials Display", agentbio: true, linktree: false, beacons: false },
                                        { feature: "Real Estate Analytics", agentbio: true, linktree: false, beacons: false },
                                        { feature: "Sold Properties Showcase", agentbio: true, linktree: false, beacons: false },
                                        { feature: "MLS Compliance", agentbio: true, linktree: false, beacons: false },
                                        { feature: "Price (monthly)", agentbio: "$39", linktree: "$24", beacons: "$10" },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b border-glass-border/50">
                                            <td className="p-4 glass-body">{row.feature}</td>
                                            <td className="text-center p-4">
                                                {typeof row.agentbio === 'boolean' ? (
                                                    row.agentbio ? <Check className="h-5 w-5 text-green-400 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />
                                                ) : (
                                                    <span className="glass-body">{row.agentbio}</span>
                                                )}
                                            </td>
                                            <td className="text-center p-4">
                                                {typeof row.linktree === 'boolean' ? (
                                                    row.linktree ? <Check className="h-5 w-5 text-green-400 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />
                                                ) : (
                                                    <span className="glass-body text-muted-foreground">{row.linktree}</span>
                                                )}
                                            </td>
                                            <td className="text-center p-4">
                                                {typeof row.beacons === 'boolean' ? (
                                                    row.beacons ? <Check className="h-5 w-5 text-green-400 mx-auto" /> : <X className="h-5 w-5 text-red-400 mx-auto" />
                                                ) : (
                                                    <span className="glass-body text-muted-foreground">{row.beacons}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Ready to Upgrade from Generic Links?</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Join 5,000+ real estate agents using AgentBio to convert social media traffic into qualified leads
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Create Your Agent Bio Page Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Setup in 5 minutes
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
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
