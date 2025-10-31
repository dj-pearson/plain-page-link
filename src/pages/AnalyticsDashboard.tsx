/**
 * Analytics Dashboard Page
 * Comprehensive analytics with insights, funnels, and reports
 */

import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { KPICards } from "@/components/analytics/KPICards";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";
import { LeadSourceBreakdown } from "@/components/analytics/LeadSourceBreakdown";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import {
    ReportBuilder,
    type ReportConfig,
} from "@/components/analytics/ReportBuilder";
import {
    calculateKPIs,
    generateTimeSeries,
    calculateFunnel,
    analyzeLeadSources,
    predictTrend,
    generateInsights,
    type AnalyticsData,
    type TimeSeriesData,
} from "@/lib/analytics";
import { subDays } from "date-fns";
import { BarChart3, TrendingUp, Users, FileText } from "lucide-react";

// Mock data generator (replace with actual API calls)
const generateMockData = (): {
    current: AnalyticsData;
    previous: AnalyticsData;
} => {
    const now = new Date();

    return {
        current: {
            pageViews: 3542,
            uniqueVisitors: 1876,
            leads: 156,
            conversions: 23,
            revenue: 156000,
            avgResponseTime: 12,
            period: "month",
            startDate: subDays(now, 30),
            endDate: now,
        },
        previous: {
            pageViews: 2890,
            uniqueVisitors: 1520,
            leads: 128,
            conversions: 18,
            revenue: 122000,
            avgResponseTime: 18,
            period: "month",
            startDate: subDays(now, 60),
            endDate: subDays(now, 30),
        },
    };
};

const generateMockTimeSeriesData = (): TimeSeriesData[] => {
    const now = new Date();
    return generateTimeSeries(subDays(now, 30), now, (date) => {
        // Simulate varying leads per day with some randomness
        const base = 5;
        const variance = Math.random() * 8;
        const trend =
            (date.getTime() - subDays(now, 30).getTime()) /
            (1000 * 60 * 60 * 24 * 30);
        return Math.round(base + variance + trend * 5);
    });
};

const generateMockLeadSources = () => {
    return [
        {
            source: "zillow",
            leads: 45,
            conversions: 12,
            revenue: 85000,
            cost: 5000,
        },
        {
            source: "realtor",
            leads: 38,
            conversions: 8,
            revenue: 62000,
            cost: 4000,
        },
        {
            source: "facebook",
            leads: 32,
            conversions: 5,
            revenue: 38000,
            cost: 3500,
        },
        {
            source: "google",
            leads: 28,
            conversions: 4,
            revenue: 31000,
            cost: 4500,
        },
        {
            source: "website",
            leads: 25,
            conversions: 3,
            revenue: 28000,
            cost: 1000,
        },
        {
            source: "referral",
            leads: 18,
            conversions: 4,
            revenue: 45000,
            cost: 0,
        },
    ];
};

