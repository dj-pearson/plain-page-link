import * as React from "react";
import { Link } from "react-router-dom";
import { Home, BarChart3, Users, Brain, Target, TrendingUp, Zap, CheckCircle2, Building2, Calendar, Award, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSectionLazy } from "@/components/hero";
import { BeforeAfterComparison } from "@/components/landing/BeforeAfterComparison";
import { DemoProfilesShowcase } from "@/components/landing/DemoProfilesShowcase";
import { AgentTestimonials } from "@/components/landing/AgentTestimonials";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { generateBreadcrumbSchema, generateEnhancedLocalBusinessSchema, generateEnhancedOrganizationSchema } from "@/lib/seo";
import { getSafeOrigin } from "@/lib/utils";

// Lazy load BlogSection since it's below the fold and requires Supabase
const BlogSection = React.lazy(() => import("@/components/blog/BlogSection").then(m => ({ default: m.BlogSection })));

export default function Landing() {
    // Safe origin for SSR/crawler compatibility
    const origin = getSafeOrigin();

    // Generate breadcrumb schema for homepage
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: "Home", url: origin }
    ]);

    // Generate enhanced organization schema with social signals
    const organizationSchema = generateEnhancedOrganizationSchema();

    // Generate enhanced local business schema
    const localBusinessSchema = generateEnhancedLocalBusinessSchema();

    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${origin}/#website`,
                "url": origin,
                "name": "AgentBio - Real Estate Agent Bio Page Builder",
                "description": "Turn your Instagram into a lead-generating real estate portfolio. Showcase listings, capture inquiries & book showings from one mobile-optimized bio page.",
                "publisher": {
                    "@id": `${origin}/#organization`
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${origin}/search?q={search_term_string}`
                    },
                    "query-input": "required name=search_term_string"
                }
            },
            // Use centralized Organization schema with social signals
            organizationSchema,
            {
                "@type": "SoftwareApplication",
                "name": "AgentBio",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                    "@type": "Offer",
                    "price": "39",
                    "priceCurrency": "USD"
                },
                "description": "Real estate agent bio page builder that turns Instagram followers into qualified leads. Showcase listings, capture inquiries, and book showings from one mobile-optimized portfolio.",
                "featureList": [
                    "Property listing galleries with photos and details",
                    "Buyer and seller lead capture forms",
                    "Appointment booking integration",
                    "Mobile-optimized real estate portfolio",
                    "Sold property showcase",
                    "Client testimonials display"
                ],
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "523"
                }
            },
            // Add BreadcrumbList schema
            breadcrumbSchema,
            // Add ProfessionalService/LocalBusiness schema for local SEO
            localBusinessSchema,
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What is a real estate bio page?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "A real estate bio page is a mobile-optimized landing page specifically designed for real estate agents to showcase their property listings, capture buyer and seller leads, and book showing appointments. Unlike generic link-in-bio tools, real estate bio pages include features like property galleries, lead capture forms, MLS compliance, and appointment booking—all optimized for converting social media followers into qualified leads."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How do real estate agents use Instagram for leads?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Real estate agents use Instagram to attract followers by posting property photos, market updates, and neighborhood content. To convert those followers into leads, agents place a bio page link in their Instagram profile. When followers click the link, they land on a dedicated portfolio page where they can view listings, submit inquiries, request home valuations, and book showing appointments—all without leaving their mobile device."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What's the difference between AgentBio and Linktree?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Linktree is a generic link organization tool, while AgentBio is purpose-built for real estate agents. AgentBio includes property listing galleries, lead capture forms with pre-qualification questions, sold property showcase, client testimonials, MLS compliance features, and appointment booking integration. You also get lead tracking, analytics on which listings get the most interest, and mobile optimization specifically designed for real estate marketing."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How much does a real estate agent website cost?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Traditional real estate agent websites cost $3,000-$15,000 upfront plus $100-$300 per month for hosting, maintenance, booking systems, and lead capture tools. AgentBio provides all these features for $39/month with $0 setup costs. You get property galleries, lead capture forms, appointment booking, analytics, and mobile optimization—everything a traditional website offers, but optimized specifically for social media traffic and mobile users."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I showcase sold properties on my bio page?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes! Showcasing sold properties is one of the most powerful social proof elements for real estate agents. AgentBio lets you create a dedicated sold properties section with photos, addresses, sale prices, and closing dates. This demonstrates your track record and expertise to potential clients browsing your Instagram bio page."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Real Estate Agent Bio Page Builder | Turn Instagram Followers into Leads – AgentBio"
                description="Purpose-built link-in-bio for real estate agents. Showcase properties, capture leads, and book appointments from Instagram. Start converting followers into clients today."
                keywords={[
                    "real estate agent bio page",
                    "Instagram bio page for realtors",
                    "real estate link in bio",
                    "agent portfolio website",
                    "turn Instagram followers into real estate leads",
                    "real estate agent mobile portfolio",
                    "showcase property listings Instagram",
                    "real estate bio page with lead capture",
                    "agent booking page for showings",
                    "real estate social media landing page"
                ]}
                canonicalUrl={origin}
                schema={schema}
            />
            <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
            {/* Header */}
            <PublicHeader />

            {/* Hero Section - Lazy loaded with lightweight fallback */}
            <HeroSectionLazy
                title="Real Estate Agent Bio Page Builder"
                subtitle="Turn Your Instagram Followers Into Qualified Buyer & Seller Leads"
                description="While your competitors use basic link-in-bio tools, you'll have a complete real estate portfolio with property galleries, lead capture forms, and appointment booking—all optimized to convert social media traffic into closings."
                primaryCta={{
                    text: "Create Your Agent Bio Page Free",
                    href: "/auth/register"
                }}
                secondaryCta={{
                    text: "See Live Agent Examples",
                    href: "#demo-profiles"
                }}
                badge={{
                    icon: <Sparkles className="h-4 w-4" aria-hidden="true" />,
                    text: "Built for Real Estate Agents"
                }}
                showStats={false}
            />

            {/* Key Benefits Section */}
            <section className="py-12 bg-glass-background/30 border-y border-glass-border" aria-label="Key benefits">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-sm font-light">✓</div>
                            <p className="text-sm glass-body leading-relaxed">Showcase active & sold listings with full photo galleries</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-sm font-light">✓</div>
                            <p className="text-sm glass-body leading-relaxed">Capture buyer inquiries & seller leads automatically</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-sm font-light">✓</div>
                            <p className="text-sm glass-body leading-relaxed">Schedule showings directly from your Instagram bio</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-sm font-light">✓</div>
                            <p className="text-sm glass-body leading-relaxed">Professional agent profile with reviews & credentials</p>
                        </div>
                    </div>
                    <div className="text-center mt-8">
                        <p className="text-sm text-muted-foreground font-light">
                            Join 5,000+ agents • No credit card required
                        </p>
                    </div>
                </div>
            </section>

            {/* Built for Real Estate, Not Generic Links */}
            <section className="py-20 bg-background relative overflow-hidden" aria-labelledby="real-estate-heading">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="real-estate-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading text-4xl md:text-6xl">
                                Built for Real Estate, Not Generic Links
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-2xl mx-auto">
                            Linktree wasn't built for real estate. AgentBio was. Here's why agents are switching...
                        </p>
                    </header>
                    <BeforeAfterComparison />
                </div>
            </section>

            {/* The Agent Bio Page That Actually Converts */}
            <section className="py-20 bg-background/50 relative overflow-hidden" aria-labelledby="converts-heading">
                <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/5 via-[#a1c4fd]/5 to-[#c2e9fb]/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <header className="text-center mb-16">
                        <h2 id="converts-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading text-4xl md:text-6xl">
                                The Agent Bio Page That Actually Converts
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-3xl mx-auto">
                            Stop losing leads to complicated websites. Give your Instagram followers exactly what they need—in seconds.
                        </p>
                    </header>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <FeatureCard
                            icon={<Home className="h-8 w-8" aria-hidden="true" />}
                            title="Showcase Your Portfolio"
                            description="Display active listings with price, photos, beds/baths. Highlight sold properties as social proof. Add virtual tours and property videos."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8" aria-hidden="true" />}
                            title="Capture Qualified Leads"
                            description="Buyer inquiry forms with pre-qualification questions. Home valuation requests with address capture. Seller lead forms with timeline tracking."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
                            title="Book Appointments Fast"
                            description="Integrated Calendly for showing requests. One-tap phone & SMS contact buttons. Time zone auto-detection for out-of-area buyers."
                        />
                    </div>
                </div>
            </section>

            {/* Stop Losing Leads to Complicated Websites */}
            <section className="py-20 bg-background" aria-labelledby="problem-solution-heading">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <header className="text-center mb-12">
                            <h2 id="problem-solution-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading text-4xl md:text-6xl">
                                    Stop Losing Leads to Complicated Websites
                                </span>
                            </h2>
                        </header>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            {/* Problem */}
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-sm font-light mb-4">
                                    <span className="text-red-400">The Problem</span>
                                </div>
                                <p className="glass-body leading-relaxed mb-6">
                                    43% of real estate referrals come through text messages and social media. But when you send clients to your traditional website:
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-red-400 flex-shrink-0">❌</span>
                                        <p className="glass-body">They get lost in navigation menus</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-red-400 flex-shrink-0">❌</span>
                                        <p className="glass-body">Loading takes 5+ seconds on mobile</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-red-400 flex-shrink-0">❌</span>
                                        <p className="glass-body">They can't find your contact info</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-red-400 flex-shrink-0">❌</span>
                                        <p className="glass-body">No easy way to schedule a showing</p>
                                    </div>
                                </div>
                            </div>

                            {/* Solution */}
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-sm font-light mb-4">
                                    <span className="text-green-400">The Solution</span>
                                </div>
                                <p className="glass-body leading-relaxed mb-6">
                                    Your AgentBio page loads in under 2 seconds, puts your best listings front and center, and has contact buttons in thumb-reach. Everything a buyer needs to take the next step.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-green-400 flex-shrink-0">✓</span>
                                        <p className="glass-body">Instant load on any mobile device</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-green-400 flex-shrink-0">✓</span>
                                        <p className="glass-body">Best listings highlighted at the top</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-green-400 flex-shrink-0">✓</span>
                                        <p className="glass-body">One-tap call, text, or email buttons</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-green-400 flex-shrink-0">✓</span>
                                        <p className="glass-body">Built-in showing request forms</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Profiles Showcase */}
            <section className="py-20 bg-background/50" aria-labelledby="demo-heading" id="demo-profiles">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="demo-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading text-4xl md:text-6xl">
                                See How Top Agents Use AgentBio
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-2xl mx-auto">
                            Real examples of agents who switched from generic links to professional bio pages
                        </p>
                    </header>
                    <DemoProfilesShowcase />
                </div>
            </section>

            {/* Agent Testimonials */}
            <section className="py-20 bg-background" aria-labelledby="testimonials-heading">
                <div className="container mx-auto px-4">
                    <AgentTestimonials />
                </div>
            </section>

            {/* Features Built for Real Estate */}
            <section id="features" className="py-20 bg-background/50" aria-labelledby="features-heading">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="features-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading text-4xl md:text-6xl">
                                Features Built Specifically for Real Estate
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-3xl mx-auto">
                            Not just another link tool—AgentBio includes everything real estate agents need to convert social media traffic into closed deals
                        </p>
                    </header>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <FeatureCard
                            icon={<Home className="h-8 w-8" aria-hidden="true" />}
                            title="Property Listings Gallery"
                            description="Display active & sold listings with photos, prices, beds/baths, and square footage. Full property details, virtual tours, and open house dates."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8" aria-hidden="true" />}
                            title="Lead Intelligence"
                            description="See which listings visitors view most. Track where leads come from (Instagram Story vs Post vs DM). Lead scoring: Hot/Warm/Cold based on behavior."
                        />
                        <FeatureCard
                            icon={<Target className="h-8 w-8" aria-hidden="true" />}
                            title="MLS Compliance"
                            description="Equal Housing Opportunity logo auto-included. License number display for state compliance. MLS attribution when applicable. Fair Housing disclaimers."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
                            title="Appointment Booking"
                            description="Integrated Calendly for showing requests. One-tap phone, SMS, and email buttons. Time zone detection for out-of-area buyers."
                        />
                        <FeatureCard
                            icon={<Brain className="h-8 w-8" aria-hidden="true" />}
                            title="Client Testimonials"
                            description="Showcase reviews and success stories. Display 5-star ratings prominently. Add video testimonials for social proof."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8" aria-hidden="true" />}
                            title="Mobile-First Design"
                            description="Loads in under 2 seconds on 4G. Thumb-friendly buttons and navigation. Optimized for how buyers actually browse on mobile."
                        />
                    </div>
                </div>
            </section>

            {/* Multi-Platform Strategy */}
            <section className="py-20 bg-background relative overflow-hidden" aria-labelledby="multi-platform-heading">
                <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/5 via-[#a1c4fd]/5 to-[#c2e9fb]/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <header className="text-center mb-12">
                        <h2 id="multi-platform-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading text-4xl md:text-6xl">
                                Built on Instagram, But Works Everywhere
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-3xl mx-auto">
                            One link that works across all your marketing channels
                        </p>
                    </header>

                    <div className="max-w-4xl mx-auto">
                        <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                            <h3 className="text-2xl font-light text-foreground mb-6 text-center">Add your AgentBio link to:</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">Instagram bio</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">TikTok profile</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">Facebook business page</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">LinkedIn headline</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">Email signature</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">Text message signatures</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">QR code on yard signs</span>
                                </div>
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-background/50">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd]" />
                                    <span className="glass-body">Business cards</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Blog Section - Lazy loaded since it's below the fold */}
            <React.Suspense fallback={
                <section className="py-16 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">Latest Real Estate Insights</h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Expert advice, market trends, and guides to help you succeed in real estate
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-80 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            ))}
                        </div>
                    </div>
                </section>
            }>
                <BlogSection limit={6} showSearch={true} showFilters={true} />
            </React.Suspense>

            {/* FAQ Section */}
            <section className="py-20 bg-background" aria-labelledby="faq-heading">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="faq-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading">Frequently Asked Questions</span>
                        </h2>
                        <p className="text-xl glass-body max-w-2xl mx-auto">
                            Everything you need to know about creating your professional real estate agent portfolio
                        </p>
                    </header>

                    <div className="max-w-4xl mx-auto space-y-4">
                        <FAQItem
                            question="What is a real estate bio page?"
                            answer="A real estate bio page is a mobile-optimized landing page specifically designed for real estate agents to showcase their property listings, capture buyer and seller leads, and book showing appointments. Unlike generic link-in-bio tools, real estate bio pages include features like property galleries, lead capture forms, MLS compliance, and appointment booking—all optimized for converting social media followers into qualified leads."
                        />
                        <FAQItem
                            question="How do real estate agents use Instagram for leads?"
                            answer="Real estate agents use Instagram to attract followers by posting property photos, market updates, and neighborhood content. To convert those followers into leads, agents place a bio page link in their Instagram profile. When followers click the link, they land on a dedicated portfolio page where they can view listings, submit inquiries, request home valuations, and book showing appointments—all without leaving their mobile device."
                        />
                        <FAQItem
                            question="What's the difference between AgentBio and Linktree?"
                            answer="Linktree is a generic link organization tool, while AgentBio is purpose-built for real estate agents. AgentBio includes property listing galleries, lead capture forms with pre-qualification questions, sold property showcase, client testimonials, MLS compliance features, and appointment booking integration. You also get lead tracking, analytics on which listings get the most interest, and mobile optimization specifically designed for real estate marketing."
                        />
                        <FAQItem
                            question="How much does a real estate agent website cost?"
                            answer="Traditional real estate agent websites cost $3,000-$15,000 upfront plus $100-$300 per month for hosting, maintenance, booking systems, and lead capture tools. AgentBio provides all these features for $39/month with $0 setup costs. You get property galleries, lead capture forms, appointment booking, analytics, and mobile optimization—everything a traditional website offers, but optimized specifically for social media traffic and mobile users."
                        />
                        <FAQItem
                            question="Can I showcase sold properties on my bio page?"
                            answer="Yes! Showcasing sold properties is one of the most powerful social proof elements for real estate agents. AgentBio lets you create a dedicated sold properties section with photos, addresses, sale prices, and closing dates. This demonstrates your track record and expertise to potential clients browsing your Instagram bio page."
                        />
                        <FAQItem
                            question="How do I capture leads with AgentBio?"
                            answer="AgentBio includes built-in lead capture forms for buyers, sellers, and home valuations. Interested clients can submit their information directly from your portfolio link. You'll receive email notifications and can manage all leads from your dashboard with detailed analytics about lead sources."
                        />
                        <FAQItem
                            question="Is AgentBio mobile-friendly?"
                            answer="Yes, all AgentBio portfolios are fully mobile-optimized and responsive. Your portfolio will look professional on any device - smartphones, tablets, and desktop computers. Most home buyers browse on mobile devices, so mobile optimization is a core feature."
                        />
                        <FAQItem
                            question="Can I customize my AgentBio portfolio?"
                            answer="Absolutely! You can customize colors, fonts, layout, profile photo, bio, social media links, and all content. Premium plans offer additional customization options including custom domains, advanced themes, and white-label branding to match your brokerage or personal brand."
                        />
                        <FAQItem
                            question="Do I need technical skills to use AgentBio?"
                            answer="No technical skills required! AgentBio is designed to be simple and intuitive. You can create your professional portfolio in minutes by filling out your profile, uploading photos, and adding listings. Our drag-and-drop interface makes customization easy for anyone."
                        />
                        <FAQItem
                            question="How do I share my AgentBio portfolio?"
                            answer="You'll get a unique link (agentbio.net/yourname) that you can share anywhere - social media profiles, email signatures, business cards, listing presentations, or text messages. You can also share individual listings directly from your portfolio."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 relative overflow-hidden" aria-labelledby="cta-heading">
                <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/20 via-[#a1c4fd]/20 to-[#c2e9fb]/20" />
                <div className="absolute inset-0 bg-glass-background backdrop-blur-sm" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 id="cta-heading" className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                        <span className="glass-heading">
                            Ready to Turn Instagram Followers Into Clients?
                        </span>
                    </h2>
                    <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                        Join 5,000+ agents using AgentBio to showcase listings, capture leads, and book showings from one mobile-optimized bio page
                    </p>
                    <Link
                        to="/auth/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        aria-label="Create your agent bio page - no credit card required"
                    >
                        <span className="glass-accent">Create Your Agent Bio Page Free</span>
                    </Link>
                    <p className="text-sm text-muted-foreground font-light mt-4">
                        No credit card required • Setup in 5 minutes
                    </p>
                </div>
            </section>

            {/* Footer */}
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
        <div className="group p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/10 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/5 to-[#a1c4fd]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
                <div className="mb-4 text-transparent bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] bg-clip-text">
                    {icon}
                </div>
                <h3 className="text-xl font-light tracking-tight text-foreground mb-2">
                    {title}
                </h3>
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
