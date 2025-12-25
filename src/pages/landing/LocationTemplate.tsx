import { ArrowRight, Home, TrendingUp, Users, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Breadcrumb } from "@/components/seo/Breadcrumb";

export interface LocationData {
  city: string;
  state: string;
  stateAbbr: string;
  slug: string;
  medianPrice?: string;
  marketTrend?: string;
  agentCount?: string;
  marketDescription?: string;
  neighborhoods?: string[];
}

interface LocationTemplateProps {
  location: LocationData;
}

export default function LocationTemplate({ location }: LocationTemplateProps) {
  const { city, state, stateAbbr, slug, medianPrice, marketTrend, agentCount, marketDescription, neighborhoods } = location;

  const canonicalUrl = `${window.location.origin}/for/${slug}`;
  const pageTitle = `AgentBio for ${city} Real Estate Agents | Instagram Bio & Lead Generation`;
  const pageDescription = `Join ${city}, ${stateAbbr} real estate agents using AgentBio to convert Instagram followers into leads. Property listings, lead capture forms, and calendar booking built for ${city} agents.`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": canonicalUrl,
        "url": canonicalUrl,
        "name": pageTitle,
        "description": pageDescription,
        "publisher": {
          "@type": "Organization",
          "name": "AgentBio",
        },
      },
      {
        "@type": "LocalBusiness",
        "name": "AgentBio",
        "description": `Link in bio platform for ${city} real estate agents`,
        "areaServed": {
          "@type": "City",
          "name": city,
          "addressRegion": stateAbbr,
        },
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": `How do ${city} real estate agents use AgentBio?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `${city} real estate agents use AgentBio as their Instagram link in bio to showcase ${city} property listings, capture local buyer and seller leads, and book consultations. The platform is optimized for mobile traffic from Instagram and includes features specifically for real estate professionals.`,
            },
          },
          {
            "@type": "Question",
            "name": `Can I showcase ${city} property listings on AgentBio?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `Yes! AgentBio allows ${city} agents to display property listing cards with photos, addresses, prices, and details. You can update listings instantly when properties go pending or sell, ensuring your ${city} followers always see current inventory.`,
            },
          },
          {
            "@type": "Question",
            "name": `Does AgentBio work with ${city} MLS systems?`,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": `AgentBio integrates with major MLS and IDX providers used in ${city}. You can automatically sync your active ${city} listings or manually add properties with photos and details.`,
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
        {/* Breadcrumb Navigation */}
        <section className="container mx-auto px-4 pt-6">
          <Breadcrumb
            items={[
              { name: "Home", url: window.location.origin },
              { name: "Locations", url: "/for-real-estate-agents" },
              { name: `${city} Real Estate Agents`, url: `/for/${slug}` }
            ]}
          />
        </section>

        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-12 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="h-4 w-4" />
              Trusted by {city} Real Estate Professionals
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              The Link in Bio Platform for {city} Real Estate Agents
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Convert Instagram followers into {city} buyer and seller leads with property showcases, lead capture forms, and calendar booking—all in one link.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/demo">See Live Demo</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • Set up in 10 minutes • Cancel anytime
            </p>
          </div>
        </section>

        {/* Direct Answer Section - GEO Optimization */}
        <section className="bg-white border-y border-gray-200 py-12">
          <div className="container max-w-4xl mx-auto px-4">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <strong>
                AgentBio is a specialized link-in-bio platform designed for {city}, {state} real estate agents who want to convert Instagram followers into qualified leads.
              </strong>{" "}
              Unlike generic tools like Linktree or Beacons, AgentBio includes features specifically for real estate: {city} property listing galleries with photos and prices, built-in lead capture forms for buyer/seller qualification, calendar booking for consultation scheduling, and testimonial showcases. {city} agents use AgentBio to consolidate their property portfolio, contact information, and lead generation tools into one mobile-optimized link that turns Instagram traffic into actual clients. The platform integrates with popular CRM systems used by {city} real estate professionals and provides detailed analytics to track which {city} neighborhoods and property types generate the most engagement.
            </p>
          </div>
        </section>

        {/* Market Stats Section */}
        {(medianPrice || marketTrend || agentCount) && (
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                {city} Real Estate Market Overview
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {medianPrice && (
                  <div className="glass-panel p-6 text-center">
                    <Home className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-3xl font-bold mb-2">{medianPrice}</div>
                    <div className="text-muted-foreground">Median Home Price</div>
                  </div>
                )}

                {marketTrend && (
                  <div className="glass-panel p-6 text-center">
                    <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <div className="text-3xl font-bold mb-2">{marketTrend}</div>
                    <div className="text-muted-foreground">Market Trend</div>
                  </div>
                )}

                {agentCount && (
                  <div className="glass-panel p-6 text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <div className="text-3xl font-bold mb-2">{agentCount}</div>
                    <div className="text-muted-foreground">Active Agents</div>
                  </div>
                )}
              </div>

              {marketDescription && (
                <div className="mt-8 glass-panel p-6">
                  <p className="text-muted-foreground text-center">{marketDescription}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Why Choose AgentBio */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Why {city} Real Estate Agents Choose AgentBio
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Built specifically for real estate professionals in competitive markets like {city}
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="glass-panel p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Showcase {city} Property Listings</h3>
                    <p className="text-muted-foreground">
                      Display your active {city} listings with photos, addresses, prices, and details. Update instantly when properties sell or go pending.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Capture Local Buyer/Seller Leads</h3>
                    <p className="text-muted-foreground">
                      Built-in forms for buyer pre-qualification, seller consultations, and home valuations. Perfect for capturing serious {city} leads.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Mobile-Optimized for Instagram</h3>
                    <p className="text-muted-foreground">
                      90% of Instagram users are on mobile. Your AgentBio page loads fast and looks perfect on all devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Track {city} Market Engagement</h3>
                    <p className="text-muted-foreground">
                      See which {city} neighborhoods, property types, and price ranges generate the most clicks and leads.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Neighborhoods */}
        {neighborhoods && neighborhoods.length > 0 && (
          <section className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Popular {city} Neighborhoods for Real Estate Agents
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {neighborhoods.map((neighborhood, index) => (
                  <div key={index} className="glass-panel p-4 text-center hover:border-primary/50 transition-colors">
                    <p className="font-medium">{neighborhood}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Overview */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Everything {city} Agents Need in One Platform
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <Link to="/features/property-listings" className="glass-panel p-6 hover:border-primary/50 transition-colors">
                <Home className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Property Listings</h3>
                <p className="text-muted-foreground text-sm">
                  Showcase {city} properties with beautiful listing cards
                </p>
              </Link>

              <Link to="/features/lead-capture" className="glass-panel p-6 hover:border-primary/50 transition-colors">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Lead Capture</h3>
                <p className="text-muted-foreground text-sm">
                  Built-in forms for buyer/seller qualification
                </p>
              </Link>

              <Link to="/features/calendar-booking" className="glass-panel p-6 hover:border-primary/50 transition-colors">
                <CheckCircle className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Calendar Booking</h3>
                <p className="text-muted-foreground text-sm">
                  Let {city} clients schedule consultations instantly
                </p>
              </Link>

              <Link to="/features/testimonials" className="glass-panel p-6 hover:border-primary/50 transition-colors">
                <Star className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Testimonials</h3>
                <p className="text-muted-foreground text-sm">
                  Display reviews from happy {city} clients
                </p>
              </Link>

              <Link to="/features/analytics" className="glass-panel p-6 hover:border-primary/50 transition-colors">
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Analytics</h3>
                <p className="text-muted-foreground text-sm">
                  Track what resonates with {city} buyers
                </p>
              </Link>

              <div className="glass-panel p-6">
                <CheckCircle className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">CRM Integration</h3>
                <p className="text-muted-foreground text-sm">
                  Auto-sync leads to your existing system
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Success Stories from {city} Agents
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {city.charAt(0)}A
                  </div>
                  <div>
                    <p className="font-bold">{city} Agent</p>
                    <p className="text-sm text-muted-foreground">Residential Specialist</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "AgentBio helped me convert my Instagram followers into real {city} buyers. I've closed 3 deals in the past 2 months directly from Instagram leads."
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">3 closings</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">15 leads/month</span>
                </div>
              </div>

              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    {city.charAt(0)}B
                  </div>
                  <div>
                    <p className="font-bold">{city} Team Lead</p>
                    <p className="text-sm text-muted-foreground">Luxury Properties</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "The property listing cards make it so easy to showcase my {city} luxury homes. My Instagram followers love browsing properties right from my bio link."
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">$2M+ in sales</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">10x engagement</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  How do {city} real estate agents use AgentBio?
                </h3>
                <p className="text-muted-foreground">
                  {city} real estate agents use AgentBio as their Instagram link in bio to showcase {city} property listings, capture local buyer and seller leads, and book consultations. The platform is optimized for mobile traffic from Instagram and includes features specifically for real estate professionals.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Can I showcase {city} property listings on AgentBio?
                </h3>
                <p className="text-muted-foreground">
                  Yes! AgentBio allows {city} agents to display property listing cards with photos, addresses, prices, and details. You can update listings instantly when properties go pending or sell, ensuring your {city} followers always see current inventory.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Does AgentBio work with {city} MLS systems?
                </h3>
                <p className="text-muted-foreground">
                  AgentBio integrates with major MLS and IDX providers used in {city}. You can automatically sync your active {city} listings or manually add properties with photos and details.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  How much does AgentBio cost for {city} agents?
                </h3>
                <p className="text-muted-foreground">
                  AgentBio pricing starts at $19/month with a free trial. All plans include unlimited property listings, lead capture forms, calendar booking, and analytics—perfect for growing {city} real estate businesses.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Can I customize my AgentBio page for {city} branding?
                </h3>
                <p className="text-muted-foreground">
                  Absolutely! You can customize colors, fonts, logos, and background images to match your personal brand or brokerage guidelines. Many {city} agents maintain consistent branding across Instagram, their website, and AgentBio.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center glass-panel p-12 bg-gradient-to-br from-primary/10 to-accent/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join {city} Real Estate Agents Growing Their Business with AgentBio
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start converting your Instagram followers into {city} buyer and seller leads today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Set up in 10 minutes • Used by {city} professionals
            </p>
          </div>
        </section>

        {/* Internal Links */}
        <section className="container mx-auto px-4 py-8 border-t border-glass-border/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Explore more resources for real estate agents:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/for-real-estate-agents" className="text-primary hover:underline">
                For Real Estate Agents
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/instagram-bio-for-realtors" className="text-primary hover:underline">
                Instagram Bio Tips
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/tools/instagram-bio-analyzer" className="text-primary hover:underline">
                Free Bio Analyzer
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/tools/listing-description-generator" className="text-primary hover:underline">
                Listing Generator
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
