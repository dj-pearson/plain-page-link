import * as React from "react";
import { Link } from "react-router-dom";
import { Users, Home, TrendingUp, Check, Star } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSectionLazy } from "@/components/hero";
import { Breadcrumb } from "@/components/seo/Breadcrumb";
import { generateFAQSchema, generateCombinedSchema, FEATURE_FAQS } from "@/lib/faq-schema";

export default function LeadCapture() {
    // Generate FAQ schema for AI search optimization
    const faqSchema = generateFAQSchema(FEATURE_FAQS.leadCapture);

    const pageSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Lead Capture Forms for Real Estate Agents - AgentBio",
        "description": "Capture qualified buyer and seller leads with pre-built forms. Buyer inquiries, seller leads, and home valuation requests—all optimized for real estate.",
        "mainEntity": {
            "@type": "SoftwareApplication",
            "name": "AgentBio Lead Capture",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "featureList": [
                "Buyer inquiry forms with pre-qualification questions",
                "Seller lead forms with timeline and motivation tracking",
                "Home valuation request forms",
                "Email notifications for instant follow-up",
                "Lead scoring: Hot, Warm, Cold",
                "CRM integration ready"
            ]
        }
    };

    // Combine page schema with FAQ schema for comprehensive structured data
    const schema = generateCombinedSchema([pageSchema, faqSchema]);

    return (
        <>
            <SEOHead
                title="Lead Capture Forms for Real Estate Agents | Qualify Buyers & Sellers"
                description="Capture qualified buyer and seller leads with pre-built forms. Buyer inquiries, seller leads, and home valuation requests—all optimized for real estate."
                keywords={[
                    "real estate lead capture forms",
                    "buyer inquiry form",
                    "seller lead form",
                    "home valuation request",
                    "real estate lead generation"
                ]}
                canonicalUrl={`${window.location.origin}/features/lead-capture`}
                schema={schema}
                aiSearchOptimized={true}
                speakableSelectors={["h1", "h2", ".glass-body"]}
                citationTitle="Lead Capture Forms for Real Estate Agents"
                citationAuthor="AgentBio"
                citationDate={new Date().toISOString().split('T')[0]}
            />
            <main className="min-h-screen bg-background">
                <PublicHeader />

                {/* Breadcrumb Navigation */}
                <section className="py-4 bg-background/50 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <Breadcrumb
                            items={[
                                { name: "Home", url: window.location.origin },
                                { name: "Features", url: "/features/property-listings" },
                                { name: "Lead Capture", url: "/features/lead-capture" }
                            ]}
                        />
                    </div>
                </section>

                {/* Direct Answer */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio's lead capture forms help real estate agents qualify buyer and seller leads</strong> with pre-built forms for buyer inquiries, seller leads, and home valuation requests. Unlike generic contact forms, each form includes pre-qualification questions like budget, timeline, and motivation—giving you the information needed to prioritize hot leads and follow up effectively with instant email notifications.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSectionLazy
                    title="Lead Capture Forms Built for Real Estate"
                    subtitle="Stop Getting Generic 'Contact Me' Submissions—Get Qualified Leads"
                    description="Capture buyer budgets, seller timelines, and pre-qualification details automatically. Know which leads to call first."
                    primaryCta={{
                        text: "Start Capturing Leads Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See How It Works",
                        href: "#how-it-works"
                    }}
                    badge={{
                        icon: <Users className="h-4 w-4" aria-hidden="true" />,
                        text: "3 Form Types Included"
                    }}
                    showStats={false}
                />

                {/* The 3 Essential Forms */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">3 Essential Forms Every Agent Needs</span>
                            </h2>
                        </header>

                        <div className="max-w-5xl mx-auto space-y-8">
                            <FormTypeCard
                                icon={<Home />}
                                title="Buyer Inquiry Form"
                                description="Capture serious buyers with pre-qualification questions"
                                fields={[
                                    "Budget range (prevents unqualified leads)",
                                    "Timeline to purchase (urgent vs browsing)",
                                    "Pre-approval status (ready to buy?)",
                                    "Property preferences (beds/baths/location)",
                                    "Contact info and best time to call"
                                ]}
                                useCase="When buyers click on a listing, they can immediately submit their interest with budget and timeline details—helping you prioritize hot leads."
                            />

                            <FormTypeCard
                                icon={<TrendingUp />}
                                title="Seller Lead Form"
                                description="Qualify sellers by motivation and timeline"
                                fields={[
                                    "Property address (for CMA preparation)",
                                    "Timeline to sell (ready now vs exploring)",
                                    "Motivation to sell (job, downsize, upgrade)",
                                    "Current home value estimate",
                                    "Contact preferences"
                                ]}
                                useCase="Sellers exploring their options can request a market analysis. You get their address and timeline—perfect for follow-up with a CMA."
                            />

                            <FormTypeCard
                                icon={<Star />}
                                title="Home Valuation Request"
                                description="Attract seller leads with free valuations"
                                fields={[
                                    "Property address",
                                    "Beds/baths/square footage",
                                    "Reason for valuation request",
                                    "Timeline if considering selling",
                                    "Email for delivery"
                                ]}
                                useCase="The #1 lead magnet for seller leads. Homeowners request free valuations, you capture their info and deliver a CMA to start the relationship."
                            />
                        </div>
                    </div>
                </section>

                {/* Pre-Qualification Questions */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Why Pre-Qualification Questions Matter</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8 mb-12">
                                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <h3 className="text-xl font-light text-red-400 mb-4">❌ Generic Contact Forms Give You:</h3>
                                    <ul className="space-y-2 text-sm glass-body text-muted-foreground">
                                        <li>• Just a name and email</li>
                                        <li>• No budget information</li>
                                        <li>• No timeline context</li>
                                        <li>• Can't prioritize leads</li>
                                        <li>• Waste time on unqualified inquiries</li>
                                    </ul>
                                </div>

                                <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/20">
                                    <h3 className="text-xl font-light text-green-400 mb-4">✓ AgentBio Lead Forms Give You:</h3>
                                    <ul className="space-y-2 text-sm glass-body">
                                        <li>• Budget and pre-approval status</li>
                                        <li>• Exact timeline (30, 60, 90+ days)</li>
                                        <li>• Motivation and urgency level</li>
                                        <li>• Property preferences</li>
                                        <li>• Enough info to qualify before calling</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border text-center">
                                <p className="text-2xl font-light text-foreground mb-2">
                                    Result: Call the right leads first
                                </p>
                                <p className="glass-body text-muted-foreground">
                                    Pre-approved buyer looking in 30 days? Call immediately. Browsing with no timeline? Nurture campaign.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Instant Notifications */}
                <section className="py-20 bg-background/50" id="how-it-works">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Get Notified Instantly When Leads Submit</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <StepCard
                                number={1}
                                title="Lead Submits Form on Your Bio Page"
                                description="Visitor clicks 'Contact Me' or 'Request Home Valuation' and fills out the form with their details."
                            />

                            <StepCard
                                number={2}
                                title="You Get Email Notification Immediately"
                                description="Email arrives within seconds with all lead details: name, budget, timeline, pre-approval status, and message."
                            />

                            <StepCard
                                number={3}
                                title="Lead Appears in Your Dashboard"
                                description="Access all leads from your AgentBio dashboard. Sort by date, lead type, or status. Export to your CRM anytime."
                            />

                            <StepCard
                                number={4}
                                title="Follow Up While They're Hot"
                                description="Call or text within minutes while they're still thinking about their search. Fast response = higher conversion."
                            />
                        </div>
                    </div>
                </section>

                {/* Lead Scoring */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Automatic Lead Scoring: Hot, Warm, or Cold</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                AgentBio automatically scores leads based on their responses
                            </p>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-red-500/30">
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-sm font-light text-red-400">
                                        🔥 Hot Lead
                                    </span>
                                </div>
                                <h3 className="text-xl font-light text-foreground mb-3">Ready to Transact</h3>
                                <ul className="space-y-2 text-sm glass-body">
                                    <li>• Pre-approved buyers</li>
                                    <li>• 0-30 day timeline</li>
                                    <li>• Specific property interest</li>
                                    <li>• High motivation to sell</li>
                                </ul>
                                <p className="text-sm text-red-400 mt-4 font-light">→ Call within 5 minutes</p>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-yellow-500/30">
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-sm font-light text-yellow-400">
                                        ⚡ Warm Lead
                                    </span>
                                </div>
                                <h3 className="text-xl font-light text-foreground mb-3">Actively Looking</h3>
                                <ul className="space-y-2 text-sm glass-body">
                                    <li>• 30-90 day timeline</li>
                                    <li>• Budget defined</li>
                                    <li>• General area interest</li>
                                    <li>• Considering selling</li>
                                </ul>
                                <p className="text-sm text-yellow-400 mt-4 font-light">→ Call within 24 hours</p>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-blue-500/30">
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-light text-blue-400">
                                        ❄️ Cold Lead
                                    </span>
                                </div>
                                <h3 className="text-xl font-light text-foreground mb-3">Early Research</h3>
                                <ul className="space-y-2 text-sm glass-body">
                                    <li>• 90+ day timeline</li>
                                    <li>• Just browsing</li>
                                    <li>• Budget undefined</li>
                                    <li>• Information gathering</li>
                                </ul>
                                <p className="text-sm text-blue-400 mt-4 font-light">→ Add to nurture campaign</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ Section - Optimized for AI Search */}
                <section className="py-20 bg-background" id="faq">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Frequently Asked Questions</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Common questions about AgentBio's lead capture forms
                            </p>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-4">
                            {FEATURE_FAQS.leadCapture.map((faq, index) => (
                                <FAQCard key={index} question={faq.question} answer={faq.answer} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Start Capturing Qualified Leads Today</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Get buyer budgets, seller timelines, and pre-qualification details automatically
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Start Free Trial</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • All 3 form types included • Instant notifications
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function FormTypeCard({
    icon,
    title,
    description,
    fields,
    useCase
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    fields: string[];
    useCase: string;
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
                <h4 className="text-sm font-light text-foreground mb-3 uppercase tracking-wide">Fields Captured:</h4>
                <ul className="space-y-2">
                    {fields.map((field, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-[#80d0c7] flex-shrink-0 mt-0.5" />
                            <span className="text-sm glass-body">{field}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 bg-background/50 rounded-lg border border-glass-border/50">
                <p className="text-sm font-light text-foreground mb-1">Use Case:</p>
                <p className="text-sm glass-body text-muted-foreground">{useCase}</p>
            </div>
        </div>
    );
}

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
    return (
        <div className="flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white text-xl font-light">
                {number}
            </div>
            <div>
                <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
                <p className="glass-body leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

function FAQCard({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div
            className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border cursor-pointer transition-all hover:border-[#80d0c7]/50"
            onClick={() => setIsOpen(!isOpen)}
            itemScope
            itemType="https://schema.org/Question"
        >
            <div className="flex items-center justify-between">
                <h3
                    className="text-lg font-light tracking-tight text-foreground pr-4"
                    itemProp="name"
                >
                    {question}
                </h3>
                <span className={`text-[#80d0c7] transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </div>
            {isOpen && (
                <div
                    className="mt-4 pt-4 border-t border-glass-border/50"
                    itemScope
                    itemType="https://schema.org/Answer"
                    itemProp="acceptedAnswer"
                >
                    <p className="glass-body leading-relaxed" itemProp="text">{answer}</p>
                </div>
            )}
        </div>
    );
}
