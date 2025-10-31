/**
 * Report Builder Component
 * Custom report creation and export tool
 */

import { useState } from "react";
import { Download, Calendar, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportToCSV } from "@/lib/analytics";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface ReportBuilderProps {
    onGenerateReport: (config: ReportConfig) => Promise<any[]>;
    className?: string;
}

export interface ReportConfig {
    reportType:
        | "leads"
        | "listings"
        | "conversions"
        | "sources"
        | "performance";
    dateRange: "7d" | "30d" | "90d" | "this_month" | "last_month" | "custom";
    metrics: string[];
    format: "csv" | "pdf" | "excel";
    startDate?: Date;
    endDate?: Date;
}

export function ReportBuilder({
    onGenerateReport,
    className,
}: ReportBuilderProps) {
    const [reportType, setReportType] =
        useState<ReportConfig["reportType"]>("leads");
    const [dateRange, setDateRange] =
        useState<ReportConfig["dateRange"]>("30d");
    const [format, setFormat] = useState<ReportConfig["format"]>("csv");
    const [isGenerating, setIsGenerating] = useState(false);

    const reportTypes = [
        { value: "leads", label: "Leads Report" },
        { value: "listings", label: "Listings Performance" },
        { value: "conversions", label: "Conversion Analytics" },
        { value: "sources", label: "Lead Sources" },
        { value: "performance", label: "Overall Performance" },
    ];

    const dateRanges = [
        { value: "7d", label: "Last 7 Days" },
        { value: "30d", label: "Last 30 Days" },
        { value: "90d", label: "Last 90 Days" },
        { value: "this_month", label: "This Month" },
        { value: "last_month", label: "Last Month" },
    ];

    const formats = [
        { value: "csv", label: "CSV" },
        { value: "pdf", label: "PDF (Coming Soon)", disabled: true },
        { value: "excel", label: "Excel (Coming Soon)", disabled: true },
    ];

    const getDateRangeForReport = (): { start: Date; end: Date } => {
        const now = new Date();
        switch (dateRange) {
            case "7d":
                return { start: subDays(now, 7), end: now };
            case "30d":
                return { start: subDays(now, 30), end: now };
            case "90d":
                return { start: subDays(now, 90), end: now };
            case "this_month":
                return { start: startOfMonth(now), end: endOfMonth(now) };
            case "last_month":
                const lastMonth = subDays(startOfMonth(now), 1);
                return {
                    start: startOfMonth(lastMonth),
                    end: endOfMonth(lastMonth),
                };
            default:
                return { start: subDays(now, 30), end: now };
        }
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);

        try {
            const { start, end } = getDateRangeForReport();

            const config: ReportConfig = {
                reportType,
                dateRange,
                metrics: [], // Will be filled based on report type
                format,
                startDate: start,
                endDate: end,
            };

            const data = await onGenerateReport(config);

            if (format === "csv") {
                const filename = `${reportType}_report_${format(
                    start,
                    "yyyy-MM-dd"
                )}_to_${format(end, "yyyy-MM-dd")}`;
                exportToCSV(data, filename);
                toast.success("Report exported successfully!");
            }
        } catch (error) {
            console.error("Report generation error:", error);
            toast.error("Failed to generate report");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={cn("bg-white p-6 rounded-lg border", className)}>
            <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Custom Report Builder</h3>
            </div>

            <div className="space-y-4">
                {/* Report Type */}
                <div>
                    <Label>Report Type</Label>
                    <Select
                        value={reportType}
                        onValueChange={(v: any) => setReportType(v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {reportTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range */}
                <div>
                    <Label className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date Range
                    </Label>
                    <Select
                        value={dateRange}
                        onValueChange={(v: any) => setDateRange(v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {dateRanges.map((range) => (
                                <SelectItem
                                    key={range.value}
                                    value={range.value}
                                >
                                    {range.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Format */}
                <div>
                    <Label>Export Format</Label>
                    <Select
                        value={format}
                        onValueChange={(v: any) => setFormat(v)}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {formats.map((fmt) => (
                                <SelectItem
                                    key={fmt.value}
                                    value={fmt.value}
                                    disabled={fmt.disabled}
                                >
                                    {fmt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Generate Button */}
                <Button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full gap-2"
                >
                    <Download className="w-4 h-4" />
                    {isGenerating ? "Generating..." : "Generate Report"}
                </Button>
            </div>

            {/* Report Preview Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Report Preview</h4>
                <div className="space-y-1 text-sm text-gray-600">
                    <p>
                        Type: <span className="font-medium">{reportType}</span>
                    </p>
                    <p>
                        Range:{" "}
                        <span className="font-medium">
                            {format(
                                getDateRangeForReport().start,
                                "MMM d, yyyy"
                            )}{" "}
                            -{" "}
                            {format(getDateRangeForReport().end, "MMM d, yyyy")}
                        </span>
                    </p>
                    <p>
                        Format:{" "}
                        <span className="font-medium uppercase">{format}</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
