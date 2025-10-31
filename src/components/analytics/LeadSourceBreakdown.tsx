/**
 * Lead Source Breakdown Component
 * Displays performance metrics by lead source
 */

import { TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadSourceMetric } from "@/lib/analytics";

interface LeadSourceBreakdownProps {
    sources: LeadSourceMetric[];
    className?: string;
}

export function LeadSourceBreakdown({
    sources,
    className,
}: LeadSourceBreakdownProps) {
    const totalLeads = sources.reduce((sum, s) => sum + s.leads, 0);
    const totalRevenue = sources.reduce((sum, s) => sum + s.revenue, 0);

    // Sort by conversion rate
    const sortedSources = [...sources].sort(
        (a, b) => b.conversionRate - a.conversionRate
    );

    return (
        <div className={cn("bg-white p-6 rounded-lg border", className)}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Lead Sources</h3>
                <div className="flex gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {totalLeads} leads
                    </div>
                    <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />$
                        {totalRevenue.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {sortedSources.map((source) => (
                    <SourceCard
                        key={source.source}
                        source={source}
                        totalLeads={totalLeads}
                    />
                ))}
            </div>

            {sortedSources.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No lead source data available</p>
                </div>
            )}
        </div>
    );
}

interface SourceCardProps {
    source: LeadSourceMetric;
    totalLeads: number;
}

function SourceCard({ source, totalLeads }: SourceCardProps) {
    const leadPercentage = (source.leads / totalLeads) * 100;

    const getConversionColor = (rate: number) => {
        if (rate >= 20) return "text-green-600";
        if (rate >= 10) return "text-yellow-600";
        return "text-gray-600";
    };

    return (
        <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 capitalize">
                    {source.source}
                </h4>
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            "text-lg font-bold",
                            getConversionColor(source.conversionRate)
                        )}
                    >
                        {source.conversionRate.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500">conversion</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Lead share</span>
                    <span className="font-medium">
                        {leadPercentage.toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${leadPercentage}%` }}
                    />
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                    <p className="text-sm text-gray-600">Leads</p>
                    <p className="text-lg font-bold text-gray-900">
                        {source.leads}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Conversions</p>
                    <p className="text-lg font-bold text-gray-900">
                        {source.conversions}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-lg font-bold text-gray-900">
                        ${source.revenue.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* ROI if available */}
            {source.roi !== undefined && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <span className="text-sm text-gray-600">ROI</span>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span
                            className={cn(
                                "font-semibold",
                                source.roi > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            )}
                        >
                            {source.roi > 0 ? "+" : ""}
                            {source.roi.toFixed(1)}%
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
