import * as React from "react";
import { Link } from "react-router-dom";
import { Home, BarChart3, Users, Brain, Target, TrendingUp, Zap } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogSection } from "@/components/blog/BlogSection";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/hero";
import { BeforeAfterComparison } from "@/components/landing/BeforeAfterComparison";
import { DemoProfilesShowcase } from "@/components/landing/DemoProfilesShowcase";
import { AgentTestimonials } from "@/components/landing/AgentTestimonials";

export default function Landing() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${window.location.origin}/#website`,
                "url": window.location.origin,
                "name": "AgentBio - AI-Powered Lead Intelligence & Conversion Platform",
                "description": "AI-powered real estate platform that predicts lead conversion, matches properties to qualified buyers, and accelerates deals with market intelligence.",
                "publisher": {
                    "@id": `${window.location.origin}/#organization`
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": `${window.location.origin}/search?q={search_term_string}`
                    },
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "Organization",
                "@id": `${window.location.origin}/#organization`,
                "name": "AgentBio",
                "url": window.location.origin,
                "logo": {
                    "@type": "ImageObject",
                    "url": `${window.location.origin}/logo.png`
                },
                "sameAs": [],
                "description": "AgentBio is an AI-powered lead intelligence platform that predicts conversion rates, automatically matches properties to buyers, and provides market intelligence to accelerate real estate deals."
            },
            {
                "@type": "SoftwareApplication",
                "name": "AgentBio - AI-Powered Lead Intelligence Platform",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                },
                "description": "AI-powered real estate platform that predicts which leads will convert, automatically matches properties to qualified buyers, and provides market intelligence to close deals faster.",
                "featureList": [
                    "AI-powered lead scoring and conversion prediction",
                    "Automatic property-buyer matching",
                    "Market intelligence and benchmarking",
                    "Behavioral analytics and insights",
                    "Predictive deal acceleration",
                    "Data moat that improves over time"
                ],
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "1247"
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "What is AgentBio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio is an AI-powered lead intelligence platform for real estate agents. Unlike generic CRMs or portfolio tools, AgentBio uses machine learning to predict which leads will convert, automatically matches properties to qualified buyers, and provides market intelligence to accelerate deals. It's designed to create a competitive data moat that gets stronger with every interaction."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How does AI lead scoring work?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio tracks visitor behavior—time on page, properties viewed, scroll depth, return visits, and form interactions. Our AI analyzes these patterns to predict conversion likelihood. As you label lead outcomes (won, lost, nurturing), the model learns what signals indicate high-quality leads specific to your market and style. Over time, predictions become increasingly accurate."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What is the data moat and why does it matter?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Every lead outcome you label (closed deal, lost opportunity, etc.) trains your AI model to make better predictions. This creates a flywheel—more data equals better predictions, which leads to more closed deals, generating more data. Competitors can't replicate this advantage without years of your specific data. The earlier you start, the bigger your competitive advantage."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How much does AgentBio cost?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio offers a free basic plan with core features including portfolio creation, listing showcase, and lead capture. Premium plans start at $19/month with advanced features like custom branding, analytics, unlimited listings, and priority support. No credit card required to start."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I showcase my sold properties on AgentBio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes! AgentBio is specifically designed to showcase your sold properties alongside active listings. You can add photos, prices, addresses, and property details for all your sold homes to demonstrate your track record and expertise to potential clients."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How do I capture leads with AgentBio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "AgentBio includes built-in lead capture forms for buyers, sellers, and home valuations. Interested clients can submit their information directly from your portfolio link. You'll receive email notifications and can manage all leads from your dashboard with detailed analytics about lead sources."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is AgentBio mobile-friendly?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, all AgentBio portfolios are fully mobile-optimized and responsive. Your portfolio will look professional on any device - smartphones, tablets, and desktop computers. Most home buyers browse on mobile devices, so mobile optimization is a core feature."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I customize my AgentBio portfolio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Absolutely! You can customize colors, fonts, layout, profile photo, bio, social media links, and all content. Premium plans offer additional customization options including custom domains, advanced themes, and white-label branding to match your brokerage or personal brand."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Do I need technical skills to use AgentBio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "No technical skills required! AgentBio is designed to be simple and intuitive. You can create your professional portfolio in minutes by filling out your profile, uploading photos, and adding listings. Our drag-and-drop interface makes customization easy for anyone."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "How do I share my AgentBio portfolio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "You'll get a unique link (agentbio.net/yourname) that you can share anywhere - social media profiles, email signatures, business cards, listing presentations, or text messages. You can also share individual listings directly from your portfolio."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Does AgentBio help with SEO?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes! All AgentBio portfolios are search engine optimized with proper meta tags, structured data, and mobile optimization. Your portfolio can rank in search results when potential clients search for agents in your area. You can also customize SEO settings for better visibility."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can I track my portfolio performance?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes, AgentBio includes built-in analytics showing profile views, link clicks, lead sources, most viewed listings, and geographic data about your visitors. This helps you understand what content resonates with potential clients and optimize your marketing efforts."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="AI-Powered Lead Intelligence for Real Estate | AgentBio - Predict, Match, Close"
                description="AgentBio uses AI to predict which leads will convert, automatically match properties to qualified buyers, and accelerate deals with market intelligence. Build your competitive data moat that gets smarter over time."
                keywords={[
                    "AI real estate lead scoring",
                    "predictive lead conversion",
                    "real estate AI platform",
                    "property buyer matching AI",
                    "real estate market intelligence",
                    "lead prediction software",
                    "AI-powered real estate CRM",
                    "real estate data analytics",
                    "predictive real estate platform",
                    "smart lead qualification"
                ]}
                canonicalUrl={window.location.origin}
                schema={schema}
            />
            <main className="min-h-screen bg-background">
            {/* Header */}
            <PublicHeader />

            {/* 3D Hero Section */}
            <HeroSection />

            {/* Before/After Comparison */}
            <BeforeAfterComparison />

            {/* AI Intelligence Differentiators Section */}
            <section className="py-20 bg-background relative overflow-hidden" aria-labelledby="intelligence-heading">
                <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/5 via-[#a1c4fd]/5 to-[#c2e9fb]/5" />
                <div className="container mx-auto px-4 relative z-10">
                    <header className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-glass-background backdrop-blur-md border border-glass-border rounded-full text-sm font-light tracking-tight mb-6">
                            <div className="text-transparent bg-gradient-to-r from-[#80d0c7] to-[#a1c4fd] bg-clip-text flex items-center gap-2">
                                <Brain className="h-4 w-4 text-[#80d0c7]" />
                                <span className="font-normal">AI-Powered Intelligence Engine</span>
                            </div>
                        </div>
                        <h2 id="intelligence-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            <span className="glass-heading text-4xl md:text-6xl">
                                Know Which Leads Will Close
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-3xl mx-auto">
                            AgentBio doesn't just capture leads—it predicts which ones will convert,
                            automatically matches properties to buyers, and accelerates deals with
                            data-driven insights. Every interaction makes your predictions smarter.
                        </p>
                    </header>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<Brain className="h-8 w-8" aria-hidden="true" />}
                            title="Predictive Lead Scoring"
                            description="AI analyzes behavioral patterns to predict which leads are most likely to convert. Focus your time on opportunities that matter."
                        />
                        <FeatureCard
                            icon={<Target className="h-8 w-8" aria-hidden="true" />}
                            title="Smart Property Matching"
                            description="Automatically match your listings to qualified buyers based on preferences, behavior, and market signals. Close deals faster."
                        />
                        <FeatureCard
                            icon={<TrendingUp className="h-8 w-8" aria-hidden="true" />}
                            title="Market Intelligence"
                            description="Optimize listing performance with real-time benchmarks and insights. Know how your properties compare to market averages."
                        />
                        <FeatureCard
                            icon={<Zap className="h-8 w-8" aria-hidden="true" />}
                            title="Competitive Data Moat"
                            description="Every labeled lead outcome improves your predictions. Build an advantage that compounds over time—one competitors can't replicate."
                        />
                    </div>
                </div>
            </section>

            {/* Demo Profiles Showcase */}
            <DemoProfilesShowcase />

            {/* Agent Testimonials */}
            <AgentTestimonials />

            {/* Features Section */}
            <section id="features" className="py-20 bg-background/50" aria-labelledby="features-heading">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="features-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            Complete Platform
                            <span className="block mt-2 glass-heading text-3xl md:text-4xl">
                                All the Tools You Need
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-2xl mx-auto">
                            Beyond AI intelligence, get all the essential tools to showcase
                            your portfolio, capture leads, and manage your real estate business.
                        </p>
                    </header>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Home className="h-8 w-8" aria-hidden="true" />}
                            title="Portfolio Showcase"
                            description="Display sold properties, active listings, and pending sales with stunning photos and details. Mobile-optimized for professional presentation."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8" aria-hidden="true" />}
                            title="Lead Capture & CRM"
                            description="Built-in buyer, seller, and valuation forms with behavioral tracking. Capture context-rich leads with engagement history."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
                            title="Analytics Dashboard"
                            description="Track performance with detailed analytics. Monitor views, engagement patterns, lead quality scores, and conversion metrics."
                        />
                    </div>
                </div>
            </section>

            {/* Blog Section */}
            <BlogSection limit={6} showSearch={true} showFilters={true} />

            {/* Competitive Advantage / Data Moat Section */}
            <section className="py-20 bg-background relative overflow-hidden" aria-labelledby="competitive-advantage-heading">
                <div className="absolute inset-0 bg-gradient-to-br from-[#80d0c7]/10 via-[#a1c4fd]/10 to-[#c2e9fb]/10" />
                <div className="absolute inset-0 bg-glass-background backdrop-blur-sm" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <header className="text-center mb-12">
                            <h2 id="competitive-advantage-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-6">
                                <span className="glass-heading">
                                    Your Competitive Advantage
                                </span>
                                <span className="block mt-2 text-3xl md:text-4xl">
                                    That Gets Stronger Every Day
                                </span>
                            </h2>
                        </header>

                        <div className="space-y-8 mb-12">
                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center">
                                        <span className="text-2xl font-light text-white">1</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-light text-foreground mb-2">Data Accumulation Flywheel</h3>
                                        <p className="glass-body">
                                            Every lead you capture, every property view, every interaction feeds your AI model.
                                            As you label lead outcomes (won, lost, nurturing), your predictions become more accurate.
                                            This creates a <strong className="text-foreground">flywheel effect</strong>—the more you use it, the better it gets.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center">
                                        <span className="text-2xl font-light text-white">2</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-light text-foreground mb-2">Unreplicable by Competitors</h3>
                                        <p className="glass-body">
                                            Generic CRMs don't have your data. Even if competitors copy our features,
                                            they can't replicate <strong className="text-foreground">your proprietary dataset</strong> of
                                            labeled lead outcomes, behavioral patterns, and market intelligence. Your advantage
                                            compounds with every deal you close.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="flex items-start gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center">
                                        <span className="text-2xl font-light text-white">3</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-light text-foreground mb-2">Network Effects at Scale</h3>
                                        <p className="glass-body">
                                            As more agents use AgentBio, our aggregate market intelligence improves.
                                            You benefit from anonymized benchmarks across thousands of transactions—
                                            <strong className="text-foreground">insights no individual agent could gather alone</strong>.
                                            Early adopters gain the most as the network grows.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="text-center p-8 rounded-xl bg-gradient-to-br from-[#80d0c7]/20 to-[#a1c4fd]/20 border border-glass-border backdrop-blur-md">
                            <p className="text-lg glass-body mb-4">
                                <strong className="text-foreground text-xl">The earlier you start, the bigger your moat.</strong>
                            </p>
                            <p className="text-md glass-body">
                                Agents who build their data advantage today will be impossible to catch tomorrow.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

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
                            question="What is AgentBio?"
                            answer="AgentBio is an AI-powered lead intelligence platform for real estate agents. Unlike generic CRMs or portfolio tools, AgentBio uses machine learning to predict which leads will convert, automatically matches properties to qualified buyers, and provides market intelligence to accelerate deals. It's designed to create a competitive data moat that gets stronger with every interaction."
                        />
                        <FAQItem
                            question="How does AI lead scoring work?"
                            answer="AgentBio tracks visitor behavior—time on page, properties viewed, scroll depth, return visits, and form interactions. Our AI analyzes these patterns to predict conversion likelihood. As you label lead outcomes (won, lost, nurturing), the model learns what signals indicate high-quality leads specific to your market and style. Over time, predictions become increasingly accurate."
                        />
                        <FAQItem
                            question="What is the 'data moat' and why does it matter?"
                            answer="Every lead outcome you label (closed deal, lost opportunity, etc.) trains your AI model to make better predictions. This creates a flywheel—more data equals better predictions, which leads to more closed deals, generating more data. Competitors can't replicate this advantage without years of your specific data. The earlier you start, the bigger your competitive advantage."
                        />
                        <FAQItem
                            question="How much does AgentBio cost?"
                            answer="AgentBio offers a free basic plan with core features including portfolio creation, listing showcase, and lead capture. Premium plans starting at $19/month unlock AI-powered lead scoring, automatic property matching, market intelligence benchmarks, and advanced analytics. No credit card required to start."
                        />
                        <FAQItem
                            question="Can I showcase my sold properties on AgentBio?"
                            answer="Yes! AgentBio showcases your sold properties, active listings, and pending sales with professional galleries. But beyond display, we track which properties visitors engage with most, helping predict buyer preferences and automatically match future listings to interested leads."
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
                        <FAQItem
                            question="Does AgentBio help with SEO?"
                            answer="Yes! All AgentBio portfolios are search engine optimized with proper meta tags, structured data, and mobile optimization. Your portfolio can rank in search results when potential clients search for agents in your area. You can also customize SEO settings for better visibility."
                        />
                        <FAQItem
                            question="Can I track my portfolio performance?"
                            answer="Yes, AgentBio includes built-in analytics showing profile views, link clicks, lead sources, most viewed listings, and geographic data about your visitors. This helps you understand what content resonates with potential clients and optimize your marketing efforts."
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
                            Start Building Your Data Moat Today
                        </span>
                    </h2>
                    <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                        Join forward-thinking agents who are building an AI-powered competitive advantage.
                        The earlier you start, the stronger your moat becomes.
                    </p>
                    <Link
                        to="/auth/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        aria-label="Start building your AI-powered competitive advantage - no credit card required"
                    >
                        <span className="glass-accent">Get Started Free - No Credit Card Required</span>
                    </Link>
                    <p className="text-sm text-muted-foreground font-light mt-4">
                        AI-powered lead scoring • Smart property matching • Market intelligence
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
