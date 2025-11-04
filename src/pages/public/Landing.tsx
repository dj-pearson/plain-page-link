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
                "sameAs": []
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
                        aria-label="Get started with your free professional agent portfolio"
                    >
                        <span className="glass-accent">Get Started Free</span>
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
