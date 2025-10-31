/**
 * Conversion Funnel Component
 * Visualizes the lead conversion funnel with dropoff rates
 */

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/lib/analytics";

interface ConversionFunnelProps {
    stages: FunnelStage[];
    className?: string;
}

export function ConversionFunnel({ stages, className }: ConversionFunnelProps) {
    const maxCount = stages[0]?.count || 1;

    return (
        <div className={cn("bg-white p-6 rounded-lg border", className)}>
            <h3 className="text-lg font-semibold mb-6">Conversion Funnel</h3>

            <div className="space-y-2">
                {stages.map((stage, index) => (
                    <div key={stage.name}>
                        <FunnelStageCard
                            stage={stage}
                            maxCount={maxCount}
                            isFirst={index === 0}
                            isLast={index === stages.length - 1}
                        />
                        {!isLast &&
                            stage.dropoff !== undefined &&
                            stage.dropoff > 0 && (
                                <DropoffIndicator
                                    count={stage.dropoff}
                                    percentage={calculateDropoffPercentage(
                                        stage,
                                        stages[index + 1]
                                    )}
                                />
                            )}
                    </div>
                ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
                <StatItem
                    label="Overall Conversion"
                    value={`${stages[stages.length - 1].percentage.toFixed(
                        1
                    )}%`}
                />
                <StatItem
                    label="Total Conversions"
                    value={stages[stages.length - 1].count.toLocaleString()}
                />
                <StatItem
                    label="Total Dropoff"
                    value={calculateTotalDropoff(stages).toLocaleString()}
                />
            </div>
        </div>
    );
}

interface FunnelStageCardProps {
    stage: FunnelStage;
    maxCount: number;
    isFirst: boolean;
    isLast: boolean;
}

function FunnelStageCard({
    stage,
    maxCount,
    isFirst,
    isLast,
}: FunnelStageCardProps) {
    const widthPercentage = (stage.count / maxCount) * 100;

    const getColor = () => {
        if (stage.percentage >= 75) return "bg-green-500";
        if (stage.percentage >= 50) return "bg-yellow-500";
        if (stage.percentage >= 25) return "bg-orange-500";
        return "bg-red-500";
    };

    return (
        <div className="relative">
            {/* Funnel stage bar */}
            <div
                className={cn(
                    "relative mx-auto rounded-lg p-4 transition-all duration-300 hover:shadow-md",
                    getColor()
                )}
                style={{ width: `${Math.max(widthPercentage, 20)}%` }}
            >
                <div className="flex items-center justify-between text-white">
                    <div>
                        <h4 className="font-semibold">{stage.name}</h4>
                        <p className="text-sm opacity-90">
                            {stage.count.toLocaleString()} leads
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">
                            {stage.percentage.toFixed(1)}%
                        </p>
                        {!isFirst && (
                            <p className="text-xs opacity-90">of total</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

interface DropoffIndicatorProps {
    count: number;
    percentage: number;
}

function DropoffIndicator({ count, percentage }: DropoffIndicatorProps) {
    return (
        <div className="flex items-center justify-center py-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <ChevronDown className="w-4 h-4 text-red-500" />
                <span>
                    <span className="font-medium text-red-600">
                        {count.toLocaleString()}
                    </span>{" "}
                    dropped off ({percentage.toFixed(1)}%)
                </span>
            </div>
        </div>
    );
}

interface StatItemProps {
    label: string;
    value: string;
}

function StatItem({ label, value }: StatItemProps) {
    return (
        <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-600 mt-1">{label}</p>
        </div>
    );
}

function calculateDropoffPercentage(
    current: FunnelStage,
    next: FunnelStage
): number {
    if (current.count === 0) return 0;
    return ((current.count - next.count) / current.count) * 100;
}

function calculateTotalDropoff(stages: FunnelStage[]): number {
    if (stages.length < 2) return 0;
    return stages[0].count - stages[stages.length - 1].count;
}
