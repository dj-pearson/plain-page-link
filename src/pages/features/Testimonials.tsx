import * as React from "react";
import { Link } from "react-router-dom";
import { Star, Users, Video, MessageSquare, Check, Trophy } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/hero";

export default function Testimonials() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Client Testimonials & Reviews Feature - AgentBio",
        "description": "Showcase client reviews, 5-star ratings, and success stories on your real estate bio page. Build instant credibility with social proof.",
    };

    return (
        <>
            <SEOHead
                title="Client Testimonials & Reviews | Build Trust with Social Proof"
                description="Showcase client reviews, 5-star ratings, and success stories on your real estate bio page. Build instant credibility with social proof."
                keywords={[
                    "real estate testimonials",
                    "agent bio with testimonials",
                    "client reviews display",
                    "social proof for realtors",
                    "5-star ratings real estate"
                ]}
                canonicalUrl={`${window.location.origin}/features/testimonials`}
                schema={schema}
            />
            <main className="min-h-screen bg-background">
                <PublicHeader />

                {/* Direct Answer */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio's testimonial showcase feature lets real estate agents display client reviews, 5-star ratings, and success stories</strong> prominently on their bio page to build instant credibility with new visitors. Unlike generic platforms, AgentBio includes dedicated testimonial sections with photo display, star ratings, client attribution, and video testimonial embedding—all optimized for mobile viewing from Instagram and social media traffic.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSection
                    title="Client Testimonials & Reviews"
                    subtitle="Turn Social Proof into Your Most Powerful Sales Tool"
                    description="Display 5-star reviews, client success stories, and video testimonials that convert skeptical visitors into confident clients."
                    primaryCta={{
                        text: "Start Showcasing Reviews Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See Examples",
                        href: "#examples"
                    }}
                    badge={{
                        icon: <Star className="h-4 w-4" aria-hidden="true" />,
                        text: "Unlimited Testimonials"
                    }}
                    showStats={false}
                />

                {/* Why Testimonials Matter */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Why Testimonials Are Your Secret Weapon</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                88% of consumers trust online reviews as much as personal recommendations
                            </p>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="mb-4">
                                        <div className="flex items-center gap-1 mb-2">
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            ))}
                                        </div>
                                        <p className="text-3xl font-light text-foreground">92%</p>
                                    </div>
                                    <p className="glass-body">
                                        of home buyers research agents online before making contact. Your testimonials are often the first impression.
                                    </p>
                                </div>

                                <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="mb-4">
                                        <Trophy className="h-12 w-12 text-[#80d0c7] mb-2" />
                                        <p className="text-3xl font-light text-foreground">3x</p>
                                    </div>
                                    <p className="glass-body">
                                        Agents with displayed testimonials convert Instagram followers into leads 3x more than agents without social proof.
                                    </p>
                                </div>

                                <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="mb-4">
                                        <MessageSquare className="h-12 w-12 text-[#80d0c7] mb-2" />
                                        <p className="text-3xl font-light text-foreground">72%</p>
                                    </div>
                                    <p className="glass-body">
                                        of buyers say positive reviews make them trust a business more. Testimonials overcome the skepticism barrier.
                                    </p>
                                </div>

                                <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="mb-4">
                                        <Users className="h-12 w-12 text-[#80d0c7] mb-2" />
                                        <p className="text-3xl font-light text-foreground">63%</p>
                                    </div>
                                    <p className="glass-body">
                                        of consumers are more likely to purchase from a site with reviews and ratings. Testimonials drive action.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonial Display Options */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Multiple Ways to Showcase Social Proof</span>
                            </h2>
                        </header>

                        <div className="max-w-5xl mx-auto space-y-8">
                            <TestimonialType
                                icon={<Star />}
                                title="5-Star Rating Display"
                                description="Show your overall rating at the top of your profile"
                                features={[
                                    "Aggregate rating from all testimonials",
                                    "Star display (4.8/5.0, 4.9/5.0, etc.)",
                                    "Total review count for credibility",
                                    "Automatically updates as you add reviews"
                                ]}
                            />

                            <TestimonialType
                                icon={<MessageSquare />}
                                title="Written Testimonials"
                                description="Full client reviews with names and photos"
                                features={[
                                    "Client name and photo (optional)",
                                    "Full testimonial text",
                                    "Property address or transaction type",
                                    "Date of transaction for recency",
                                    "Direct quotes with formatting"
                                ]}
                            />

                            <TestimonialType
                                icon={<Video />}
                                title="Video Testimonials"
                                description="Embed video reviews for maximum impact"
                                features={[
                                    "Upload or link to YouTube/Vimeo",
                                    "Thumbnail preview with play button",
                                    "Mobile-optimized video player",
                                    "Video testimonials convert 2x better than text"
                                ]}
                            />

                            <TestimonialType
                                icon={<Trophy />}
                                title="Success Story Highlights"
                                description="Before/after stories that showcase your results"
                                features={[
                                    "Challenge → Solution → Result format",
                                    "Include property photos",
                                    "Specific outcomes (sold in X days, $Y over asking)",
                                    "Turn testimonials into case studies"
                                ]}
                            />
                        </div>
                    </div>
                </section>

                {/* What Makes Great Testimonials */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">What Makes a Great Real Estate Testimonial</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: "Specific Results",
                                        good: "Sarah sold our home in 8 days for $15K over asking price",
                                        bad: "Sarah was great to work with",
                                        why: "Numbers and specifics build credibility"
                                    },
                                    {
                                        title: "Relatable Challenges",
                                        good: "We were first-time buyers overwhelmed by the process. Sarah walked us through every step.",
                                        bad: "Sarah helped us buy a house",
                                        why: "Helps prospects see themselves in the story"
                                    },
                                    {
                                        title: "Full Attribution",
                                        good: "John & Mary T., Austin TX (Closed March 2024)",
                                        bad: "Anonymous review",
                                        why: "Real names and locations = trust"
                                    },
                                    {
                                        title: "Emotional Connection",
                                        good: "Sarah found us our dream home in a competitive market when we'd almost given up",
                                        bad: "Good service",
                                        why: "Emotion drives decisions"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                        <h3 className="text-lg font-light text-foreground mb-4">{item.title}</h3>
                                        <div className="space-y-3 mb-4">
                                            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                                <p className="text-xs text-green-400 mb-1">✓ Good:</p>
                                                <p className="text-sm glass-body">"{item.good}"</p>
                                            </div>
                                            <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                                <p className="text-xs text-red-400 mb-1">✗ Bad:</p>
                                                <p className="text-sm glass-body">"{item.bad}"</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground italic">{item.why}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* How to Request Testimonials */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">How to Get Great Testimonials from Clients</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <StepCard
                                number={1}
                                title="Ask at the Right Time"
                                description="Request testimonials within 48 hours of closing while the positive experience is fresh. Emotional high = better reviews."
                            />

                            <StepCard
                                number={2}
                                title="Make It Easy with AgentBio"
                                description="Send clients your personalized review link (agentbio.net/yourname/review). They fill out a simple form—takes 2 minutes."
                            />

                            <StepCard
                                number={3}
                                title="Provide Guiding Questions"
                                description="'What was your biggest concern before working with me?' 'How did I help solve that?' Specific questions = specific testimonials."
                            />

                            <StepCard
                                number={4}
                                title="Offer Video Option"
                                description="Record a quick video testimonial on their phone. Video testimonials are 10x more powerful than text."
                            />

                            <StepCard
                                number={5}
                                title="Follow Up (Gently)"
                                description="If they don't respond in a week, send one friendly reminder. Most clients want to help—they just forget."
                            />
                        </div>
                    </div>
                </section>

                {/* Examples */}
                <section className="py-20 bg-background/50" id="examples">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Real Testimonial Examples</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="glass-body italic mb-4">
                                    "We were first-time homebuyers completely overwhelmed by the Austin market. Sarah not only found us the perfect house in our budget, but she negotiated $12K off the asking price and got the seller to cover closing costs. She answered our panicked texts at 10pm and walked us through every confusing document. We can't imagine having done this with anyone else."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white font-light">
                                        JM
                                    </div>
                                    <div>
                                        <p className="text-sm font-light text-foreground">John & Mary Thompson</p>
                                        <p className="text-xs text-muted-foreground">Closed March 2024 • Austin, TX</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="flex items-center gap-1 mb-4">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="glass-body italic mb-4">
                                    "Mike sold our house in 6 days for $25K over asking with multiple offers. His staging advice and professional photos made our home stand out. What impressed us most was his communication—daily updates, quick responses, and honest advice. If you want results, not excuses, call Mike."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#80d0c7] to-[#a1c4fd] flex items-center justify-center text-white font-light">
                                        RC
                                    </div>
                                    <div>
                                        <p className="text-sm font-light text-foreground">Robert Chen</p>
                                        <p className="text-xs text-muted-foreground">Closed January 2024 • San Francisco, CA</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Start Showcasing Your 5-Star Reviews</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Turn client testimonials into your most powerful marketing tool
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Add Your Testimonials Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Unlimited testimonials • Video support
                        </p>
                    </div>
                </section>

                <PublicFooter />
            </main>
        </>
    );
}

function TestimonialType({
    icon,
    title,
    description,
    features
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
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

            <ul className="space-y-2">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-[#80d0c7] flex-shrink-0 mt-0.5" />
                        <span className="text-sm glass-body">{feature}</span>
                    </li>
                ))}
            </ul>
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
