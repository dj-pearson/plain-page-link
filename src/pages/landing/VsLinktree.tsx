import * as React from "react";
import { Link } from "react-router-dom";
import { Check, X, Home, DollarSign, BarChart3 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSectionLazy } from "@/components/hero";
import { generateEnhancedOrganizationSchema } from "@/lib/seo";

export default function VsLinktree() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            // Enhanced Organization schema with social signals
            generateEnhancedOrganizationSchema(),
            {
                "@type": "WebPage",
                "@id": `${window.location.origin}/vs/linktree`,
                "url": `${window.location.origin}/vs/linktree`,
                "name": "AgentBio vs Linktree for Real Estate Agents: Which is Better?",
                "description": "Compare AgentBio and Linktree for real estate agents. AgentBio includes property listings, lead capture, and calendar booking—features Linktree doesn't offer.",
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What's the difference between AgentBio and Linktree for real estate agents?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio includes property listing galleries with photos and pricing, real estate-specific lead capture forms, calendar booking for showings, testimonials display, and MLS compliance features. Linktree only offers basic link organization without these real estate features."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is AgentBio better than Linktree for realtors?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, for real estate professionals. AgentBio is purpose-built for agents with features like property galleries, buyer/seller lead forms, and showing appointment booking. Linktree is a generic link tool that wasn't designed for real estate workflows."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="AgentBio vs Linktree for Real Estate Agents: Which is Better?"
                description="Compare AgentBio and Linktree for real estate agents. AgentBio includes property listings, lead capture, and calendar booking—features Linktree doesn't offer."
                keywords={[
                    "AgentBio vs Linktree",
                    "Linktree for real estate agents",
                    "best Linktree alternative realtors",
                    "real estate link in bio tool",
                    "Linktree vs real estate bio page"
                ]}
                canonicalUrl={`${window.location.origin}/vs/linktree`}
                schema={schema}
            />
            <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
                <PublicHeader />

                {/* Direct Answer Section */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio is better than Linktree for real estate agents</strong> because it includes property listing galleries with photos and pricing, real estate-specific lead capture forms, calendar booking for showing appointments, testimonials display, and MLS compliance features—capabilities that generic link-in-bio tools like Linktree simply don't offer. Linktree works for general link organization, but AgentBio is purpose-built for converting Instagram followers into qualified buyer and seller leads.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSectionLazy
                    title="AgentBio vs Linktree for Real Estate Agents"
                    subtitle="Why 2,000+ Agents Switched from Linktree to AgentBio"
                    description="Linktree wasn't designed for real estate. AgentBio was. Discover the features real estate professionals need that generic link tools can't provide."
                    primaryCta={{
                        text: "Try AgentBio Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "View Pricing",
                        href: "/pricing"
                    }}
                    badge={{
                        icon: <Home className="h-4 w-4" aria-hidden="true" />,
                        text: "Purpose-Built for Real Estate"
                    }}
                    showStats={false}
                />

                {/* Feature Comparison Table */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Feature Comparison: AgentBio vs Linktree for Realtors</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Side-by-side comparison of features that matter to real estate professionals
                            </p>
                        </header>

                        <div className="max-w-5xl mx-auto overflow-x-auto">
                            <table className="w-full border-collapse bg-glass-background backdrop-blur-md rounded-xl overflow-hidden">
                                <thead>
                                    <tr className="border-b border-glass-border">
                                        <th className="text-left p-6 glass-body font-light text-lg">Feature</th>
                                        <th className="text-center p-6 glass-body font-light text-lg">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-[#80d0c7]">AgentBio</span>
                                                <span className="text-sm text-muted-foreground">Real Estate Platform</span>
                                            </div>
                                        </th>
                                        <th className="text-center p-6 glass-body font-light text-lg">
                                            <div className="flex flex-col items-center gap-2">
                                                <span>Linktree</span>
                                                <span className="text-sm text-muted-foreground">Generic Link Tool</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        {
                                            feature: "Property Listing Galleries",
                                            agentbio: true,
                                            linktree: false,
                                            description: "Display properties with photos, pricing, beds/baths, MLS numbers"
                                        },
                                        {
                                            feature: "Lead Capture Forms",
                                            agentbio: "Buyer, Seller, Home Valuation",
                                            linktree: "Basic contact only",
                                            description: "Specialized forms to qualify leads by type"
                                        },
                                        {
                                            feature: "Calendar Booking",
                                            agentbio: "Full Integration",
                                            linktree: "External link only",
                                            description: "Integrated Calendly/Google Calendar for showing appointments"
                                        },
                                        {
                                            feature: "Testimonials Display",
                                            agentbio: true,
                                            linktree: false,
                                            description: "Showcase client reviews and success stories"
                                        },
                                        {
                                            feature: "Sold Properties Showcase",
                                            agentbio: true,
                                            linktree: false,
                                            description: "Display past sales as social proof"
                                        },
                                        {
                                            feature: "Real Estate Analytics",
                                            agentbio: true,
                                            linktree: false,
                                            description: "Track which listings get most views and generate leads"
                                        },
                                        {
                                            feature: "Lead Scoring",
                                            agentbio: "Hot/Warm/Cold",
                                            linktree: false,
                                            description: "Prioritize leads based on engagement"
                                        },
                                        {
                                            feature: "MLS Compliance",
                                            agentbio: true,
                                            linktree: false,
                                            description: "Equal Housing logo, license number display"
                                        },
                                        {
                                            feature: "Virtual Tour Integration",
                                            agentbio: true,
                                            linktree: false,
                                            description: "Embed Matterport and 3D tours"
                                        },
                                        {
                                            feature: "Mobile Optimization",
                                            agentbio: "Real estate focused",
                                            linktree: "Generic",
                                            description: "Optimized for property browsing on mobile"
                                        },
                                        {
                                            feature: "QR Code Generation",
                                            agentbio: true,
                                            linktree: true,
                                            description: "Create QR codes for yard signs and marketing"
                                        },
                                        {
                                            feature: "Custom Branding",
                                            agentbio: "Full customization",
                                            linktree: "Limited",
                                            description: "Match your brokerage or personal brand"
                                        },
                                        {
                                            feature: "Price (Monthly)",
                                            agentbio: "$39",
                                            linktree: "$24 (Pro)",
                                            description: "Professional plan pricing"
                                        },
                                    ].map((row, i) => (
                                        <tr key={i} className="border-b border-glass-border/50 hover:bg-glass-background/50 transition-colors">
                                            <td className="p-6">
                                                <div>
                                                    <p className="glass-body font-light text-foreground">{row.feature}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">{row.description}</p>
                                                </div>
                                            </td>
                                            <td className="text-center p-6">
                                                {typeof row.agentbio === 'boolean' ? (
                                                    row.agentbio ?
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Check className="h-6 w-6 text-green-400" />
                                                            <span className="text-sm glass-body text-green-400">Yes</span>
                                                        </div>
                                                        :
                                                        <div className="flex items-center justify-center gap-2">
                                                            <X className="h-6 w-6 text-red-400" />
                                                            <span className="text-sm glass-body text-red-400">No</span>
                                                        </div>
                                                ) : (
                                                    <span className="glass-body font-light text-[#80d0c7]">{row.agentbio}</span>
                                                )}
                                            </td>
                                            <td className="text-center p-6">
                                                {typeof row.linktree === 'boolean' ? (
                                                    row.linktree ?
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Check className="h-6 w-6 text-green-400" />
                                                            <span className="text-sm glass-body text-green-400">Yes</span>
                                                        </div>
                                                        :
                                                        <div className="flex items-center justify-center gap-2">
                                                            <X className="h-6 w-6 text-red-400" />
                                                            <span className="text-sm glass-body text-red-400">No</span>
                                                        </div>
                                                ) : (
                                                    <span className="glass-body text-muted-foreground">{row.linktree}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Why Real Estate Agents Switch from Linktree to AgentBio */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Why Real Estate Agents Switch from Linktree to AgentBio</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                            <ReasonCard
                                icon={<Home />}
                                title="Can't Showcase Property Listings"
                                description="Linktree can't display property galleries with photos, pricing, and details. You're limited to external links that send visitors away from your profile, creating friction in the buying process."
                            />

                            <ReasonCard
                                icon={<Home />}
                                title="No Lead Capture Forms"
                                description="Linktree's contact forms don't differentiate buyers from sellers or ask pre-qualification questions. AgentBio's forms are built specifically for real estate lead generation."
                            />

                            <ReasonCard
                                icon={<Home />}
                                title="No Real Estate-Specific Features"
                                description="MLS compliance, sold properties showcase, testimonials, and virtual tour integration are all missing from generic link tools. AgentBio includes everything real estate agents need."
                            />

                            <ReasonCard
                                icon={<DollarSign />}
                                title="Better ROI on Pricing"
                                description="AgentBio costs $39/month vs Linktree Pro at $24/month. But one extra lead per month from AgentBio's specialized features pays for the difference 50x over."
                            />
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">What Real Estate Agents Say About Switching</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                            <TestimonialCard
                                quote="I was using Linktree for 2 years and getting maybe 1-2 leads per month from Instagram. Switched to AgentBio and now I'm getting 8-10 qualified inquiries. The property galleries make all the difference."
                                author="Sarah M."
                                role="Luxury Agent, Austin TX"
                            />

                            <TestimonialCard
                                quote="Linktree was fine for organizing links, but it didn't help me convert Instagram followers into actual buyers. AgentBio's lead forms and showing appointment booking changed everything for my social media strategy."
                                author="Mike R."
                                role="Team Leader, Miami FL"
                            />
                        </div>
                    </div>
                </section>

                {/* When Linktree Makes Sense (and When It Doesn't) */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">When Linktree Makes Sense (and When It Doesn't)</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-green-500/20">
                                    <h3 className="text-xl font-light text-green-400 mb-4">✓ Linktree Works If You...</h3>
                                    <ul className="space-y-3">
                                        <li className="glass-body">• Just need to organize social media links</li>
                                        <li className="glass-body">• Don't sell products or services directly</li>
                                        <li className="glass-body">• Are an influencer or content creator</li>
                                        <li className="glass-body">• Don't need lead capture or scheduling</li>
                                    </ul>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-red-500/20">
                                    <h3 className="text-xl font-light text-red-400 mb-4">✗ Linktree Fails If You...</h3>
                                    <ul className="space-y-3">
                                        <li className="glass-body">• Sell real estate or services</li>
                                        <li className="glass-body">• Need to showcase products/listings</li>
                                        <li className="glass-body">• Want to capture qualified leads</li>
                                        <li className="glass-body">• Need appointment booking integration</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Migrate */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">How to Migrate from Linktree to AgentBio in 10 Minutes</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <MigrationStep number={1} title="Sign up for AgentBio" description="Create your free account and choose your username" />
                            <MigrationStep number={2} title="Add your profile info" description="Upload photo, bio, contact details (5 minutes)" />
                            <MigrationStep number={3} title="Add your best listings" description="Upload property photos and details (5 minutes)" />
                            <MigrationStep number={4} title="Set up lead forms" description="Configure buyer and seller inquiry forms (2 minutes)" />
                            <MigrationStep number={5} title="Update your Instagram bio" description="Replace Linktree link with your new AgentBio link" />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Ready to Upgrade from Linktree?</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Join 2,000+ agents who switched from generic link tools to AgentBio's real estate platform
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Try AgentBio Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Migrate in 10 minutes • Cancel anytime
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function ReasonCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]">
                    {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
                </div>
                <div>
                    <h3 className="text-xl font-light text-foreground mb-2">{title}</h3>
                    <p className="glass-body leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
    return (
        <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <p className="glass-body italic mb-4">"{quote}"</p>
            <div className="flex items-center gap-3">
                <div>
                    <p className="text-sm font-light text-foreground">{author}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                </div>
            </div>
        </div>
    );
}

function MigrationStep({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="flex items-center gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white font-light">
                {number}
            </div>
            <div>
                <h3 className="text-lg font-light text-foreground mb-1">{title}</h3>
                <p className="text-sm glass-body text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
