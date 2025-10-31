/**
 * Insights Panel Component
 * Displays AI-generated insights and recommendations
 */

import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface InsightsPanelProps {
    insights: string[];
    className?: string;
}

export function InsightsPanel({ insights, className }: InsightsPanelProps) {
    return (
        <div className={cn("bg-white p-6 rounded-lg border", className)}>
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Key Insights</h3>
            </div>

            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <InsightCard key={index} insight={insight} />
                ))}
            </div>

            {insights.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No insights available yet</p>
                    <p className="text-sm mt-1">
                        Check back when you have more data
                    </p>
                </div>
            )}
        </div>
    );
}

interface InsightCardProps {
    insight: string;
}

function InsightCard({ insight }: InsightCardProps) {
    const getIcon = () => {
        if (
            insight.includes("📈") ||
            insight.includes("🚀") ||
            insight.includes("🎯")
        ) {
            return <TrendingUp className="w-5 h-5 text-green-600" />;
        } else if (insight.includes("⚠️") || insight.includes("🐌")) {
            return <AlertCircle className="w-5 h-5 text-orange-600" />;
        } else if (insight.includes("⚡") || insight.includes("🌟")) {
            return <CheckCircle className="w-5 h-5 text-blue-600" />;
        }
        return <Lightbulb className="w-5 h-5 text-yellow-600" />;
    };

    const getBackgroundColor = () => {
        if (
            insight.includes("📈") ||
            insight.includes("🚀") ||
            insight.includes("🎯")
        ) {
            return "bg-green-50 border-green-200";
        } else if (insight.includes("⚠️") || insight.includes("🐌")) {
            return "bg-orange-50 border-orange-200";
        } else if (insight.includes("⚡") || insight.includes("🌟")) {
            return "bg-blue-50 border-blue-200";
        }
        return "bg-yellow-50 border-yellow-200";
    };

    return (
        <div className={cn("p-4 rounded-lg border", getBackgroundColor())}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
                <p className="text-sm text-gray-700 leading-relaxed">
                    {insight}
                </p>
            </div>
        </div>
    );
}
