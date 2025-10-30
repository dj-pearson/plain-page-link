import { Link } from "react-router-dom";
import { Home, BarChart3, Users, Zap } from "lucide-react";

const Index = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
                        <a
                            href="#pricing"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Pricing
                        </a>
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
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                        <Zap className="h-4 w-4" />
                        Built for Real Estate Professionals
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                        Your Ultimate Real Estate
                        <span className="text-blue-600"> Link in Bio</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        Showcase listings, capture leads, and convert social
                        media traffic into clients. All in one beautiful,
                        mobile-optimized profile.
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
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Convert Leads
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Purpose-built for real estate agents. Not just
                            another link-in-bio tool.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Home className="h-8 w-8 text-blue-600" />}
                            title="Property Showcase"
                            description="Display active, pending, and sold listings with photos, prices, and details. Mobile-optimized galleries that look stunning."
                        />
                        <FeatureCard
                            icon={<Users className="h-8 w-8 text-blue-600" />}
                            title="Lead Capture Forms"
                            description="Built-in buyer, seller, and home valuation forms. Capture qualified leads with detailed questionnaires."
                        />
                        <FeatureCard
                            icon={
                                <BarChart3 className="h-8 w-8 text-blue-600" />
                            }
                            title="Analytics & Insights"
                            description="Track profile views, link clicks, and lead sources. See which listings get the most attention."
                        />
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-blue-600 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold mb-4">
                        Ready to Grow Your Real Estate Business?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Join thousands of agents using AgentBio.net
                    </p>
                    <Link
                        to="/auth/register"
                        className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors"
                    >
                        Get Started Free
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; 2025 AgentBio.net. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

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

export default Index;
