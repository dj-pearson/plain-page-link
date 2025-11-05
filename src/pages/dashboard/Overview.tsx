import { Eye, Users, MousePointerClick, TrendingUp } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useLinks } from "@/hooks/useLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { ProfileCompletionWidget } from "@/components/dashboard/ProfileCompletionWidget";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Overview() {
    const { stats, recentLeads, isLoading } = useAnalytics();
    const { links } = useLinks();

    const totalLinkClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);

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
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                    Welcome Back!
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                    Here's what's happening with your profile
                </p>
            </div>

            {/* Profile Completion Widget */}
            <ProfileCompletionWidget />

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
                            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                                No leads yet
                            </p>
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
                            <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                                No links added yet
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
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
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 hover:shadow-md transition-shadow active:scale-[0.98] cursor-pointer">
            <div className="flex items-center mb-2 sm:mb-3 md:mb-4">
                <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">{icon}</div>
            </div>
            <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">{label}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 break-all">{value}</p>
            </div>
        </div>
    );
}
