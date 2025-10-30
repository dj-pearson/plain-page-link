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
    MessageSquare,
    Calendar,
    Download,
} from "lucide-react";
import type { Lead } from "@/types/lead";

// Mock data
const mockStats = {
    totalViews: 1234,
    viewsChange: 15.3,
    uniqueVisitors: 876,
    visitorsChange: 12.8,
    totalLeads: 45,
    leadsChange: 23.5,
    conversionRate: 3.65,
    conversionChange: 8.2,
};

const mockViewsData = [
    { name: "Oct 23", views: 35, visitors: 28 },
    { name: "Oct 24", views: 42, visitors: 35 },
    { name: "Oct 25", views: 38, visitors: 31 },
    { name: "Oct 26", views: 51, visitors: 42 },
    { name: "Oct 27", views: 45, visitors: 38 },
    { name: "Oct 28", views: 48, visitors: 40 },
    { name: "Oct 29", views: 39, visitors: 32 },
    { name: "Oct 30", views: 44, visitors: 36 },
];

const mockLeadsByType = [
    { name: "Buyer", value: 20, fill: "#3B82F6" },
    { name: "Seller", value: 15, fill: "#10B981" },
    { name: "Valuation", value: 8, fill: "#F59E0B" },
    { name: "Contact", value: 2, fill: "#6B7280" },
];

const mockTopListings = [
    { name: "Ocean View Estate", views: 234, inquiries: 12 },
    { name: "Coastal Lane", views: 189, inquiries: 8 },
    { name: "Downtown Condo", views: 156, inquiries: 6 },
];

const mockRecentLeads: Lead[] = [
    {
        id: 1,
        profile_id: 1,
        lead_type: "buyer",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "(555) 123-4567",
        message: "Looking for a 3BR home in La Jolla",
        status: "new",
        source: "profile_page",
        form_data: { property_type: "single-family", price_range: "500k-750k" },
        created_at: "2025-10-30T10:30:00Z",
        updated_at: "2025-10-30T10:30:00Z",
    },
    {
        id: 2,
        profile_id: 1,
        lead_type: "seller",
        name: "Bob Smith",
        email: "bob@example.com",
        phone: "(555) 987-6543",
        message: "Interested in selling my property",
        status: "contacted",
        source: "profile_page",
        form_data: { property_type: "single-family", timeline: "1-3-months" },
        created_at: "2025-10-29T14:15:00Z",
        updated_at: "2025-10-29T16:20:00Z",
    },
    {
        id: 3,
        profile_id: 1,
        lead_type: "valuation",
        name: "Alice Johnson",
        email: "alice@example.com",
        phone: "(555) 456-7890",
        message: "Want to know home value",
        status: "qualified",
        source: "profile_page",
        form_data: { property_type: "single-family", address: "123 Main St" },
        created_at: "2025-10-28T09:00:00Z",
        updated_at: "2025-10-29T11:30:00Z",
    },
];

export default function Analytics() {
    const [dateRange, setDateRange] = useState("30d");

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
                    value={mockStats.totalViews.toLocaleString()}
                    change={mockStats.viewsChange}
                    icon={Eye}
                    iconColor="text-blue-600"
                    iconBgColor="bg-blue-100"
                    trend="up"
                />
                <StatsCard
                    title="Unique Visitors"
                    value={mockStats.uniqueVisitors.toLocaleString()}
                    change={mockStats.visitorsChange}
                    icon={Users}
                    iconColor="text-green-600"
                    iconBgColor="bg-green-100"
                    trend="up"
                />
                <StatsCard
                    title="Total Leads"
                    value={mockStats.totalLeads}
                    change={mockStats.leadsChange}
                    icon={UserPlus}
                    iconColor="text-purple-600"
                    iconBgColor="bg-purple-100"
                    trend="up"
                />
                <StatsCard
                    title="Conversion Rate"
                    value={`${mockStats.conversionRate}%`}
                    change={mockStats.conversionChange}
                    icon={TrendingUp}
                    iconColor="text-orange-600"
                    iconBgColor="bg-orange-100"
                    trend="up"
                />
            </div>

            {/* Views Over Time Chart */}
            <AnalyticsChart
                title="Profile Views"
                description="Views and unique visitors over the last 30 days"
                data={mockViewsData}
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
                        <div className="space-y-3">
                            {mockLeadsByType.map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: item.fill,
                                            }}
                                        />
                                        <span className="text-sm font-medium">
                                            {item.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-muted-foreground">
                                            {item.value} leads
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {((item.value / 45) * 100).toFixed(
                                                0
                                            )}
                                            %
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performing Listings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Listings</CardTitle>
                        <CardDescription>
                            Most viewed properties this month
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockTopListings.map((listing, index) => (
                                <div
                                    key={listing.name}
                                    className="flex items-center gap-4"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {listing.name}
                                        </p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {listing.views} views
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {listing.inquiries} inquiries
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Leads Table */}
            <LeadsTable
                leads={mockRecentLeads}
                onLeadClick={(lead) => console.log("Lead clicked:", lead)}
            />
        </div>
    );
}
