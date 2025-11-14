import * as React from "react";
import { Link } from "react-router-dom";
import { BarChart3, Eye, MousePointer, TrendingUp, MapPin, Instagram, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/hero";

export default function Analytics() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Real Estate Analytics & Insights - AgentBio",
        "description": "Track which listings get the most views, where leads come from, and which properties generate inquiries. Data-driven insights for real estate agents.",
    };

    return (
        <>
            <SEOHead
                title="Real Estate Analytics & Insights | Track Performance & Lead Sources"
                description="Track which listings get the most views, where leads come from, and which properties generate inquiries. Data-driven insights for real estate agents."
                keywords={[
                    "real estate analytics",
                    "agent bio analytics",
                    "listing performance tracking",
                    "lead source tracking",
                    "Instagram traffic analytics"
                ]}
                canonicalUrl={`${window.location.origin}/features/analytics`}
                schema={schema}
            />
            <main className="min-h-screen bg-background">
                <PublicHeader />

                {/* Direct Answer */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio's real estate analytics give agents data-driven insights</strong> into which property listings get the most views, where leads come from (Instagram Story, Post, or DM), which links get clicked most, and how visitors engage with their bio page. Unlike generic analytics, AgentBio tracks real estate-specific metrics like listing views per property, lead source attribution, and conversion rates from social media traffic—helping agents optimize their marketing and focus on what actually generates business.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSection
                    title="Real Estate Analytics & Insights"
                    subtitle="Know What's Working—Double Down on What Converts"
                    description="Stop guessing. Track exactly which listings generate interest, where your best leads come from, and what content drives conversions."
                    primaryCta={{
                        text: "Start Tracking Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See What You Can Track",
                        href: "#metrics"
                    }}
                    badge={{
                        icon: <BarChart3 className="h-4 w-4" aria-hidden="true" />,
                        text: "Real-Time Insights"
                    }}
                    showStats={false}
                />

                {/* Why Analytics Matter */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Why Real Estate Agents Need Analytics</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <h3 className="text-xl font-light text-foreground mb-3">Know Your Hot Listings</h3>
                                    <p className="glass-body mb-4">
                                        See which properties get 100+ views vs 10 views. Double down on promoting your most popular listings in Instagram Stories.
                                    </p>
                                    <p className="text-sm text-[#80d0c7]">→ Optimize your Instagram content strategy</p>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <h3 className="text-xl font-light text-foreground mb-3">Track Lead Sources</h3>
                                    <p className="glass-body mb-4">
                                        Know if leads come from Instagram Stories, Posts, Reels, or DMs. Spend more time on channels that actually convert.
                                    </p>
                                    <p className="text-sm text-[#80d0c7]">→ Focus your marketing where it works</p>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <h3 className="text-xl font-light text-foreground mb-3">Identify Conversion Patterns</h3>
                                    <p className="glass-body mb-4">
                                        See what visitors do before submitting a lead form. Do they view 3+ listings first? Watch testimonials? Understand buyer behavior.
                                    </p>
                                    <p className="text-sm text-[#80d0c7]">→ Optimize your bio page layout</p>
                                </div>

                                <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <h3 className="text-xl font-light text-foreground mb-3">Measure ROI</h3>
                                    <p className="glass-body mb-4">
                                        Track how many Instagram followers convert to leads. Calculate cost per lead. Prove your social media marketing is working.
                                    </p>
                                    <p className="text-sm text-[#80d0c7]">→ Justify your marketing spend</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Metrics You Can Track */}
                <section className="py-20 bg-background" id="metrics">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Real Estate Metrics That Matter</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Track the data that actually drives your business forward
                            </p>
                        </header>

                        <div className="max-w-5xl mx-auto space-y-8">
                            <MetricCard
                                icon={<Eye />}
                                title="Listing View Analytics"
                                description="See exactly which properties generate the most interest"
                                metrics={[
                                    "Total views per listing",
                                    "Average time spent viewing each property",
                                    "Photo gallery engagement (which photos get viewed most)",
                                    "Virtual tour click-through rate",
                                    "Listing detail downloads"
                                ]}
                                insight="Use Case: Your $850K listing gets 200 views but no leads. Your $1.2M listing gets 50 views with 5 leads. Focus your marketing on the higher-converting property type."
                            />

                            <MetricCard
                                icon={<Instagram />}
                                title="Traffic Source Breakdown"
                                description="Know exactly where your visitors come from"
                                metrics={[
                                    "Instagram Stories vs Posts vs Reels vs Bio Link",
                                    "Direct visits (QR codes, business cards)",
                                    "Referral traffic (other websites)",
                                    "Geographic location of visitors",
                                    "Device breakdown (mobile vs desktop)"
                                ]}
                                insight="Use Case: 80% of your traffic comes from Instagram Stories, but 70% of your leads come from Posts. Adjust your content strategy to post more listing highlights."
                            />

                            <MetricCard
                                icon={<MousePointer />}
                                title="Link Click Tracking"
                                description="See which CTAs and links get the most engagement"
                                metrics={[
                                    "Most clicked links (contact, calendar, social)",
                                    "Lead form submission rates",
                                    "Calendar booking click-through rate",
                                    "Social media link engagement",
                                    "Phone number tap-to-call rate"
                                ]}
                                insight="Use Case: Your 'Schedule Showing' button gets 100 clicks but only 10 bookings. Add calendar integration to remove friction and increase conversions."
                            />

                            <MetricCard
                                icon={<TrendingUp />}
                                title="Lead Conversion Metrics"
                                description="Understand your conversion funnel"
                                metrics={[
                                    "Visitor to lead conversion rate",
                                    "Lead quality scores (hot/warm/cold distribution)",
                                    "Form completion rates by type",
                                    "Average leads per week/month",
                                    "Lead source attribution"
                                ]}
                                insight="Use Case: You get 500 monthly visitors but only 10 leads (2% conversion). Industry average is 5%. Optimize your lead forms and CTAs to capture more inquiries."
                            />
                        </div>
                    </div>
                </section>

                {/* Real-Time Dashboard */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Real-Time Analytics Dashboard</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                See what's happening right now, not last month
                            </p>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <h3 className="text-2xl font-light text-foreground mb-6">Live Activity Feed</h3>
                                <div className="space-y-4">
                                    {[
                                        { time: "2 minutes ago", action: "Someone viewed your $650K listing from Instagram Story", color: "blue" },
                                        { time: "8 minutes ago", action: "New lead submitted: Buyer inquiry for 3-bed homes", color: "green" },
                                        { time: "15 minutes ago", action: "Showing appointment booked for 123 Main St", color: "purple" },
                                        { time: "22 minutes ago", action: "4 people viewed your profile in the last hour", color: "blue" },
                                        { time: "35 minutes ago", action: "Home valuation request submitted", color: "green" }
                                    ].map((activity, i) => (
                                        <div key={i} className="flex items-start gap-4 p-4 bg-background/50 rounded-lg">
                                            <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-400`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm glass-body">{activity.action}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What Agents Say */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">How Agents Use Analytics</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <p className="glass-body italic mb-4">
                                    "I thought my Instagram Reels were driving all my leads. Analytics showed 90% actually came from Stories. Now I post 3 Stories daily instead of spending hours on Reels. Leads doubled."
                                </p>
                                <div>
                                    <p className="text-sm font-light text-foreground">Maria Lopez</p>
                                    <p className="text-xs text-muted-foreground">Luxury Agent, Miami FL</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <p className="glass-body italic mb-4">
                                    "The listing view analytics told me my $2M+ properties get tons of views but zero inquiries. I adjusted my lead forms to pre-qualify high-net-worth buyers. Now I get fewer, but higher-quality leads."
                                </p>
                                <div>
                                    <p className="text-sm font-light text-foreground">David Kim</p>
                                    <p className="text-xs text-muted-foreground">Team Leader, Los Angeles CA</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Export & Reporting */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Export & Reporting</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: "CSV Export",
                                        description: "Download all your analytics data to Excel or Google Sheets for custom analysis"
                                    },
                                    {
                                        title: "PDF Reports",
                                        description: "Generate monthly performance reports to share with your team or broker"
                                    },
                                    {
                                        title: "Email Summaries",
                                        description: "Get weekly/monthly email summaries of your key metrics automatically"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border text-center">
                                        <h3 className="text-lg font-light text-foreground mb-2">{item.title}</h3>
                                        <p className="text-sm glass-body text-muted-foreground">{item.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Start Making Data-Driven Decisions</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Track what matters, optimize what works, and grow your real estate business with confidence
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Start Tracking Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Real-time insights • Export reports anytime
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function MetricCard({
    icon,
    title,
    description,
    metrics,
    insight
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    metrics: string[];
    insight: string;
}) {
    return (
        <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <div className="flex items-start gap-6 mb-6">
                <div className="flex-shrink-0 p-4 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]">
                    {React.cloneElement(icon as React.ReactElement, { className: "h-8 w-8" })}
                </div>
                <div>
                    <h3 className="text-2xl font-light tracking-tight text-foreground mb-2">{title}</h3>
                    <p className="glass-body text-muted-foreground">{description}</p>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="text-sm font-light text-foreground mb-3 uppercase tracking-wide">Metrics Tracked:</h4>
                <ul className="space-y-2">
                    {metrics.map((metric, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-[#80d0c7] flex-shrink-0 mt-0.5" />
                            <span className="text-sm glass-body">{metric}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 bg-gradient-to-br from-[#80d0c7]/5 to-[#a1c4fd]/5 rounded-lg border border-[#80d0c7]/20">
                <p className="text-sm font-light text-foreground mb-1">💡 Insight:</p>
                <p className="text-sm glass-body text-muted-foreground">{insight}</p>
            </div>
        </div>
    );
}
