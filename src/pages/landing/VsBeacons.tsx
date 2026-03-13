import * as React from "react";
import { Link } from "react-router-dom";
import { Check, X, Home, DollarSign, BarChart3, Calendar, Users, Star } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSectionLazy } from "@/components/hero";
import { generateEnhancedOrganizationSchema } from "@/lib/seo";

export default function VsBeacons() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            // Enhanced Organization schema with social signals
            generateEnhancedOrganizationSchema(),
            {
                "@type": "WebPage",
                "@id": `${window.location.origin}/vs/beacons`,
                "url": `${window.location.origin}/vs/beacons`,
                "name": "AgentBio vs Beacons for Real Estate Agents: Detailed Comparison",
                "description": "Compare AgentBio and Beacons for real estate agents. While Beacons offers creator tools, AgentBio provides real estate-specific features like property listings, lead capture, and MLS compliance.",
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What's the difference between AgentBio and Beacons for real estate agents?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio is built specifically for real estate agents with property listing galleries, real estate lead capture forms, calendar booking for showings, and MLS compliance. Beacons is designed for content creators and influencers with email marketing and store features that aren't relevant for real estate workflows."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is AgentBio better than Beacons for realtors?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, for real estate professionals. While Beacons offers more features than basic link tools, it's designed for creators selling digital products and courses. AgentBio focuses exclusively on what real estate agents need: showcasing properties, capturing buyer/seller leads, and booking showing appointments."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can Beacons show real estate listings?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "No. Beacons doesn't have property listing gallery features. You can add basic links to listings, but without built-in photo galleries, pricing displays, bed/bath counts, or MLS integration that real estate agents need to properly showcase properties."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="AgentBio vs Beacons for Real Estate Agents: Which to Choose?"
                description="Compare AgentBio and Beacons for real estate agents. While Beacons offers creator tools, AgentBio provides real estate-specific features like property listings, lead capture, and MLS compliance."
                keywords={[
                    "AgentBio vs Beacons",
                    "Beacons for real estate agents",
                    "Beacons alternative for realtors",
                    "real estate link in bio tool",
                    "best link in bio for agents"
                ]}
                canonicalUrl={`${window.location.origin}/vs/beacons`}
                schema={schema}
            />
            <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
                <PublicHeader />

                {/* Direct Answer Section */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio is better than Beacons for real estate agents</strong> because it's purpose-built for real estate workflows with property listing galleries, MLS compliance, real estate-specific lead capture forms, and showing appointment booking. While Beacons offers advanced features like email marketing and online stores, these creator-focused tools aren't relevant for real estate agents who need to showcase properties and capture buyer/seller leads, not sell digital products or courses.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSectionLazy
                    title="AgentBio vs Beacons for Real Estate Agents"
                    subtitle="Creator Tools vs Real Estate Tools: Why the Difference Matters"
                    description="Beacons is built for content creators and influencers. AgentBio is built for real estate professionals. Discover why real estate-specific features convert more Instagram followers into qualified leads."
                    primaryCta={{
                        text: "Try AgentBio Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See Feature Comparison",
                        href: "#comparison"
                    }}
                    badge={{
                        icon: <Home className="h-4 w-4" aria-hidden="true" />,
                        text: "Built for Real Estate, Not Creators"
                    }}
                    showStats={false}
                />

                {/* Feature Comparison Table */}
                <section id="comparison" className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Feature Comparison: AgentBio vs Beacons</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                See why real estate agents need specialized tools, not general creator platforms
                            </p>
                        </header>

                        <div className="max-w-5xl mx-auto overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-glass-border">
                                        <th className="text-left py-4 px-4 font-light text-lg">Feature</th>
                                        <th className="text-center py-4 px-4 font-light text-lg">
                                            <div className="flex flex-col items-center">
                                                <span className="text-transparent bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] bg-clip-text font-normal">AgentBio</span>
                                                <span className="text-sm text-muted-foreground mt-1">Real Estate</span>
                                            </div>
                                        </th>
                                        <th className="text-center py-4 px-4 font-light text-lg">
                                            <div className="flex flex-col items-center">
                                                <span>Beacons</span>
                                                <span className="text-sm text-muted-foreground mt-1">Creator Platform</span>
                                            </div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {/* Real Estate Specific Features */}
                                    <tr className="border-b border-glass-border/50">
                                        <td colSpan={3} className="py-3 px-4 font-semibold text-foreground bg-glass-background/30">
                                            Real Estate Specific Features
                                        </td>
                                    </tr>
                                    <ComparisonRow
                                        feature="Property Listing Galleries"
                                        agentbio={true}
                                        beacons={false}
                                        description="Showcase active & sold listings with photos, prices, beds/baths"
                                    />
                                    <ComparisonRow
                                        feature="MLS Compliance"
                                        agentbio={true}
                                        beacons={false}
                                        description="Equal Housing logo, license number display, MLS attribution"
                                    />
                                    <ComparisonRow
                                        feature="Real Estate Lead Forms"
                                        agentbio="Buyer, Seller, Valuation"
                                        beacons="Generic Contact Form"
                                        description="Pre-qualification questions specific to real estate"
                                    />
                                    <ComparisonRow
                                        feature="Showing Appointment Booking"
                                        agentbio={true}
                                        beacons={false}
                                        description="Calendly/Google Calendar integration for property showings"
                                    />
                                    <ComparisonRow
                                        feature="Testimonials Display"
                                        agentbio="5-Star Ratings"
                                        beacons={false}
                                        description="Client reviews with verified badges and success stories"
                                    />
                                    <ComparisonRow
                                        feature="Property Analytics"
                                        agentbio={true}
                                        beacons={false}
                                        description="Track which listings get most clicks, views, inquiries"
                                    />

                                    {/* Core Link-in-Bio Features */}
                                    <tr className="border-b border-glass-border/50">
                                        <td colSpan={3} className="py-3 px-4 font-semibold text-foreground bg-glass-background/30">
                                            Core Link Features
                                        </td>
                                    </tr>
                                    <ComparisonRow
                                        feature="Unlimited Links"
                                        agentbio={true}
                                        beacons={true}
                                        description="Add as many links as needed"
                                    />
                                    <ComparisonRow
                                        feature="Custom Branding"
                                        agentbio={true}
                                        beacons={true}
                                        description="Colors, fonts, logo customization"
                                    />
                                    <ComparisonRow
                                        feature="Mobile Optimization"
                                        agentbio={true}
                                        beacons={true}
                                        description="Responsive design for all devices"
                                    />
                                    <ComparisonRow
                                        feature="Analytics Dashboard"
                                        agentbio={true}
                                        beacons={true}
                                        description="Traffic, clicks, and engagement metrics"
                                    />

                                    {/* Creator-Specific Features */}
                                    <tr className="border-b border-glass-border/50">
                                        <td colSpan={3} className="py-3 px-4 font-semibold text-foreground bg-glass-background/30">
                                            Creator/Influencer Features
                                        </td>
                                    </tr>
                                    <ComparisonRow
                                        feature="Email Marketing"
                                        agentbio={false}
                                        beacons={true}
                                        description="Built-in email campaigns (not needed for agents with CRM)"
                                    />
                                    <ComparisonRow
                                        feature="Online Store"
                                        agentbio={false}
                                        beacons={true}
                                        description="Sell digital products (not relevant for real estate)"
                                    />
                                    <ComparisonRow
                                        feature="Media Kit Generator"
                                        agentbio={false}
                                        beacons={true}
                                        description="For influencer brand partnerships (not needed for agents)"
                                    />
                                    <ComparisonRow
                                        feature="Tipping / Donations"
                                        agentbio={false}
                                        beacons={true}
                                        description="Accept fan donations (not applicable to real estate)"
                                    />

                                    {/* Pricing */}
                                    <tr className="border-b border-glass-border/50">
                                        <td colSpan={3} className="py-3 px-4 font-semibold text-foreground bg-glass-background/30">
                                            Pricing
                                        </td>
                                    </tr>
                                    <ComparisonRow
                                        feature="Free Plan"
                                        agentbio="3 Listings, 5 Links"
                                        beacons="Limited Features"
                                        description="Basic functionality to get started"
                                    />
                                    <ComparisonRow
                                        feature="Professional Plan"
                                        agentbio="$39/month"
                                        beacons="$10/month"
                                        description="Full-featured paid tier"
                                    />
                                    <ComparisonRow
                                        feature="ROI for Real Estate"
                                        agentbio="High"
                                        beacons="Low"
                                        description="Pays for itself with 1 extra lead/month"
                                    />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Why Real Estate Agents Switch from Beacons */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <header className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                    <span className="glass-heading">Why Real Estate Agents Switch from Beacons to AgentBio</span>
                                </h2>
                            </header>

                            <div className="space-y-12">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-light text-foreground flex items-center gap-3">
                                        <X className="h-6 w-6 text-red-400" />
                                        The Problem with Beacons for Real Estate
                                    </h3>
                                    <div className="pl-9 space-y-3">
                                        <p className="glass-body leading-relaxed">
                                            <strong>No way to showcase property listings:</strong> Beacons can't display property galleries with photos, pricing, and details. You're limited to generic links that send visitors to external sites.
                                        </p>
                                        <p className="glass-body leading-relaxed">
                                            <strong>Creator-focused, not agent-focused:</strong> Features like "sell courses," "fan donations," and "media kits" waste screen space on tools real estate agents will never use.
                                        </p>
                                        <p className="glass-body leading-relaxed">
                                            <strong>Generic lead capture:</strong> Basic contact forms don't pre-qualify buyers or sellers. You get low-quality leads without budget, timeline, or intent information.
                                        </p>
                                        <p className="glass-body leading-relaxed">
                                            <strong>No MLS compliance:</strong> Missing Equal Housing logo, license number display, and proper attributions can create legal compliance issues.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-2xl font-light text-foreground flex items-center gap-3">
                                        <Check className="h-6 w-6 text-green-400" />
                                        The AgentBio Advantage for Real Estate
                                    </h3>
                                    <div className="pl-9 space-y-3">
                                        <p className="glass-body leading-relaxed">
                                            <strong>Purpose-built property galleries:</strong> Showcase unlimited listings with full photo galleries, prices, bed/bath counts, square footage, and "Just Listed" or "Sold" badges.
                                        </p>
                                        <p className="glass-body leading-relaxed">
                                            <strong>Real estate-specific lead forms:</strong> Capture buyer budget, pre-approval status, timeline, and property preferences. Get seller lead info including home value expectations and reason for selling.
                                        </p>
                                        <p className="glass-body leading-relaxed">
                                            <strong>Showing appointment booking:</strong> Integrated calendar lets buyers book showing times directly. No more phone tag or missed opportunities.
                                        </p>
                                        <p className="glass-body leading-relaxed">
                                            <strong>MLS compliance built-in:</strong> Automatic Equal Housing logo, customizable license number placement, and proper broker attribution keep you compliant.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Real Agent Testimonials */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">What Real Estate Agents Say About Switching</span>
                            </h2>
                        </header>

                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <TestimonialCard
                                quote="Beacons was too complicated for what I needed. I'm not selling courses or accepting donations—I'm selling homes. AgentBio gives me exactly what I need and nothing I don't."
                                author="Marcus T."
                                role="Luxury Agent, Miami"
                                metric="18 leads/month from Instagram"
                            />
                            <TestimonialCard
                                quote="The property gallery feature alone was worth the switch. My Instagram followers can now browse all my listings without leaving the platform. Conversion rate tripled."
                                author="Jessica R."
                                role="First-Time Buyer Specialist, Denver"
                                metric="3x more bio link clicks"
                            />
                            <TestimonialCard
                                quote="I needed MLS compliance and showing booking features. Beacons couldn't do that. AgentBio had everything I needed as a real estate professional."
                                author="David K."
                                role="Team Leader, Phoenix"
                                metric="$2.4M closed from Instagram"
                            />
                        </div>
                    </div>
                </section>

                {/* When Beacons Makes Sense */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <header className="mb-8">
                                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                    <span className="glass-heading">When Beacons Makes Sense (and When It Doesn't)</span>
                                </h2>
                            </header>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-xl bg-green-50 border border-green-200">
                                    <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                                        <Check className="h-5 w-5" />
                                        Beacons is Good For:
                                    </h3>
                                    <ul className="space-y-2 text-green-800">
                                        <li>• Content creators & influencers</li>
                                        <li>• Selling digital products or courses</li>
                                        <li>• Building email lists for newsletters</li>
                                        <li>• Accepting donations or tips</li>
                                        <li>• Media kit presentation</li>
                                    </ul>
                                </div>

                                <div className="p-6 rounded-xl bg-red-50 border border-red-200">
                                    <h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                                        <X className="h-5 w-5" />
                                        Beacons is NOT Good For:
                                    </h3>
                                    <ul className="space-y-2 text-red-800">
                                        <li>• Real estate agents showcasing listings</li>
                                        <li>• Capturing qualified buyer/seller leads</li>
                                        <li>• Booking showing appointments</li>
                                        <li>• MLS compliance requirements</li>
                                        <li>• Real estate-specific analytics</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-8 p-6 rounded-xl bg-glass-background border border-glass-border">
                                <p className="glass-body text-center">
                                    <strong>Bottom Line:</strong> If you're a real estate agent, you need real estate tools. Beacons' creator features are irrelevant to your business, while AgentBio's real estate features directly convert followers into clients.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Migration Guide */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <header className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                    <span className="glass-heading">How to Migrate from Beacons to AgentBio in 10 Minutes</span>
                                </h2>
                                <p className="text-xl glass-body">
                                    Switching is easier than you think. Here's the step-by-step process:
                                </p>
                            </header>

                            <div className="space-y-6">
                                <MigrationStep
                                    number={1}
                                    title="Create Your Free AgentBio Account"
                                    description="Sign up at agentbio.net with your email. Choose your unique username (yourname.agentbio.net)."
                                />
                                <MigrationStep
                                    number={2}
                                    title="Add Your Profile Information"
                                    description="Upload your photo, write your bio, add contact details, and customize your brand colors."
                                />
                                <MigrationStep
                                    number={3}
                                    title="Upload Your Property Listings"
                                    description="Add active listings with photos, pricing, details. Mark sold properties for social proof."
                                />
                                <MigrationStep
                                    number={4}
                                    title="Set Up Lead Capture Forms"
                                    description="Configure buyer inquiry form, seller lead form, and home valuation tool."
                                />
                                <MigrationStep
                                    number={5}
                                    title="Connect Your Calendar"
                                    description="Integrate Calendly or Google Calendar for showing appointment booking."
                                />
                                <MigrationStep
                                    number={6}
                                    title="Update Your Instagram Bio"
                                    description="Replace your Beacons link with your new AgentBio link. Done!"
                                />
                            </div>

                            <div className="mt-12 text-center">
                                <Link
                                    to="/auth/register"
                                    className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                                >
                                    <span className="glass-accent">Start Your Free AgentBio Account →</span>
                                </Link>
                                <p className="text-sm text-muted-foreground mt-4">
                                    No credit card required • 5-minute setup • Cancel anytime
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Frequently Asked Questions</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-4">
                            <FAQItem
                                question="Can I use both Beacons and AgentBio?"
                                answer="You could, but it would confuse your Instagram followers. It's better to use one link-in-bio tool. Since AgentBio includes everything real estate agents need (and Beacons' creator features aren't relevant to real estate), most agents switch entirely to AgentBio."
                            />
                            <FAQItem
                                question="Is AgentBio more expensive than Beacons?"
                                answer="AgentBio's professional plan is $39/month vs Beacons' $10/month. However, AgentBio pays for itself with a single extra lead per month. Real estate agents report 15-25 qualified leads per month from AgentBio, making the ROI significantly higher despite the higher price."
                            />
                            <FAQItem
                                question="What happens to my Beacons analytics when I switch?"
                                answer="Beacons analytics stay in your Beacons account. When you switch to AgentBio, you'll start fresh with AgentBio analytics. Most agents find AgentBio analytics more valuable because they track real estate-specific metrics like 'which listings get most clicks' and 'lead form conversion rates.'"
                            />
                            <FAQItem
                                question="Can I import my links from Beacons to AgentBio?"
                                answer="There's no automatic import, but recreating your links in AgentBio only takes 5-10 minutes. Since AgentBio is focused on real estate, you'll likely replace generic links with property listings, lead forms, and booking calendars anyway."
                            />
                            <FAQItem
                                question="Does AgentBio have email marketing like Beacons?"
                                answer="AgentBio doesn't include email marketing because most agents already use a CRM or email platform (Mailchimp, ActiveCampaign, etc.). AgentBio focuses on what real estate agents need most: showcasing properties and capturing leads. You can integrate AgentBio with your existing email platform."
                            />
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/20 via-[#a1c4fd]/20 to-[#c2e9fb]/20" />
                    <div className="absolute inset-0 bg-glass-background backdrop-blur-sm" />
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">
                                Ready to Switch to a Real Estate-Focused Platform?
                            </span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Join 2,000+ agents who switched from creator tools to purpose-built real estate software
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Create Your AgentBio Account Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Setup in 5 minutes • Cancel anytime
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function ComparisonRow({
    feature,
    agentbio,
    beacons,
    description
}: {
    feature: string;
    agentbio: boolean | string;
    beacons: boolean | string;
    description?: string;
}) {
    return (
        <tr className="border-b border-glass-border/30 hover:bg-glass-background/20 transition-colors">
            <td className="py-4 px-4">
                <div>
                    <div className="font-normal text-foreground">{feature}</div>
                    {description && (
                        <div className="text-xs text-muted-foreground mt-1">{description}</div>
                    )}
                </div>
            </td>
            <td className="py-4 px-4 text-center">
                {typeof agentbio === 'boolean' ? (
                    agentbio ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                    )
                ) : (
                    <span className="text-foreground">{agentbio}</span>
                )}
            </td>
            <td className="py-4 px-4 text-center">
                {typeof beacons === 'boolean' ? (
                    beacons ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                        <X className="h-5 w-5 text-red-400 mx-auto" />
                    )
                ) : (
                    <span className="text-foreground">{beacons}</span>
                )}
            </td>
        </tr>
    );
}

function TestimonialCard({
    quote,
    author,
    role,
    metric
}: {
    quote: string;
    author: string;
    role: string;
    metric: string;
}) {
    return (
        <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border hover:border-[#80d0c7] transition-all">
            <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
            </div>
            <p className="glass-body mb-4 italic">"{quote}"</p>
            <div className="border-t border-glass-border pt-4">
                <p className="font-semibold text-foreground">{author}</p>
                <p className="text-sm text-muted-foreground">{role}</p>
                <p className="text-sm text-[#80d0c7] mt-2 font-semibold">{metric}</p>
            </div>
        </div>
    );
}

function MigrationStep({
    number,
    title,
    description
}: {
    number: number;
    title: string;
    description: string;
}) {
    return (
        <div className="flex gap-4 items-start p-6 rounded-xl bg-glass-background border border-glass-border">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white font-semibold">
                {number}
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                <p className="glass-body">{description}</p>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border border-glass-border rounded-xl bg-glass-background backdrop-blur-md overflow-hidden transition-all hover:border-[#80d0c7]/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between group"
                aria-expanded={isOpen}
            >
                <h3 className="text-lg font-light tracking-tight text-foreground pr-4 group-hover:text-[#80d0c7] transition-colors">
                    {question}
                </h3>
                <svg
                    className={`w-5 h-5 text-[#80d0c7] transition-transform flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {isOpen && (
                <div className="px-6 pb-4">
                    <p className="glass-body leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    );
}
