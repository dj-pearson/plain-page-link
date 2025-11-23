/**
 * Analytics Insights Widget
 * Provides actionable recommendations based on analytics data
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Lightbulb,
    ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Insight {
    id: string;
    type: "positive" | "warning" | "tip";
    title: string;
    description: string;
    action?: {
        label: string;
        href: string;
    };
}

interface InsightsWidgetProps {
    stats: {
        totalViews: number;
        totalLeads: number;
        conversionRate: number;
        topSources?: Array<{ source: string; count: number }>;
    };
    previousStats?: {
        totalViews: number;
        totalLeads: number;
        conversionRate: number;
    };
    listingsCount?: number;
    linksCount?: number;
}

export function InsightsWidget({
    stats,
    previousStats,
    listingsCount = 0,
    linksCount = 0,
}: InsightsWidgetProps) {
    const insights: Insight[] = [];

    // Calculate growth rates
    const viewsGrowth = previousStats
        ? ((stats.totalViews - previousStats.totalViews) / (previousStats.totalViews || 1)) * 100
        : 0;
    const leadsGrowth = previousStats
        ? ((stats.totalLeads - previousStats.totalLeads) / (previousStats.totalLeads || 1)) * 100
        : 0;

    // Positive trends
    if (viewsGrowth > 20) {
        insights.push({
            id: "views-growth",
            type: "positive",
            title: `Profile views up ${viewsGrowth.toFixed(0)}%`,
            description: "Your profile is getting great visibility! Keep sharing your link on social media.",
        });
    }

    if (leadsGrowth > 15) {
        insights.push({
            id: "leads-growth",
            type: "positive",
            title: `Leads increased ${leadsGrowth.toFixed(0)}%`,
            description: "Your lead generation is accelerating. Make sure to respond quickly to maintain momentum.",
            action: {
                label: "Check leads",
                href: "/dashboard/leads",
            },
        });
    }

    if (stats.conversionRate > 5) {
        insights.push({
            id: "high-conversion",
            type: "positive",
            title: `Strong ${stats.conversionRate}% conversion rate`,
            description: "You're converting visitors to leads at an excellent rate!",
        });
    }

    // Warnings and opportunities
    if (stats.totalViews > 100 && stats.conversionRate < 2) {
        insights.push({
            id: "low-conversion",
            type: "warning",
            title: "Conversion rate could be higher",
            description: "You're getting views but not many leads. Try adding clear call-to-action buttons.",
            action: {
                label: "Add CTAs",
                href: "/dashboard/links",
            },
        });
    }

    if (stats.totalViews < 50 && listingsCount > 0) {
        insights.push({
            id: "low-traffic",
            type: "warning",
            title: "Profile needs more visibility",
            description: "Share your profile link on Instagram, Facebook, and email signatures to increase traffic.",
        });
    }

    if (listingsCount === 0) {
        insights.push({
            id: "no-listings",
            type: "warning",
            title: "Add your first listing",
            description: "Profiles with property listings get 3x more leads. Showcase what you're selling!",
            action: {
                label: "Add listing",
                href: "/dashboard/listings",
            },
        });
    } else if (listingsCount < 3) {
        insights.push({
            id: "few-listings",
            type: "tip",
            title: "Add more listings",
            description: "Agents with 5+ listings convert 40% better. Add more properties to build credibility.",
            action: {
                label: "Add listings",
                href: "/dashboard/listings",
            },
        });
    }

    if (linksCount === 0) {
        insights.push({
            id: "no-links",
            type: "tip",
            title: "Add custom links",
            description: "Link to your website, calendar, and social media to give visitors more ways to connect.",
            action: {
                label: "Add links",
                href: "/dashboard/links",
            },
        });
    }

    // General tips
    if (stats.totalViews > 0 && stats.totalLeads === 0) {
        insights.push({
            id: "no-leads-yet",
            type: "tip",
            title: "First lead tips",
            description: "Add contact forms, showcase testimonials, and ensure your phone/email are visible.",
            action: {
                label: "Edit profile",
                href: "/dashboard/profile",
            },
        });
    }

    // If trending down
    if (viewsGrowth < -20) {
        insights.push({
            id: "views-declining",
            type: "warning",
            title: `Views down ${Math.abs(viewsGrowth).toFixed(0)}%`,
            description: "Increase your social media activity and consider updating your listings to boost visibility.",
        });
    }

    // If no insights, show default tip
    if (insights.length === 0) {
        insights.push({
            id: "keep-going",
            type: "positive",
            title: "You're doing great!",
            description: "Keep your profile updated with fresh listings and share it regularly to maintain growth.",
        });
    }

    const getIcon = (type: Insight["type"]) => {
        switch (type) {
            case "positive":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "warning":
                return <AlertCircle className="w-5 h-5 text-orange-600" />;
            case "tip":
                return <Lightbulb className="w-5 h-5 text-blue-600" />;
        }
    };

    const getBgColor = (type: Insight["type"]) => {
        switch (type) {
            case "positive":
                return "bg-green-50 border-green-200";
            case "warning":
                return "bg-orange-50 border-orange-200";
            case "tip":
                return "bg-blue-50 border-blue-200";
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    Insights & Recommendations
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {insights.slice(0, 5).map((insight) => (
                        <div
                            key={insight.id}
                            className={`p-4 rounded-lg border ${getBgColor(insight.type)}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(insight.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                                        {insight.title}
                                    </h4>
                                    <p className="text-sm text-gray-700 mb-2">
                                        {insight.description}
                                    </p>
                                    {insight.action && (
                                        <Link
                                            to={insight.action.href}
                                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                                        >
                                            {insight.action.label}
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
