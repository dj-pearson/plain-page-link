import { Link } from "react-router-dom";
import { Home, BarChart3, Users, Zap } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { BlogSection } from "@/components/blog/BlogSection";

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
            <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Home className="h-8 w-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-900">
                            AgentBio.net
                        </span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <a
                            href="#features"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Features
                        </a>
                        <Link
                            to="/pricing"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Pricing
                        </Link>
                        <Link
                            to="/auth/login"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Log In
                        </Link>
                        <Link
                            to="/auth/register"
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 md:py-32">
                <article className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        Built for Real Estate Professionals
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Professional Real Estate Agent
                        <span className="text-blue-600"> Portfolio Link</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Create your professional agent portfolio link to showcase sold properties, 
                        active listings, and testimonials. Capture qualified leads and convert 
                        social media traffic into clients with our purpose-built platform.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/auth/register"
                            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            Start Free Trial
                        </Link>
                        <a
                            href="#features"
                            className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:border-gray-400 transition-colors"
                        >
                            See How It Works
                        </a>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        No credit card required • Setup in 5 minutes
                    </p>
                </article>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white" aria-labelledby="features-heading">
                <div className="container mx-auto px-4">
                    <header className="text-center mb-16">
                        <h2 id="features-heading" className="text-4xl font-bold text-gray-900 mb-4">
                            Professional Agent Portfolio Builder Features
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Purpose-built for real estate agents. Create your professional 
                            realtor portfolio link with everything you need to showcase sold 
                            properties and convert leads.
                        </p>
                    </header>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Home className="h-8 w-8 text-blue-600" aria-hidden="true" />}
                            title="Agent Property Showcase Link"
                            description="Display your agent sold properties portfolio, active listings, and pending sales with stunning photos, prices, and property details. Mobile-optimized galleries for professional presentation."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-blue-600" aria-hidden="true" />}
                            title="Qualified Lead Capture"
                            description="Built-in buyer, seller, and home valuation forms designed for real estate professionals. Capture qualified leads with detailed questionnaires and agent client testimonials."
                        />
                        <FeatureCard
                            icon={
                                <BarChart3 className="h-8 w-8 text-blue-600" aria-hidden="true" />
                            }
                            title="Agent Analytics & Insights"
                            description="Track your professional portfolio performance with detailed analytics. Monitor profile views, link clicks, and lead sources. See which listings and sold properties get the most attention."
                        />
                    </div>
                </div>
            </section>

            {/* Blog Section */}
            <BlogSection limit={6} showSearch={true} showFilters={true} />

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 text-white" aria-labelledby="cta-heading">
                <div className="container mx-auto px-4 text-center">
                    <h2 id="cta-heading" className="text-4xl font-bold mb-4">
                        Create Your Professional Real Estate Agent Portfolio Link Today
                    </h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Join thousands of agents showcasing sold properties and capturing qualified leads
                    </p>
                    <Link
                        to="/auth/register"
                        className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                        aria-label="Get started with your free professional agent portfolio"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="container mx-auto px-4">
                    <nav className="text-center mb-4" aria-label="Footer navigation">
                        <Link to="/pricing" className="text-gray-400 hover:text-white mx-3">Pricing</Link>
                        <Link to="/privacy" className="text-gray-400 hover:text-white mx-3">Privacy Policy</Link>
                        <Link to="/terms" className="text-gray-400 hover:text-white mx-3">Terms of Service</Link>
                    </nav>
                    <p className="text-center">&copy; 2025 AgentBio.net - Professional Real Estate Agent Portfolio Links. All rights reserved.</p>
                </div>
            </footer>
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
        <div className="p-6 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
            </h3>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
