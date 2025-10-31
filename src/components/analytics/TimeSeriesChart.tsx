/**
 * Time Series Chart Component
 * Line/Area chart for displaying time-based data
 */

import { useMemo } from "react";
import type { TimeSeriesData } from "@/lib/analytics";

interface TimeSeriesChartProps {
    data: TimeSeriesData[];
    title: string;
    color?: string;
    height?: number;
    showPredictions?: boolean;
    className?: string;
}

export function TimeSeriesChart({
    data,
    title,
    color = "#2563eb",
    height = 300,
    showPredictions = false,
    className,
}: TimeSeriesChartProps) {
    const { actualData, predictedData, maxValue, minValue } = useMemo(() => {
        const actual = data.filter((d) => !d.label);
        const predicted = data.filter((d) => d.label === "predicted");
        const allValues = data.map((d) => d.value);

        return {
            actualData: actual,
            predictedData: predicted,
            maxValue: Math.max(...allValues),
            minValue: Math.min(...allValues),
        };
    }, [data]);

    const getYPosition = (value: number) => {
        const padding = 20;
        const chartHeight = height - padding * 2;
        const range = maxValue - minValue || 1;
        return padding + chartHeight - ((value - minValue) / range) * chartHeight;
    };

    const getXPosition = (index: number, total: number) => {
        const padding = 40;
        const chartWidth = 800 - padding * 2;
        return padding + (index / (total - 1)) * chartWidth;
    };

    const createPath = (dataPoints: TimeSeriesData[], dashed: boolean = false) => {
        if (dataPoints.length === 0) return "";

        const points = dataPoints.map((d, i) => ({
            x: getXPosition(i, dataPoints.length),
            y: getYPosition(d.value),
        }));

        const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

        return path;
    };

    const createAreaPath = (dataPoints: TimeSeriesData[]) => {
        if (dataPoints.length === 0) return "";

        const linePath = createPath(dataPoints);
        const lastPoint = getXPosition(dataPoints.length - 1, dataPoints.length);
        const firstPoint = getXPosition(0, dataPoints.length);
        const bottom = height - 20;

        return `${linePath} L ${lastPoint} ${bottom} L ${firstPoint} ${bottom} Z`;
    };

    return (
        <div className={className}>
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <svg
                width="100%"
                height={height}
                viewBox="0 0 800 300"
                className="bg-white rounded-lg border"
            >
                {/* Grid lines */}
                <g className="grid-lines">
                    {[0, 25, 50, 75, 100].map((percent) => {
                        const y = 20 + (height - 40) * (percent / 100);
                        return (
                            <g key={percent}>
                                <line
                                    x1={40}
                                    y1={y}
                                    x2={760}
                                    y2={y}
                                    stroke="#e5e7eb"
                                    strokeWidth={1}
                                />
                                <text
                                    x={25}
                                    y={y + 4}
                                    fontSize={10}
                                    fill="#6b7280"
                                    textAnchor="end"
                                >
                                    {Math.round(maxValue - (percent / 100) * (maxValue - minValue))}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* Area fill */}
                <path
                    d={createAreaPath(actualData)}
                    fill={color}
                    fillOpacity={0.1}
                />

                {/* Actual data line */}
                <path
                    d={createPath(actualData)}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Predicted data line (dashed) */}
                {showPredictions && predictedData.length > 0 && (
                    <path
                        d={createPath(predictedData)}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        strokeOpacity={0.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Data points */}
                {actualData.map((d, i) => (
                    <circle
                        key={i}
                        cx={getXPosition(i, actualData.length)}
                        cy={getYPosition(d.value)}
                        r={4}
                        fill="white"
                        stroke={color}
                        strokeWidth={2}
                    />
                ))}

                {/* X-axis labels */}
                <g className="x-axis-labels">
                    {actualData.map((d, i) => {
                        // Show every nth label to avoid crowding
                        const showLabel = i % Math.ceil(actualData.length / 7) === 0;
                        if (!showLabel) return null;

                        return (
                            <text
                                key={i}
                                x={getXPosition(i, actualData.length)}
                                y={height - 5}
                                fontSize={10}
                                fill="#6b7280"
                                textAnchor="middle"
                            >
                                {d.date}
                            </text>
                        );
                    })}
                </g>
            </svg>

            {showPredictions && predictedData.length > 0 && (
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
                        <span>Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div
                            className="w-4 h-0.5"
                            style={{
                                backgroundColor: color,
                                opacity: 0.5,
                                borderTop: `2px dashed ${color}`,
                            }}
                        />
                        <span>Predicted</span>
                    </div>
                </div>
            )}
        </div>
    );
}

