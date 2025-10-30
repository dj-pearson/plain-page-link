import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: number; // percentage change
    changeLabel?: string; // e.g., "vs last month"
    icon: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    trend?: "up" | "down" | "neutral";
}

export function StatsCard({
    title,
    value,
    change,
    changeLabel = "vs last period",
    icon: Icon,
    iconColor = "text-blue-600",
    iconBgColor = "bg-blue-100",
    trend = "neutral",
}: StatsCardProps) {
    const trendColor =
        trend === "up"
            ? "text-green-600"
            : trend === "down"
            ? "text-red-600"
            : "text-gray-600";
    const trendSymbol = trend === "up" ? "↑" : trend === "down" ? "↓" : "•";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("rounded-full p-2", iconBgColor)}>
                    <Icon className={cn("h-4 w-4", iconColor)} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change !== undefined && (
                    <p className={cn("text-xs font-medium mt-1", trendColor)}>
                        {trendSymbol} {Math.abs(change)}% {changeLabel}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
