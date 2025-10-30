import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
};

export default function LoadingSpinner({
    size = "md",
    className,
    fullScreen = false,
}: LoadingSpinnerProps) {
    const spinner = (
        <Loader2 className={cn("animate-spin text-blue-600", sizeClasses[size], className)} />
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <div className="text-center">
                    {spinner}
                    <p className="mt-4 text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return spinner;
}

export function LoadingCard({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center p-8", className)}>
            <LoadingSpinner size="lg" />
        </div>
    );
}

export function LoadingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="xl" />
                <p className="mt-4 text-lg text-gray-600 font-medium">Loading...</p>
            </div>
        </div>
    );
}

