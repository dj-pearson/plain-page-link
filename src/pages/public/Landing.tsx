import * as React from "react";
import { Link } from "react-router-dom";
import { Home, BarChart3, Users } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogSection } from "@/components/blog/BlogSection";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/hero";

export default function Landing() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": `${window.location.origin}/#website`,
                "url": window.location.origin,
                "name": "AgentBio - Professional Real Estate Agent Portfolio Link",
                "description": "Professional real estate agent portfolio link platform to showcase listings, sold properties, and capture qualified leads.",
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
                "description": "AgentBio is a professional portfolio platform for real estate agents to showcase their listings, sold properties, and capture qualified leads online."
            },
            {
                "@type": "SoftwareApplication",
                "name": "AgentBio - Professional Real Estate Agent Portfolio Link",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                },
                "description": "Create your professional real estate agent portfolio link to showcase sold properties, active listings, testimonials, and capture qualified leads.",
                "featureList": [
                    "Agent property showcase link",
                    "Realtor sold properties portfolio",
                    "Professional agent portfolio builder",
                    "Lead capture forms",
                    "Analytics and insights"
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
                            "text": "AgentBio is a professional portfolio platform designed specifically for real estate agents to create a single link that showcases their listings, sold properties, client testimonials, and captures qualified leads. It's like a link-in-bio tool purpose-built for realtors."
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
                title="Professional Real Estate Agent Portfolio Link | AgentBio"
                description="Create a professional real estate agent portfolio link to showcase listings, sold properties, and testimonials. Purpose-built for agents to capture qualified leads and grow their business."
                keywords={[
                    "professional real estate agent portfolio link",
                    "agent property showcase link",
                    "realtor sold properties portfolio",
                    "agent listing promotion link",
                    "professional agent portfolio builder",
                    "real estate agent bio link"
                ]}
                canonicalUrl={window.location.origin}
                schema={schema}
            />
            <main className="min-h-screen bg-background">
            {/* Header */}
            <PublicHeader />

            {/* 3D Hero Section */}
            <HeroSection />

            {/* Features Section */}
            <section id="features" className="py-20 bg-background/50" aria-labelledby="features-heading">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="features-heading" className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                            Professional Agent Portfolio Builder
                            <span className="block mt-2 glass-heading text-3xl md:text-4xl">
                                Features
                            </span>
                        </h2>
                        <p className="text-xl glass-body max-w-2xl mx-auto">
                            Purpose-built for real estate agents. Create your professional
                            realtor portfolio link with everything you need to showcase sold
                            properties and convert leads.
                        </p>
                    </header>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Home className="h-8 w-8" aria-hidden="true" />}
                            title="Agent Property Showcase Link"
                            description="Display your agent sold properties portfolio, active listings, and pending sales with stunning photos, prices, and property details. Mobile-optimized galleries for professional presentation."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8" aria-hidden="true" />}
                            title="Qualified Lead Capture"
                            description="Built-in buyer, seller, and home valuation forms designed for real estate professionals. Capture qualified leads with detailed questionnaires and agent client testimonials."
                        />
                        <FeatureCard
                            icon={<BarChart3 className="h-8 w-8" aria-hidden="true" />}
                            title="Agent Analytics & Insights"
                            description="Track your professional portfolio performance with detailed analytics. Monitor profile views, link clicks, and lead sources. See which listings and sold properties get the most attention."
                        />
                    </div>
                </div>
            </section>

            {/* Blog Section */}
            <BlogSection limit={6} showSearch={true} showFilters={true} />

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
                            answer="AgentBio is a professional portfolio platform designed specifically for real estate agents to create a single link that showcases their listings, sold properties, client testimonials, and captures qualified leads. It's like a link-in-bio tool purpose-built for realtors."
                        />
                        <FAQItem
                            question="How much does AgentBio cost?"
                            answer="AgentBio offers a free basic plan with core features including portfolio creation, listing showcase, and lead capture. Premium plans start at $19/month with advanced features like custom branding, analytics, unlimited listings, and priority support. No credit card required to start."
                        />
                        <FAQItem
                            question="Can I showcase my sold properties on AgentBio?"
                            answer="Yes! AgentBio is specifically designed to showcase your sold properties alongside active listings. You can add photos, prices, addresses, and property details for all your sold homes to demonstrate your track record and expertise to potential clients."
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
                            Create Your Professional Portfolio
                        </span>
                    </h2>
                    <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                        Join thousands of agents showcasing sold properties and capturing qualified leads
                    </p>
                    <Link
                        to="/auth/register"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        aria-label="Create your free real estate agent portfolio - no credit card required"
                    >
                        <span className="glass-accent">Get Started Free - No Credit Card Required</span>
                    </Link>
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
