import { useState } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { LeadsTable } from "@/components/dashboard/LeadsTable";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Eye,
    Users,
    UserPlus,
    TrendingUp,
    Calendar,
    Download,
} from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function Analytics() {
    const [dateRange, setDateRange] = useState("30d");
    const { stats, viewsData, leadsData, recentLeads, isLoading } = useAnalytics();

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Track your profile performance and lead generation
                        metrics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        {dateRange === "7d"
                            ? "Last 7 days"
                            : dateRange === "30d"
                            ? "Last 30 days"
                            : "Last 90 days"}
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Views Over Time Chart */}
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
                height={300}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leads by Type */}
                <Card>
                    <CardHeader>
                        <CardTitle>Leads by Type</CardTitle>
                        <CardDescription>
                            Distribution of lead inquiries
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {leadsData.length > 0 ? (
                            <div className="space-y-3">
                                {leadsData.map((item) => (
                                    <div
                                        key={item.name}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-primary" />
                                            <span className="text-sm font-medium">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-muted-foreground">
                                                {item.value} leads
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {stats.totalLeads > 0 
                                                    ? ((item.value / stats.totalLeads) * 100).toFixed(0)
                                                    : 0}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No leads yet
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest profile interactions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground text-center py-4">
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
        </div>
    );
}