export default function AnalyticsDashboard() {
    const [showPredictions, setShowPredictions] = useState(true);

    // Generate mock data
    const { current, previous } = useMemo(() => generateMockData(), []);
    const timeSeriesData = useMemo(() => generateMockTimeSeriesData(), []);
    const predictions = useMemo(
        () => predictTrend(timeSeriesData, 7),
        [timeSeriesData]
    );
    const combinedData = [
        ...timeSeriesData,
        ...(showPredictions ? predictions : []),
    ];

    // Calculate metrics
    const kpis = useMemo(
        () => calculateKPIs(current, previous),
        [current, previous]
    );

    const funnel = useMemo(
        () =>
            calculateFunnel({
                visitors: current.uniqueVisitors,
                viewed: Math.round(current.uniqueVisitors * 0.7),
                contacted: current.leads,
                qualified: Math.round(current.leads * 0.4),
                converted: current.conversions,
            }),
        [current]
    );

    const leadSources = useMemo(
        () => analyzeLeadSources(generateMockLeadSources()),
        []
    );

    const insights = useMemo(
        () => generateInsights(current, previous, leadSources),
        [current, previous, leadSources]
    );

    const handleGenerateReport = async (
        config: ReportConfig
    ): Promise<any[]> => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Return mock data based on report type
        switch (config.reportType) {
            case "leads":
                return Array.from({ length: 50 }, (_, i) => ({
                    id: `L${i + 1}`,
                    name: `Lead ${i + 1}`,
                    email: `lead${i + 1}@example.com`,
                    source: leadSources[i % leadSources.length].source,
                    status: ["new", "contacted", "qualified", "converted"][
                        Math.floor(Math.random() * 4)
                    ],
                    score: Math.floor(Math.random() * 100),
                    created: new Date().toISOString(),
                }));

            case "sources":
                return leadSources.map((s) => ({
                    source: s.source,
                    leads: s.leads,
                    conversions: s.conversions,
                    conversion_rate: `${s.conversionRate.toFixed(1)}%`,
                    revenue: s.revenue,
                    roi: s.roi ? `${s.roi.toFixed(1)}%` : "N/A",
                }));

            default:
                return [
                    {
                        metric: "Page Views",
                        current: current.pageViews,
                        previous: previous.pageViews,
                        change: `${(
                            ((current.pageViews - previous.pageViews) /
                                previous.pageViews) *
                            100
                        ).toFixed(1)}%`,
                    },
                    {
                        metric: "Leads",
                        current: current.leads,
                        previous: previous.leads,
                        change: `${(
                            ((current.leads - previous.leads) /
                                previous.leads) *
                            100
                        ).toFixed(1)}%`,
                    },
                    {
                        metric: "Conversions",
                        current: current.conversions,
                        previous: previous.conversions,
                        change: `${(
                            ((current.conversions - previous.conversions) /
                                previous.conversions) *
                            100
                        ).toFixed(1)}%`,
                    },
                ];
        }
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">
                        Track your performance and gain insights
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-4 py-2">
                        Last 30 Days
                    </Badge>
                </div>
            </div>

            {/* KPIs */}
            <KPICards metrics={kpis} />

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="overview" className="gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="funnel" className="gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Funnel
                    </TabsTrigger>
                    <TabsTrigger value="sources" className="gap-2">
                        <Users className="w-4 h-4" />
                        Sources
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="gap-2">
                        <FileText className="w-4 h-4" />
                        Reports
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <TimeSeriesChart
                                data={combinedData}
                                title="Lead Generation Trend"
                                color="#2563eb"
                                showPredictions={showPredictions}
                            />
                        </div>
                        <InsightsPanel insights={insights} />
                    </div>
                </TabsContent>

                {/* Funnel Tab */}
                <TabsContent value="funnel" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ConversionFunnel stages={funnel} />
                        <div className="space-y-6">
                            <InsightsPanel insights={insights} />
                            <div className="bg-white p-6 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-4">
                                    Optimization Tips
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>
                                            Improve Viewed → Contacted rate with
                                            clearer CTAs
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>
                                            Reduce dropoff with faster response
                                            times
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>
                                            Qualify leads better with targeted
                                            questions
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        <span>
                                            Nurture qualified leads with
                                            follow-ups
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* Sources Tab */}
                <TabsContent value="sources" className="mt-6">
                    <LeadSourceBreakdown sources={leadSources} />
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-4">
                                    Available Reports
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ReportCard
                                        title="Leads Report"
                                        description="Detailed lead data with scores and sources"
                                        icon={<Users className="w-6 h-6" />}
                                    />
                                    <ReportCard
                                        title="Performance Report"
                                        description="Overall performance metrics and trends"
                                        icon={
                                            <TrendingUp className="w-6 h-6" />
                                        }
                                    />
                                    <ReportCard
                                        title="Sources Report"
                                        description="Lead source analysis with ROI"
                                        icon={<BarChart3 className="w-6 h-6" />}
                                    />
                                    <ReportCard
                                        title="Conversion Report"
                                        description="Conversion funnel and rates"
                                        icon={
                                            <TrendingUp className="w-6 h-6" />
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <ReportBuilder
                            onGenerateReport={handleGenerateReport}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

// Report Card Component
interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
}

function ReportCard({ title, description, icon }: ReportCardProps) {
    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {icon}
                </div>
                <div>
                    <h4 className="font-semibold mb-1">{title}</h4>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
            </div>
        </div>
    );
}
