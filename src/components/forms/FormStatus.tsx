/**
 * FormStatus Component
 * Announces form submission status to screen readers
 * Uses aria-live regions for real-time feedback
 */

import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormStatusProps {
    status?: "idle" | "loading" | "success" | "error";
    message?: string;
    className?: string;
}

export function FormStatus({ status = "idle", message, className }: FormStatusProps) {
    if (status === "idle" || !message) return null;

    return (
        <div
            className={cn("rounded-lg p-4 flex items-start gap-3", className)}
            role={status === "error" ? "alert" : "status"}
            aria-live={status === "error" ? "assertive" : "polite"}
            aria-atomic="true"
        >
            {status === "loading" && (
                <>
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">{message}</p>
                    </div>
                </>
            )}

            {status === "success" && (
                <>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-green-900">{message}</p>
                    </div>
                </>
            )}

            {status === "error" && (
                <>
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-900">{message}</p>
                    </div>
                </>
            )}
        </div>
    );
}
