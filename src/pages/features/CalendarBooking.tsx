import * as React from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, MapPin, Check, Phone } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroSection } from "@/components/hero";

export default function CalendarBooking() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Calendar Booking Integration for Real Estate Agents - AgentBio",
        "description": "Let buyers self-schedule showing appointments with integrated Calendly and Google Calendar. Stop playing phone tag and book more showings automatically.",
    };

    return (
        <>
            <SEOHead
                title="Calendar Booking for Real Estate Showings | Schedule Appointments Automatically"
                description="Let buyers self-schedule showing appointments with integrated Calendly and Google Calendar. Stop playing phone tag and book more showings automatically."
                keywords={[
                    "real estate calendar booking",
                    "showing appointment scheduling",
                    "Calendly for realtors",
                    "automated showing scheduling",
                    "real estate appointment booking"
                ]}
                canonicalUrl={`${window.location.origin}/features/calendar-booking`}
                schema={schema}
            />
            <main className="min-h-screen bg-background">
                <PublicHeader />

                {/* Direct Answer */}
                <section className="py-8 bg-background/95 border-b border-glass-border">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg glass-body leading-relaxed">
                                <strong>AgentBio's calendar booking integration lets real estate agents enable self-scheduling</strong> for showing appointments through Calendly and Google Calendar connections. Buyers can book appointments directly from property listings without phone tag, automatically syncing to your calendar with property details, lead information, and showing preferences—all while you maintain full control over availability and buffer times between appointments.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Hero */}
                <HeroSection
                    title="Calendar Booking Integration"
                    subtitle="Stop Playing Phone Tag—Let Buyers Book Showings Automatically"
                    description="Integrated Calendly and Google Calendar support. Buyers self-schedule showings while you stay in control of your availability."
                    primaryCta={{
                        text: "Connect Your Calendar Free",
                        href: "/auth/register"
                    }}
                    secondaryCta={{
                        text: "See How It Works",
                        href: "#how-it-works"
                    }}
                    badge={{
                        icon: <Calendar className="h-4 w-4" aria-hidden="true" />,
                        text: "Calendly & Google Calendar"
                    }}
                    showStats={false}
                />

                {/* The Problem with Phone Tag */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">The Phone Tag Problem</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20">
                                    <h3 className="text-xl font-light text-red-400 mb-4">❌ Without Automated Booking:</h3>
                                    <ul className="space-y-3 text-sm glass-body">
                                        <li className="flex items-start gap-2">
                                            <span className="text-red-400 flex-shrink-0">1.</span>
                                            <span>Buyer sees listing, calls/texts to schedule</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-red-400 flex-shrink-0">2.</span>
                                            <span>You're showing another property, miss the call</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-red-400 flex-shrink-0">3.</span>
                                            <span>You call back 2 hours later, they don't answer</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-red-400 flex-shrink-0">4.</span>
                                            <span>Back-and-forth texts trying to find a time</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-red-400 flex-shrink-0">5.</span>
                                            <span>By the time you connect, they've moved on</span>
                                        </li>
                                    </ul>
                                    <p className="text-sm text-red-400 mt-6 font-light">Result: Lost showing, lost sale</p>
                                </div>

                                <div className="p-6 rounded-xl bg-green-500/5 border border-green-500/20">
                                    <h3 className="text-xl font-light text-green-400 mb-4">✓ With AgentBio Calendar Booking:</h3>
                                    <ul className="space-y-3 text-sm glass-body">
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 flex-shrink-0">1.</span>
                                            <span>Buyer sees listing, clicks "Schedule Showing"</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 flex-shrink-0">2.</span>
                                            <span>Your available times appear instantly</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 flex-shrink-0">3.</span>
                                            <span>They book a time that works for both of you</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 flex-shrink-0">4.</span>
                                            <span>Confirmation email sent to both parties</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-green-400 flex-shrink-0">5.</span>
                                            <span>Showing booked—you get notification with details</span>
                                        </li>
                                    </ul>
                                    <p className="text-sm text-green-400 mt-6 font-light">Result: Showing booked in 60 seconds</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-20 bg-background" id="how-it-works">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">How Calendar Booking Works</span>
                            </h2>
                        </header>

                        <div className="max-w-3xl mx-auto space-y-6">
                            <StepCard
                                number={1}
                                title="Connect Your Calendar (One-Time Setup)"
                                description="Link your Calendly or Google Calendar account to AgentBio. Takes 2 minutes. Set your availability, buffer times, and showing duration."
                            />

                            <StepCard
                                number={2}
                                title="Add Booking Button to Listings"
                                description="Every property listing gets a 'Schedule Showing' button. Buyers can book appointments directly from the listing they're interested in."
                            />

                            <StepCard
                                number={3}
                                title="Buyer Selects Available Time"
                                description="Your calendar shows only available slots. Buyer picks a time, enters their info, and confirms. Takes 30 seconds."
                            />

                            <StepCard
                                number={4}
                                title="Both Parties Get Confirmation"
                                description="Appointment syncs to your calendar with property address, buyer contact info, and showing details. Buyer gets email and SMS reminder."
                            />
                        </div>
                    </div>
                </section>

                {/* Features You Control */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Stay in Control of Your Schedule</span>
                            </h2>
                            <p className="text-xl glass-body max-w-3xl mx-auto">
                                Set your availability rules, buffer times, and showing preferences
                            </p>
                        </header>

                        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
                            {[
                                {
                                    icon: <Clock />,
                                    title: "Set Availability Windows",
                                    description: "Define exactly when you're available for showings. Different hours for weekdays vs weekends. Block out personal time."
                                },
                                {
                                    icon: <Calendar />,
                                    title: "Buffer Time Between Showings",
                                    description: "Automatically add 15-30 minutes between appointments for travel time. Never double-book yourself."
                                },
                                {
                                    icon: <MapPin />,
                                    title: "Showing Duration Control",
                                    description: "Set default showing length (30, 45, or 60 minutes). Customize per property type (open house vs private showing)."
                                },
                                {
                                    icon: <Phone />,
                                    title: "Require Phone Number",
                                    description: "Make phone numbers required so you can call/text if buyer is late or needs to reschedule."
                                },
                                {
                                    icon: <Check />,
                                    title: "Same-Day Booking Cutoff",
                                    description: "Prevent last-minute bookings by requiring X hours notice. Maintain control of your schedule."
                                },
                                {
                                    icon: <Calendar />,
                                    title: "Manual Approval Option",
                                    description: "Choose to auto-confirm or manually approve each showing request. Perfect for high-end listings."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 p-3 rounded-lg bg-gradient-to-br from-[#80d0c7]/10 to-[#a1c4fd]/10 text-[#80d0c7]">
                                            {React.cloneElement(feature.icon as React.ReactElement, { className: "h-5 w-5" })}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-light text-foreground mb-2">{feature.title}</h3>
                                            <p className="text-sm glass-body text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Integration Options */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">Works with Your Existing Tools</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="mb-6">
                                    <Calendar className="h-12 w-12 text-[#80d0c7] mb-4" />
                                    <h3 className="text-2xl font-light text-foreground mb-2">Calendly Integration</h3>
                                    <p className="glass-body text-muted-foreground">
                                        Already use Calendly? Connect your account in one click. Your existing availability rules sync automatically.
                                    </p>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm glass-body">One-click connection</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm glass-body">Syncs both ways</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm glass-body">All Calendly features work</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="p-8 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <div className="mb-6">
                                    <Calendar className="h-12 w-12 text-[#80d0c7] mb-4" />
                                    <h3 className="text-2xl font-light text-foreground mb-2">Google Calendar Integration</h3>
                                    <p className="glass-body text-muted-foreground">
                                        Use Google Calendar? Direct integration available. Showings appear in your calendar with all details.
                                    </p>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm glass-body">OAuth secure connection</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm glass-body">Respects existing appointments</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm glass-body">Mobile & desktop sync</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Real Agent Results */}
                <section className="py-20 bg-background/50">
                    <div className="container mx-auto px-4">
                        <header className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-foreground mb-4">
                                <span className="glass-heading">What Agents Say About Automated Booking</span>
                            </h2>
                        </header>

                        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <p className="glass-body italic mb-4">
                                    "I used to spend 2-3 hours per week playing phone tag just to schedule showings. Now buyers book themselves and I show up. It's that simple. Calendar booking alone is worth the AgentBio subscription."
                                </p>
                                <div>
                                    <p className="text-sm font-light text-foreground">Jessica T.</p>
                                    <p className="text-xs text-muted-foreground">Luxury Agent, Scottsdale AZ</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-xl bg-glass-background backdrop-blur-md border border-glass-border">
                                <p className="glass-body italic mb-4">
                                    "The best part? I get showings booked at 9pm, 11pm, whenever buyers are scrolling Instagram. They see a listing, book a showing immediately. I wake up to 2-3 appointments already scheduled."
                                </p>
                                <div>
                                    <p className="text-sm font-light text-foreground">Marcus L.</p>
                                    <p className="text-xs text-muted-foreground">Team Leader, Denver CO</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 bg-background">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl md:text-5xl font-light tracking-tight mb-4">
                            <span className="glass-heading">Stop Playing Phone Tag—Start Booking Showings</span>
                        </h2>
                        <p className="text-xl mb-8 glass-body max-w-2xl mx-auto">
                            Let buyers self-schedule showing appointments while you stay in control
                        </p>
                        <Link
                            to="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-glass-background backdrop-blur-md border border-glass-border rounded-xl font-light tracking-tight transition-all hover:border-[#80d0c7] hover:shadow-lg hover:shadow-[#80d0c7]/20"
                        >
                            <span className="glass-accent">Connect Your Calendar Free</span>
                        </Link>
                        <p className="text-sm text-muted-foreground font-light mt-4">
                            No credit card required • Calendly & Google Calendar supported
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
