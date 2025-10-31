/**
 * KPI Cards Component
 * Displays key performance indicators with trends
 */

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PerformanceMetric } from "@/lib/analytics";

interface KPICardsProps {
    metrics: PerformanceMetric[];
    className?: string;
}

export function KPICards({ metrics, className }: KPICardsProps) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                className
            )}
        >
            {metrics.map((metric) => (
                <KPICard key={metric.name} metric={metric} />
            ))}
        </div>
    );
}

interface KPICardProps {
    metric: PerformanceMetric;
}

function KPICard({ metric }: KPICardProps) {
    const getTrendIcon = () => {
        switch (metric.trend) {
            case "up":
                return <TrendingUp className="w-4 h-4" />;
            case "down":
                return <TrendingDown className="w-4 h-4" />;
            case "flat":
                return <Minus className="w-4 h-4" />;
        }
    };

    const getTrendColor = () => {
        switch (metric.trend) {
            case "up":
                return "text-green-600 bg-green-100";
            case "down":
                return "text-red-600 bg-red-100";
            case "flat":
                return "text-gray-600 bg-gray-100";
        }
    };

    const formatValue = () => {
        if (metric.unit === "$") {
            return `$${metric.value.toLocaleString()}`;
        } else if (metric.unit === "%") {
            return `${metric.value.toFixed(1)}%`;
        } else if (metric.unit === "min") {
            return `${Math.round(metric.value)} min`;
        }
        return metric.value.toLocaleString();
    };

    return (
        <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">
                    {metric.name}
                </h3>
                <div className={cn("p-2 rounded-full", getTrendColor())}>
                    {getTrendIcon()}
                </div>
            </div>

            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                    {formatValue()}
                </p>
            </div>

            <div className="mt-2 flex items-center gap-1">
                <span
                    className={cn(
                        "text-sm font-medium",
                        metric.trend === "up"
                            ? "text-green-600"
                            : metric.trend === "down"
                            ? "text-red-600"
                            : "text-gray-600"
                    )}
                >
                    {metric.change > 0 ? "+" : ""}
                    {metric.change.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">vs last period</span>
            </div>

            {metric.benchmark && (
                <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">
                        Benchmark: {metric.unit === "$" ? "$" : ""}
                        {metric.benchmark.toLocaleString()}
                        {metric.unit === "%" ? "%" : ""}
                    </p>
                </div>
            )}
        </div>
    );
}
