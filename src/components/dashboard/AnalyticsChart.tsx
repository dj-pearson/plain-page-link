import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

export type ChartType = "line" | "area" | "bar";

interface DataPoint {
    name: string; // x-axis label (e.g., date)
    [key: string]: string | number; // dynamic keys for multiple series
}

interface Series {
    dataKey: string;
    name: string;
    color: string;
}

interface AnalyticsChartProps {
    title: string;
    description?: string;
    data: DataPoint[];
    series: Series[];
    type?: ChartType;
    height?: number;
    showLegend?: boolean;
    yAxisLabel?: string;
}

export function AnalyticsChart({
    title,
    description,
    data,
    series,
    type = "line",
    height = 300,
    showLegend = true,
    yAxisLabel,
}: AnalyticsChartProps) {
    const renderChart = () => {
        const commonProps = {
            data,
            margin: { top: 5, right: 20, left: 0, bottom: 5 },
        };

        const chartElements = (
            <>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={
                        yAxisLabel
                            ? {
                                  value: yAxisLabel,
                                  angle: -90,
                                  position: "insideLeft",
                              }
                            : undefined
                    }
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                    }}
                />
                {showLegend && <Legend />}
            </>
        );

        switch (type) {
            case "area":
                return (
                    <AreaChart {...commonProps}>
                        {chartElements}
                        {series.map((s) => (
                            <Area
                                key={s.dataKey}
                                type="monotone"
                                dataKey={s.dataKey}
                                name={s.name}
                                stroke={s.color}
                                fill={s.color}
                                fillOpacity={0.2}
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                );

            case "bar":
                return (
                    <BarChart {...commonProps}>
                        {chartElements}
                        {series.map((s) => (
                            <Bar
                                key={s.dataKey}
                                dataKey={s.dataKey}
                                name={s.name}
                                fill={s.color}
                                radius={[4, 4, 0, 0]}
                            />
                        ))}
                    </BarChart>
                );

            case "line":
            default:
                return (
                    <LineChart {...commonProps}>
                        {chartElements}
                        {series.map((s) => (
                            <Line
                                key={s.dataKey}
                                type="monotone"
                                dataKey={s.dataKey}
                                name={s.name}
                                stroke={s.color}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        ))}
                    </LineChart>
                );
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={height}>
                    {renderChart()}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
