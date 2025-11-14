import * as React from "react";
import { Link } from "react-router-dom";
import { Instagram, Home, Users, Star, TrendingUp, Check } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/hero";

export default function InstagramBioForRealtors() {
    const schema = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebPage",
                "@id": `${window.location.origin}/instagram-bio-for-realtors`,
                "url": `${window.location.origin}/instagram-bio-for-realtors`,
                "name": "Instagram Bio for Realtors That Actually Converts Followers into Leads",
                "description": "Transform your Instagram bio into a lead generation machine with AgentBio. Showcase listings, capture qualified buyer/seller leads, and book appointments directly from your Instagram link.",
            },
            {
                "@type": "HowTo",
                "name": "How to Turn Your Instagram Bio into a Lead Generation Machine",
                "step": [
                    {
                        "@type": "HowToStep",
                        "name": "Create Your AgentBio Link",
                        "text": "Sign up at AgentBio and create your professional real estate bio page in under 5 minutes."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Add Your Best Listings",
                        "text": "Upload property photos, add pricing, descriptions, and details for your active and sold listings."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Set Up Lead Forms",
                        "text": "Configure buyer inquiry forms, seller lead forms, and home valuation request forms to capture qualified leads."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Connect Your Calendar",
                        "text": "Integrate Calendly or Google Calendar so buyers can self-schedule showing appointments."
                    },
                    {
                        "@type": "HowToStep",
                        "name": "Promote Your Bio Link",
                        "text": "Add your AgentBio link to your Instagram bio and share it in Stories, Posts, and Reels."
                    }
                ]
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "How do I add a link to my Instagram bio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Go to your Instagram profile, tap Edit Profile, and paste your AgentBio link in the Website field. Your link will appear in your bio and can be accessed by tapping it. You can also add links to Instagram Stories using the link sticker when you have 10K+ followers or a verified account."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "What should I put in my real estate Instagram bio?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Include your name and credentials (Realtor, Broker), your service area, a clear value proposition (what you help with), a call-to-action, and your bio page link. Use emojis for visual breaks and keep it under 150 characters."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <>
            <SEOHead
                title="Instagram Bio for Realtors That Actually Converts Followers into Leads"
                description="Transform your Instagram bio into a lead generation machine with AgentBio. Showcase listings, capture qualified buyer/seller leads, and book appointments directly from your Instagram link."
                keywords={[
                    "Instagram bio for realtors",
                    "Instagram lead generation for realtors",
                    "real estate Instagram bio link",
                    "convert Instagram followers to leads",
                    "realtor Instagram bio page"
                ]}
                canonicalUrl={`${window.location.origin}/instagram-bio-for-realtors`}
                schema={schema}
            />
            <main className="min-h-screen bg-background">
                <PublicHeader />

                {/* Direct Answer Section */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>Real estate agents turn their Instagram bio into a lead generation machine</strong> by placing a specialized link in their profile that showcases property listings, captures buyer and seller inquiries, and books showing appointments. Unlike generic link tools, AgentBio is built specifically for real estate professionals to convert Instagram followers into qualified leads through mobile-optimized portfolio pages.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSection
                    title="Instagram Bio for Realtors That Actually Converts Followers into Leads"
                    subtitle="Stop Wasting Your Instagram Traffic on Basic Links"
                    description="Your Instagram followers are interested in buying or selling. Give them what they need: property listings, lead capture forms, and easy appointment booking—all from one mobile-optimized bio link."
                    primaryCta={{
                        text: "Create Your Instagram Bio Page Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See Instagram-Ready Examples",
                        href: "#examples"
                    }}
                    badge={{
                        icon: <Instagram className="h-4 w-4" aria-hidden="true" />,
                        text: "Optimized for Instagram Traffic"
                    }}
                    showStats={false}
                />

                {/* The Problem with Generic Instagram Bios for Real Estate Agents */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">The Problem with Generic Instagram Bios for Real Estate Agents</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <h3 className="text-xl font-light text-foreground mb-3">Can't Showcase Listings</h3>
                                <p className="glass-body">
                                    Generic links can't display property photos, pricing, or details. Your followers have to leave Instagram to see what you're selling.
                                </p>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <h3 className="text-xl font-light text-foreground mb-3">No Lead Capture</h3>
                                <p className="glass-body">
                                    Basic contact forms don't differentiate buyers from sellers or qualify leads. You're missing crucial information.
                                </p>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <h3 className="text-xl font-light text-foreground mb-3">No Buyer Intent Detection</h3>
                                <p className="glass-body">
                                    You can't tell if someone wants to buy, sell, or just browse. All leads look the same.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Turn Your Instagram Bio into a Lead Generation Machine */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">How to Turn Your Instagram Bio into a Lead Generation Machine</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                5 simple steps to transform your Instagram profile into a lead-generating real estate portfolio
                            </p>
                        </header>

                        <div className="max-w-4xl mx-auto space-y-8">
                            <StepCard
                                number={1}
                                title="Create Your AgentBio Link"
                                description="Sign up at AgentBio and create your professional real estate bio page in under 5 minutes. Choose your username (agentbio.net/yourname) and customize your profile."
                            />

                            <StepCard
                                number={2}
                                title="Add Your Best Listings"
                                description="Upload property photos, add pricing, descriptions, beds/baths, square footage, and MLS numbers. Feature your hottest properties at the top. Include sold properties for social proof."
                            />

                            <StepCard
                                number={3}
                                title="Set Up Lead Forms"
                                description="Configure buyer inquiry forms with pre-qualification questions, seller lead forms asking about timeline and motivation, and home valuation request forms to capture seller leads."
                            />

                            <StepCard
                                number={4}
                                title="Connect Your Calendar"
                                description="Integrate Calendly or Google Calendar so buyers can self-schedule showing appointments without phone tag. Set your availability and let buyers book directly."
                            />

                            <StepCard
                                number={5}
                                title="Promote Your Bio Link"
                                description="Add your AgentBio link to your Instagram bio. Share it in Stories using the link sticker. Mention it in Reels and Posts. Drive all your Instagram traffic to one optimized page."
                            />
                        </div>
                    </div>
                </section>

                {/* Instagram Bio Examples */}
                <section className="py-20 bg-background/50" id="examples">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Instagram Bio Examples from Top-Performing Agents</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <ExampleBio
                                name="Sarah Johnson"
                                bio="🏡 Austin Luxury Realtor | Helping first-time buyers find their dream home | 📲 Text me anytime | 👇 See my listings"
                                why="Clear value proposition, target audience specified, CTA included"
                            />

                            <ExampleBio
                                name="Mike Rodriguez"
                                bio="⭐ Top 1% Agent Miami | $50M+ Sold | Featured in Inman | 📅 Book a showing | 🏠 Browse homes below"
                                why="Social proof with specific numbers, credibility markers, clear CTA"
                            />

                            <ExampleBio
                                name="Emily Chen"
                                bio="Your Bay Area Realtor 🌉 | Buyer & Seller Representation | DRE #01234567 | 💬 Free consultation | 👇 Tap link"
                                why="License number for compliance, service area clear, lead capture focused"
                            />
                        </div>
                    </div>
                </section>

                {/* Instagram Bio Tips for Real Estate Agents */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Instagram Bio Tips for Real Estate Agents</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <Check className="h-5 w-5" />,
                                    tip: "Use emojis strategically to break up text and add visual interest"
                                },
                                {
                                    icon: <Check className="h-5 w-5" />,
                                    tip: "Include your service area so followers know if you can help them"
                                },
                                {
                                    icon: <Check className="h-5 w-5" />,
                                    tip: "Add your real estate license number for compliance and credibility"
                                },
                                {
                                    icon: <Check className="h-5 w-5" />,
                                    tip: "Mention your specialization (luxury, first-time buyers, investors)"
                                },
                                {
                                    icon: <Check className="h-5 w-5" />,
                                    tip: "Include social proof (awards, volume, years experience)"
                                },
                                {
                                    icon: <Check className="h-5 w-5" />,
                                    tip: "Have a clear call-to-action directing to your link"
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="flex-shrink-0 text-green-400 mt-1">
                                        {item.icon}
                                    </div>
                                    <p className="glass-body">{item.tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Instagram to Leads: Conversion Strategies That Work */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Instagram to Leads: Conversion Strategies That Work</span>
                            </h2>
                        </header>

                        <div className="max-w-5xl mx-auto space-y-6">
                            <StrategyCard
                                icon={<Instagram />}
                                title="Share Your Link in Every Story"
                                description="Use Instagram's link sticker in Stories to drive traffic to your AgentBio page. Add context: 'Tap to see full details' or 'Book a showing at the link.'"
                            />

                            <StrategyCard
                                icon={<Home />}
                                title="Feature One Hot Listing Per Day"
                                description="Post a property highlight in your feed or Stories, then direct followers to 'link in bio' to see all photos, pricing, and book a showing."
                            />

                            <StrategyCard
                                icon={<Users />}
                                title="Offer a Lead Magnet"
                                description="Provide free home valuations, buyer guides, or neighborhood reports through your bio link. Capture contact info in exchange for the resource."
                            />

                            <StrategyCard
                                icon={<TrendingUp />}
                                title="Use Instagram Reels with Strong CTAs"
                                description="End every Reel with 'Check out the full tour at the link in my bio' or 'See all my listings at the link above.' Drive Instagram viewers to your AgentBio page."
                            />
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Transform Your Instagram Bio into a Lead Machine</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Join 5,000+ real estate agents using AgentBio to convert Instagram followers into qualified buyer and seller leads
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Create Your Instagram Bio Page Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Instagram-optimized • Mobile-first design
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
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

function ExampleBio({ name, bio, why }: { name: string; bio: string; why: string }) {
    return (
        <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
            <div className="mb-4">
                <h3 className="text-lg font-light text-foreground mb-2">{name}</h3>
                <div className="p-4 bg-background/50 rounded-lg border border-glass-border/50">
                    <p className="glass-body italic">"{bio}"</p>
                </div>
            </div>
            <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm glass-body text-muted-foreground">{why}</p>
            </div>
        </div>
    );
}

function StrategyCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex items-start gap-6 p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border hover:border-[#80d0c7] transition-all">
            <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]">
                {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
            </div>
            <div>
                <h3 className="text-xl font-light tracking-tight text-foreground mb-2">{title}</h3>
                <p className="glass-body leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
