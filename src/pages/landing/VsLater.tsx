import { Check, X, ArrowRight, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { generateEnhancedOrganizationSchema } from "@/lib/seo";

export default function VsLater() {
  const canonicalUrl = `${window.location.origin}/vs/later`;
  const toolUrl = `${window.location.origin}/vs/later`;

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      // Enhanced Organization schema with social signals
      generateEnhancedOrganizationSchema(),
      {
        "@type": "WebPage",
        "@id": toolUrl,
        "url": toolUrl,
        "name": "AgentBio vs Later: Real Estate Link in Bio Comparison",
        "description": "Compare AgentBio and Later for real estate agents. See why real estate professionals choose AgentBio's specialized features over Later's social media scheduling tools.",
        "publisher": {
          "@type": "Organization",
          "name": "AgentBio",
        },
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What's the main difference between AgentBio and Later?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "AgentBio is built specifically for real estate agents with features like property listings, lead capture forms, and CRM integration. Later is primarily a social media scheduling tool with a link in bio feature as a secondary offering. AgentBio focuses on lead generation, while Later focuses on content scheduling.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I use Later for real estate link in bio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, but Later's link in bio feature lacks real estate-specific capabilities like property listing cards, MLS integration, buyer/seller forms, and CRM syncing. Most real estate agents find they need additional tools to capture and convert leads effectively.",
            },
          },
          {
            "@type": "Question",
            "name": "Does AgentBio include social media scheduling like Later?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "No, AgentBio focuses exclusively on optimizing your link in bio page for maximum lead conversion. For scheduling, agents typically use tools like Buffer, Hootsuite, or Later alongside AgentBio for the best of both worlds.",
            },
          },
          {
            "@type": "Question",
            "name": "Which is better for real estate agents: AgentBio or Later?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "For link in bio and lead generation, AgentBio is purpose-built for real estate with 3-5x higher conversion rates. For social media scheduling and content planning, Later excels. Many successful agents use both: Later for scheduling content and AgentBio for converting followers into leads.",
            },
          },
          {
            "@type": "Question",
            "name": "Can I migrate from Later to AgentBio?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes, migration takes 10-15 minutes. Simply recreate your links in AgentBio, update your Instagram bio URL, and optionally keep Later for social scheduling. You can run both platforms simultaneously if you need Later's scheduling features.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <Helmet>
        <title>AgentBio vs Later: Real Estate Link in Bio Comparison 2025</title>
        <meta
          name="description"
          content="Compare AgentBio and Later for real estate agents. Discover why AgentBio's real estate-focused features convert 3-5x more leads than Later's generic link in bio tool."
        />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <main id="main-content" className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5" tabIndex={-1}>
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <TrendingUp className="h-4 w-4" />
              Trusted by 3,000+ Real Estate Agents
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              AgentBio vs Later
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Later is great for scheduling Instagram posts. AgentBio is built
              to convert those posts into real estate leads.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/get-started">
                  Start Free with AgentBio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/demo">See Live Demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Direct Answer Section - GEO Optimization */}
        <section className="bg-white border-y border-gray-200 py-12">
          <div className="container max-w-4xl mx-auto px-4">
            <p className="text-base md:text-lg text-gray-700 leading-relaxed">
              <strong>
                AgentBio is a link in bio platform built specifically for real
                estate agents, while Later is primarily a social media
                scheduling tool with a basic link in bio feature.
              </strong>{" "}
              The key difference: AgentBio includes property listing showcases,
              built-in lead capture forms, CRM integration, calendar booking, and
              real estate templates designed to convert Instagram followers into
              clients. Later's link in bio is a secondary feature focused on
              driving traffic to scheduled posts rather than capturing leads.
              Real estate agents using AgentBio report 3-5x higher conversion
              rates compared to generic link tools because of specialized features
              like MLS integration, buyer/seller qualification forms, and
              automated CRM syncing. If your priority is scheduling Instagram
              content, Later excels. If your priority is converting followers into
              qualified real estate leads, AgentBio is purpose-built for that goal.
            </p>
          </div>
        </section>

        {/* Quick Comparison Overview */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              At a Glance
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* AgentBio Card */}
              <div className="glass-panel p-8 border-2 border-primary">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
                    A
                  </div>
                  <h3 className="text-2xl font-bold">AgentBio</h3>
                </div>

                <p className="text-lg font-semibold text-primary mb-4">
                  Real Estate Lead Generation Platform
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Property listing showcase with photos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Built-in lead capture forms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>CRM integration (auto-sync leads)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Real estate templates & branding</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Calendar booking integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>No social media scheduling</span>
                  </li>
                </ul>

                <div className="bg-primary/10 p-4 rounded-lg">
                  <p className="text-sm font-medium">Best For:</p>
                  <p className="text-sm text-muted-foreground">
                    Agents prioritizing lead capture and conversion from Instagram
                  </p>
                </div>
              </div>

              {/* Later Card */}
              <div className="glass-panel p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    L
                  </div>
                  <h3 className="text-2xl font-bold">Later</h3>
                </div>

                <p className="text-lg font-semibold text-purple-600 mb-4">
                  Social Media Scheduling Tool + Link in Bio
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Instagram post scheduling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Visual content calendar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Basic link in bio page</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Analytics for posts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>No property listing features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>No CRM integration</span>
                  </li>
                </ul>

                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">Best For:</p>
                  <p className="text-sm text-muted-foreground">
                    Agents who want content scheduling with basic link functionality
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Feature Comparison */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              See exactly what you get with each platform
            </p>

            <div className="glass-panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b-2 border-glass-border">
                    <tr>
                      <th className="py-4 px-4 text-left font-semibold">Feature</th>
                      <th className="py-4 px-4 text-center font-semibold">AgentBio</th>
                      <th className="py-4 px-4 text-center font-semibold">Later</th>
                    </tr>
                  </thead>
                  <tbody>
                    <ComparisonRow
                      feature="Link in Bio Page"
                      agentbio={true}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Unlimited Links"
                      agentbio={true}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Custom Branding"
                      agentbio={true}
                      later="Limited"
                    />
                    <ComparisonRow
                      feature="Property Listing Cards"
                      agentbio={true}
                      later={false}
                      description="Showcase listings with photos, prices, and details"
                    />
                    <ComparisonRow
                      feature="MLS/IDX Integration"
                      agentbio={true}
                      later={false}
                      description="Auto-sync active listings from MLS"
                    />
                    <ComparisonRow
                      feature="Lead Capture Forms"
                      agentbio={true}
                      later={false}
                      description="Built-in buyer/seller qualification forms"
                    />
                    <ComparisonRow
                      feature="CRM Integration"
                      agentbio={true}
                      later={false}
                      description="Auto-send leads to Follow Up Boss, LionDesk, etc."
                    />
                    <ComparisonRow
                      feature="Calendar Booking"
                      agentbio={true}
                      later={false}
                      description="Embedded appointment scheduling"
                    />
                    <ComparisonRow
                      feature="Real Estate Templates"
                      agentbio={true}
                      later={false}
                      description="Pre-designed pages for agents"
                    />
                    <ComparisonRow
                      feature="Video Testimonials"
                      agentbio={true}
                      later="Basic"
                    />
                    <ComparisonRow
                      feature="Lead Magnets/Downloads"
                      agentbio={true}
                      later="Via 3rd party"
                      description="Offer free guides in exchange for emails"
                    />
                    <ComparisonRow
                      feature="Analytics & Tracking"
                      agentbio="Advanced"
                      later="Basic"
                    />
                    <ComparisonRow
                      feature="Mobile Optimization"
                      agentbio={true}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Social Media Scheduling"
                      agentbio={false}
                      later={true}
                      description="Plan and auto-post Instagram content"
                    />
                    <ComparisonRow
                      feature="Visual Content Calendar"
                      agentbio={false}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Post Scheduling (Instagram)"
                      agentbio={false}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Media Library"
                      agentbio={false}
                      later={true}
                      description="Store and organize content for scheduling"
                    />
                    <ComparisonRow
                      feature="Hashtag Suggestions"
                      agentbio={false}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Best Time to Post"
                      agentbio={false}
                      later={true}
                    />
                    <ComparisonRow
                      feature="Pricing (Monthly)"
                      agentbio="$19"
                      later="$25-$80"
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Use Case Scenarios */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Which Platform is Right for You?
            </h2>

            <div className="space-y-8">
              {/* Scenario 1 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  You Need: Lead Generation from Instagram
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your primary goal is converting Instagram followers into qualified
                  buyer and seller leads who book consultations and close deals.
                </p>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="font-semibold text-primary">✓ Choose AgentBio</p>
                  <p className="text-sm mt-1">
                    Purpose-built for lead capture with forms, CRM sync, property
                    showcases, and calendar booking. Conversion-focused features
                    generate 3-5x more leads than generic link tools.
                  </p>
                </div>
              </div>

              {/* Scenario 2 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-500" />
                  You Need: Content Planning & Scheduling
                </h3>
                <p className="text-muted-foreground mb-4">
                  You want to batch-create Instagram content, schedule posts weeks
                  in advance, and maintain a consistent posting calendar.
                </p>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <p className="font-semibold text-purple-600">✓ Choose Later</p>
                  <p className="text-sm mt-1">
                    Industry-leading scheduling tools, visual calendar, media
                    library, and analytics for content performance. Perfect for
                    content planning workflow.
                  </p>
                </div>
              </div>

              {/* Scenario 3 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-500" />
                  You Need: Both Scheduling AND Lead Generation
                </h3>
                <p className="text-muted-foreground mb-4">
                  You want to plan content in advance AND maximize lead conversion
                  from your Instagram bio link.
                </p>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="font-semibold text-green-600">✓ Use Both Platforms</p>
                  <p className="text-sm mt-1">
                    Schedule posts with Later ($25/mo), capture leads with AgentBio
                    ($19/mo). Total: $44/month for complete Instagram marketing
                    stack. Many top agents run this combination.
                  </p>
                </div>
              </div>

              {/* Scenario 4 */}
              <div className="glass-panel p-6">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  You Need: Showcase Active Listings
                </h3>
                <p className="text-muted-foreground mb-4">
                  You want Instagram followers to browse your current listings with
                  photos, prices, and easy inquiry options.
                </p>
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <p className="font-semibold text-primary">✓ Choose AgentBio</p>
                  <p className="text-sm mt-1">
                    Property listing cards display photos, addresses, prices, and
                    link to full details. Update instantly when properties sell.
                    Later has no listing showcase features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agent Success Stories */}
        <section className="container mx-auto px-4 py-16 bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Real Agents, Real Results with AgentBio
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Testimonial 1 */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    MR
                  </div>
                  <div>
                    <p className="font-bold">Maria Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Tampa, FL</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "I was using Later for scheduling and their link in bio, but I
                  wasn't getting any leads. Switched to AgentBio and got 8 buyer
                  leads in the first month. The lead capture forms are a
                  game-changer."
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">8 leads/month</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">2 closings</span>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    JK
                  </div>
                  <div>
                    <p className="font-bold">James Kim</p>
                    <p className="text-sm text-muted-foreground">Austin, TX</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "I still use Later to schedule my posts—it's perfect for that.
                  But AgentBio handles my link in bio with property showcases and
                  CRM integration. Best of both worlds."
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">Uses both platforms</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">12 leads/month</span>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    SC
                  </div>
                  <div>
                    <p className="font-bold">Sarah Chen</p>
                    <p className="text-sm text-muted-foreground">San Diego, CA</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "Later is great for planning content, but it didn't help me
                  convert followers into clients. AgentBio's calendar booking and
                  lead forms do exactly that. My consultation bookings tripled."
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">3x more bookings</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">15 leads/month</span>
                </div>
              </div>

              {/* Testimonial 4 */}
              <div className="glass-panel p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                    DP
                  </div>
                  <div>
                    <p className="font-bold">David Park</p>
                    <p className="text-sm text-muted-foreground">Seattle, WA</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">
                  "The property listing cards in AgentBio showcase my homes
                  beautifully. Later's link in bio couldn't do that. Now my
                  listings get 10x more views from Instagram."
                </p>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="text-primary">10x listing views</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary">6 buyer leads/month</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Migration Guide */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
              Switch from Later to AgentBio in 15 Minutes
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Keep Later for scheduling, add AgentBio for lead generation
            </p>

            <div className="space-y-6">
              {[
                {
                  step: "1",
                  title: "Sign Up for AgentBio",
                  description:
                    "Create your free account at agentbio.io. Choose a username (agentbio.io/yourname).",
                },
                {
                  step: "2",
                  title: "Set Up Your Profile",
                  description:
                    "Add your headshot, bio, and brand colors. Use the same branding as your Instagram for consistency.",
                },
                {
                  step: "3",
                  title: "Add Your Property Listings",
                  description:
                    "Upload active listings with photos, prices, and details. Link to full listing pages on your website.",
                },
                {
                  step: "4",
                  title: "Create Lead Capture Forms",
                  description:
                    "Set up buyer questionnaire, seller consultation form, and home valuation request. Connect to your CRM.",
                },
                {
                  step: "5",
                  title: "Add Your Essential Links",
                  description:
                    "Calendar booking, testimonials, about page, contact info. Copy any relevant links from your Later page.",
                },
                {
                  step: "6",
                  title: "Update Instagram Bio",
                  description:
                    "Replace your Later link in bio URL with your new AgentBio link. Keep using Later for post scheduling!",
                },
              ].map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 glass-panel p-6 bg-primary/5 border border-primary/20">
              <p className="font-semibold mb-2">💡 Pro Tip: Use Both Platforms</p>
              <p className="text-sm text-muted-foreground">
                Most successful agents use Later ($25/mo) for scheduling Instagram
                content and AgentBio ($19/mo) for their link in bio page. You get
                the best content planning tools AND the best lead generation tools
                for $44/month total.
              </p>
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
                  What's the main difference between AgentBio and Later?
                </h3>
                <p className="text-muted-foreground">
                  AgentBio is built specifically for real estate agents with features
                  like property listings, lead capture forms, and CRM integration.
                  Later is primarily a social media scheduling tool with a link in bio
                  feature as a secondary offering. AgentBio focuses on lead
                  generation, while Later focuses on content scheduling.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Can I use Later for real estate link in bio?
                </h3>
                <p className="text-muted-foreground">
                  Yes, but Later's link in bio feature lacks real estate-specific
                  capabilities like property listing cards, MLS integration,
                  buyer/seller forms, and CRM syncing. Most real estate agents find
                  they need additional tools to capture and convert leads effectively.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Does AgentBio include social media scheduling like Later?
                </h3>
                <p className="text-muted-foreground">
                  No, AgentBio focuses exclusively on optimizing your link in bio page
                  for maximum lead conversion. For scheduling, agents typically use
                  tools like Buffer, Hootsuite, or Later alongside AgentBio for the
                  best of both worlds.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Which is better for real estate agents: AgentBio or Later?
                </h3>
                <p className="text-muted-foreground">
                  For link in bio and lead generation, AgentBio is purpose-built for
                  real estate with 3-5x higher conversion rates. For social media
                  scheduling and content planning, Later excels. Many successful agents
                  use both: Later for scheduling content and AgentBio for converting
                  followers into leads.
                </p>
              </div>

              <div className="glass-panel p-6">
                <h3 className="font-bold text-lg mb-2">
                  Can I migrate from Later to AgentBio?
                </h3>
                <p className="text-muted-foreground">
                  Yes, migration takes 10-15 minutes. Simply recreate your links in
                  AgentBio, update your Instagram bio URL, and optionally keep Later
                  for social scheduling. You can run both platforms simultaneously if
                  you need Later's scheduling features.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center glass-panel p-12 bg-gradient-to-br from-primary/10 to-accent/10">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Convert More Instagram Followers into Real Estate Leads?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join 3,000+ agents using AgentBio to capture leads, showcase listings,
              and book appointments directly from Instagram.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/get-started">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/for-real-estate-agents">Learn More</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              No credit card required • Set up in 10 minutes • Cancel anytime
            </p>
          </div>
        </section>

        {/* Internal Links */}
        <section className="container mx-auto px-4 py-8 border-t border-glass-border/30">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Explore more comparisons and features:
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/vs/linktree" className="text-primary hover:underline">
                AgentBio vs Linktree
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/vs/beacons" className="text-primary hover:underline">
                AgentBio vs Beacons
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/features/property-listings" className="text-primary hover:underline">
                Property Listing Features
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/features/lead-capture" className="text-primary hover:underline">
                Lead Capture Forms
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/for-real-estate-agents" className="text-primary hover:underline">
                For Real Estate Agents
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function ComparisonRow({
  feature,
  agentbio,
  later,
  description,
}: {
  feature: string;
  agentbio: boolean | string;
  later: boolean | string;
  description?: string;
}) {
  return (
    <tr className="border-b border-glass-border/30">
      <td className="py-4 px-4">
        <div className="font-normal">{feature}</div>
        {description && (
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        {typeof agentbio === "boolean" ? (
          agentbio ? (
            <Check className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <X className="h-5 w-5 text-red-400 mx-auto" />
          )
        ) : (
          <span className="text-sm">{agentbio}</span>
        )}
      </td>
      <td className="py-4 px-4 text-center">
        {typeof later === "boolean" ? (
          later ? (
            <Check className="h-5 w-5 text-green-500 mx-auto" />
          ) : (
            <X className="h-5 w-5 text-red-400 mx-auto" />
          )
        ) : (
          <span className="text-sm">{later}</span>
        )}
      </td>
    </tr>
  );
}
