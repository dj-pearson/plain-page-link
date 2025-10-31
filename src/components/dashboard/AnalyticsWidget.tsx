/**
 * Analytics Widget Component
 * Quick stats dashboard for key metrics
 */

import {
    TrendingUp,
    TrendingDown,
    Eye,
    Users,
    DollarSign,
    Home,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsStat {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ComponentType<{ className?: string }>;
    trend?: "up" | "down" | "neutral";
}

interface AnalyticsWidgetProps {
    stats: AnalyticsStat[];
    period?: string;
    className?: string;
}

export function AnalyticsWidget({
    stats,
    period = "Last 30 days",
    className,
}: AnalyticsWidgetProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Quick Analytics</h3>
                <span className="text-sm text-gray-600">{period}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <AnalyticsCard key={index} stat={stat} />
                ))}
            </div>
        </div>
    );
}

function AnalyticsCard({ stat }: { stat: AnalyticsStat }) {
    const Icon = stat.icon || Home;
    const isPositive = stat.trend === "up";
    const isNegative = stat.trend === "down";

    return (
        <div className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
                <div
                    className={cn(
                        "p-2 rounded-lg",
                        isPositive && "bg-green-100",
                        isNegative && "bg-red-100",
                        !isPositive && !isNegative && "bg-gray-100"
                    )}
                >
                    <Icon
                        className={cn(
                            "w-4 h-4",
                            isPositive && "text-green-600",
                            isNegative && "text-red-600",
                            !isPositive && !isNegative && "text-gray-600"
                        )}
                    />
                </div>
                {stat.change !== undefined && (
                    <div
                        className={cn(
                            "flex items-center gap-1 text-xs font-medium",
                            isPositive && "text-green-600",
                            isNegative && "text-red-600",
                            !isPositive && !isNegative && "text-gray-600"
                        )}
                    >
                        {isPositive && <ArrowUp className="w-3 h-3" />}
                        {isNegative && <ArrowDown className="w-3 h-3" />}
                        {Math.abs(stat.change)}%
                    </div>
                )}
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
            {stat.changeLabel && (
                <div className="text-xs text-gray-500 mt-1">
                    {stat.changeLabel}
                </div>
            )}
        </div>
    );
}

// Pre-built analytics configurations
export const defaultRealEstateStats = (data: {
    totalListings: number;
    activeListings: number;
    totalViews: number;
    totalLeads: number;
    avgPrice: number;
    viewsChange?: number;
    leadsChange?: number;
}): AnalyticsStat[] => [
    {
        label: "Total Listings",
        value: data.totalListings,
        icon: Home,
        trend: "neutral",
    },
    {
        label: "Active Listings",
        value: data.activeListings,
        icon: TrendingUp,
        trend: "up",
    },
    {
        label: "Total Views",
        value: data.totalViews.toLocaleString(),
        change: data.viewsChange,
        changeLabel: data.viewsChange ? "vs last period" : undefined,
        icon: Eye,
        trend:
            data.viewsChange && data.viewsChange > 0
                ? "up"
                : data.viewsChange && data.viewsChange < 0
                ? "down"
                : "neutral",
    },
    {
        label: "Total Leads",
        value: data.totalLeads,
        change: data.leadsChange,
        changeLabel: data.leadsChange ? "vs last period" : undefined,
        icon: Users,
        trend:
            data.leadsChange && data.leadsChange > 0
                ? "up"
                : data.leadsChange && data.leadsChange < 0
                ? "down"
                : "neutral",
    },
];
