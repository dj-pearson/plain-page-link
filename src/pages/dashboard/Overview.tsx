import { Eye, Users, MousePointerClick, TrendingUp, PartyPopper, Check, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLinks } from "@/hooks/useLinks";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { ProfileCompletionWidget } from "@/components/dashboard/ProfileCompletionWidget";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { getPlanById } from "@/config/pricing-plans";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function Overview() {
    const { stats, recentLeads, isLoading } = useAnalytics();
    const { links } = useLinks();
    const { profile } = useProfile();
    const { subscription } = useSubscription();
    const { toast } = useToast();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const totalLinkClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);

    // Check if user is new (account created within last 48 hours)
    const isNewUser = profile?.created_at
        ? (new Date().getTime() - new Date(profile.created_at).getTime()) < (48 * 60 * 60 * 1000)
        : false;

    const greeting = isNewUser ? "Welcome to AgentBio!" : "Welcome Back!";
    const subtitle = isNewUser
        ? "Let's get your profile set up and start attracting clients"
        : "Here's what's happening with your profile";

    // Check for subscription success parameter
    useEffect(() => {
        if (searchParams.get('subscription') === 'success') {
            setShowSuccessModal(true);
            // Remove the query parameter
            navigate('/dashboard', { replace: true });
        }
    }, [searchParams, navigate]);

    // Get features from pricing config based on plan
    const getUnlockedFeatures = (planName: string | undefined) => {
        const planId = planName?.toLowerCase() || 'free';
        const plan = getPlanById(planId);

        if (!plan) return [];

        const features: string[] = [];
        const limits = plan.limits;

        // Add limits-based features
        features.push(limits.listings === -1 ? "Unlimited listings" : `${limits.listings} active listings`);
        features.push(limits.links === -1 ? "Unlimited custom links" : `${limits.links} custom links`);
        features.push(limits.testimonials === -1 ? "Unlimited testimonials" : `${limits.testimonials} testimonials`);
        features.push(limits.analyticsRetentionDays === -1 ? "Unlimited analytics history" : `${limits.analyticsRetentionDays}-day analytics`);

        // Add feature-based unlocks
        if (plan.features.customDomain) features.push("Custom domain support");
        if (plan.features.customThemes) features.push("Premium themes");
        if (plan.features.prioritySupport) features.push("Priority support");
        if (plan.features.leadScoring) features.push("Lead scoring");
        if (plan.features.aiListingDescriptions) features.push("AI listing descriptions");
        if (plan.features.followUpSequences) features.push("Follow-up sequences");
        if (plan.features.predictiveAnalytics) features.push("Predictive analytics");

        return features.slice(0, 7); // Return top 7 features
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    {greeting}
                    {profile?.full_name && !isNewUser && (
                        <span className="text-muted-foreground">, {profile.full_name.split(' ')[0]}</span>
                    )}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                    {subtitle}
                </p>
            </div>

            {/* Profile Completion Widget */}
            <ProfileCompletionWidget />

            {/* Quick Actions Widget */}
            <QuickActionsWidget />

            {/* Stats Grid - Mobile optimized with 2 columns on small screens */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <StatCard
                    icon={<Eye className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />}
                    label="Profile Views"
                    value={stats.totalViews.toLocaleString()}
                />
                <StatCard
                    icon={<Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />}
                    label="New Leads"
                    value={stats.totalLeads.toString()}
                />
                <StatCard
                    icon={
                        <MousePointerClick className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    }
                    label="Link Clicks"
                    value={totalLinkClicks.toLocaleString()}
                />
                <StatCard
                    icon={<TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />}
                    label="Conversion Rate"
                    value={`${stats.conversionRate}%`}
                />
            </div>

            {/* Recent Activity - Stacks on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Leads */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Recent Leads</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentLeads.length > 0 ? (
                            <div className="space-y-2 sm:space-y-3">
                                {recentLeads.slice(0, 5).map((lead) => (
                                    <div key={lead.id} className="flex items-center justify-between py-2 sm:py-2.5 border-b border-border last:border-0 gap-2 min-h-[44px]">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm sm:text-base truncate">{lead.name}</p>
                                            <p className="text-xs sm:text-sm text-muted-foreground truncate">{lead.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium ${
                                            lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                                            lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {lead.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 sm:py-8">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-3">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                                <h4 className="font-semibold text-sm mb-1">Start Capturing Leads</h4>
                                <p className="text-xs text-muted-foreground mb-3 max-w-xs mx-auto">
                                    Share your profile link to start receiving inquiries from potential clients
                                </p>
                                {profile?.username && (
                                    <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg max-w-xs mx-auto">
                                        <code className="text-xs truncate">agentbio.net/{profile.username}</code>
                                        <button
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(`${window.location.origin}/${profile.username}`);
                                                toast({ title: "Copied!", description: "Profile link copied to clipboard" });
                                            }}
                                            className="p-1 hover:bg-background rounded transition-colors"
                                        >
                                            <Copy className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Links */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Top Links</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {links.length > 0 ? (
                            <div className="space-y-2 sm:space-y-3">
                                {links
                                    .sort((a, b) => (b.click_count || 0) - (a.click_count || 0))
                                    .slice(0, 5)
                                    .map((link) => (
                                        <div key={link.id} className="flex items-center justify-between py-2 sm:py-2.5 border-b border-border last:border-0 gap-2 min-h-[44px]">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm sm:text-base truncate">{link.title}</p>
                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{link.url}</p>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm sm:text-base text-muted-foreground flex-shrink-0">
                                                <MousePointerClick className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="font-medium">{link.click_count || 0}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 sm:py-8">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mb-3">
                                    <MousePointerClick className="h-6 w-6 text-purple-600" />
                                </div>
                                <h4 className="font-semibold text-sm mb-1">Add Your First Link</h4>
                                <p className="text-xs text-muted-foreground mb-3 max-w-xs mx-auto">
                                    Add links to your website, social media, and other profiles
                                </p>
                                <Link
                                    to="/dashboard/links"
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Manage Links <ExternalLink className="h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Subscription Success Modal */}
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
                            <PartyPopper className="w-8 h-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-center text-2xl">
                            🎉 Welcome to {subscription?.plan_name}!
                        </DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Your subscription is now active. Here's what you just unlocked:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/50 rounded-lg p-4 my-4">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600" />
                            New Features Available:
                        </h4>
                        <ul className="space-y-2">
                            {getUnlockedFeatures(subscription?.plan_name).map((feature, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-4">
                            A confirmation email with your receipt has been sent to your email address.
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                            Get Started
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="bg-card rounded-lg border border-border p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
            <div className="flex items-center mb-2 sm:mb-3 md:mb-4">
                <div className="p-1.5 sm:p-2 bg-muted rounded-lg">{icon}</div>
            </div>
            <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground break-all">{value}</p>
            </div>
        </div>
    );
}
