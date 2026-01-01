import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { SearchAnalyticsDashboard } from "@/components/admin/SearchAnalyticsDashboard";
import { InsightsWidget } from "@/components/analytics/InsightsWidget";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonAnalytics } from "@/components/ui/skeleton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Eye,
    Users,
    UserPlus,
    TrendingUp,
    Calendar,
    Download,
    BarChart3,
    Search as SearchIcon,
} from "lucide-react";
import { useAnalytics, type TimeRange } from "@/hooks/useAnalytics";

export default function Analytics() {
    const [dateRange, setDateRange] = useState<TimeRange>("30d");
    const { stats, viewsData, leadsData, recentLeads, isLoading } = useAnalytics(dateRange);

    if (isLoading) {
        return <SkeletonAnalytics />;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header - Mobile optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
                        Track your profile performance, lead generation, and search visibility
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span className="text-xs sm:text-sm">
                                    {dateRange === "7d"
                                        ? "Last 7 days"
                                        : dateRange === "30d"
                                        ? "Last 30 days"
                                        : "Last 90 days"}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDateRange("7d")}>
                                Last 7 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDateRange("30d")}>
                                Last 30 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDateRange("90d")}>
                                Last 90 days
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        <span className="text-xs sm:text-sm">Export</span>
                    </Button>
                </div>
            </div>

            {/* Tabs for different analytics views */}
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 sm:w-auto">
                    <TabsTrigger value="overview" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Profile Analytics</span>
                        <span className="sm:hidden">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="search" className="gap-2">
                        <SearchIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Search Analytics</span>
                        <span className="sm:hidden">Search</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 sm:space-y-6">

            {/* Key Metrics - Mobile optimized 2-column grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatsCard
                    title="Total Views"
                    value={stats.totalViews.toLocaleString()}
                    icon={Eye}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                />
                <StatsCard
                    title="Unique Visitors"
                    value={stats.uniqueVisitors.toLocaleString()}
                    icon={Users}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                />
                <StatsCard
                    title="Total Leads"
                    value={stats.totalLeads}
                    icon={UserPlus}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                />
                <StatsCard
                    title="Conversion Rate"
                    value={`${stats.conversionRate}%`}
                    icon={TrendingUp}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                />
            </div>

            {/* Insights & Recommendations */}
            <InsightsWidget
                stats={stats}
                listingsCount={0}
                linksCount={0}
            />

            {/* Views Over Time Chart - Smaller height on mobile */}
            <AnalyticsChart
                title="Profile Views"
                description="Views and unique visitors over time"
                data={viewsData.length > 0 ? viewsData : [{ name: "No data", views: 0, visitors: 0 }]}
                series={[
                    { dataKey: "views", name: "Total Views", color: "#3B82F6" },
                    {
                        dataKey: "visitors",
                        name: "Unique Visitors",
                        color: "#10B981",
                    },
                ]}
                type="area"
                height={window.innerWidth < 640 ? 200 : 300}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Leads by Type */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Leads by Type</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Distribution of lead inquiries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leadsData.length > 0 ? (
                            <div className="space-y-2 sm:space-y-3">
                                {leadsData.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between py-2 min-h-[44px]"
                                    >
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
                                            <span className="text-xs sm:text-sm font-medium">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3">
                                            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                                                {item.value} leads
                                            </span>
                                            <span className="text-xs sm:text-sm font-semibold min-w-[35px] text-right">
                                                {stats.totalLeads > 0
                                                    ? ((item.value / stats.totalLeads) * 100).toFixed(0)
                                                    : 0}%
                                            </span>
                                        </div>
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

                {/* Recent Activity */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                            Latest profile interactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">
                            {stats.totalViews > 0
                                ? `${stats.totalViews} profile views`
                                : "No activity yet"}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Leads Table */}
            <LeadsTable
                leads={recentLeads}
                onLeadClick={(lead) => console.log("Lead clicked:", lead)}
            />
                </TabsContent>

                <TabsContent value="search" className="space-y-4 sm:space-y-6">
                    <SearchAnalyticsDashboard />
                </TabsContent>
            </Tabs>
        </div>
    );
}
