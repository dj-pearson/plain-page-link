import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home, ArrowLeft } from "lucide-react";
import { captureException, addBreadcrumb } from "@/lib/sentry";
import { logger } from "@/lib/logger";

interface RouteErrorBoundaryProps {
    children: ReactNode;
    /** Name of the section for error context (e.g., "Dashboard", "Admin", "Profile") */
    section: string;
    /** Optional custom fallback UI */
    fallback?: ReactNode;
    /** Optional back navigation path */
    backPath?: string;
    /** Optional back navigation label */
    backLabel?: string;
}

interface RouteErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    eventId: string | null;
}

/**
 * Route-section-level error boundary that isolates crashes per route group.
 * A crash in the Dashboard section won't affect Public or Admin sections.
 */
export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
    public state: RouteErrorBoundaryState = {
        hasError: false,
        error: null,
        eventId: null,
    };

    public static getDerivedStateFromError(error: Error): Partial<RouteErrorBoundaryState> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { section } = this.props;

        addBreadcrumb({
            category: 'react.error',
            message: `Error in ${section} section`,
            level: 'error',
            data: {
                section,
                componentStack: errorInfo.componentStack?.slice(0, 500),
            },
        });

        const eventId = captureException(error, {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
            section,
        });

        this.setState({ error, eventId });

        logger.error(`Uncaught error in ${section} section`, error, { section });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, eventId: null });
    };

    public render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        if (this.props.fallback) {
            return this.props.fallback;
        }

        const { section, backPath, backLabel } = this.props;

        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-red-100 rounded-full">
                            <AlertCircle className="h-7 w-7 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {section} Error
                            </h2>
                            <p className="text-sm text-gray-600">
                                Something went wrong in this section
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            An error occurred while rendering the {section.toLowerCase()} section.
                            Other parts of the application should still work normally.
                        </p>
                    </div>

                    {import.meta.env.DEV && this.state.error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs font-mono text-red-800 mb-1">
                                Dev Error Details:
                            </p>
                            <p className="text-xs font-mono text-red-700 break-words">
                                {this.state.error.message}
                            </p>
                        </div>
                    )}

                    {import.meta.env.PROD && this.state.eventId && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-600">
                                Error ID: <span className="font-mono">{this.state.eventId}</span>
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={this.handleReset}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCcw className="h-5 w-5" />
                            Try Again
                        </button>
                        {backPath ? (
                            <a
                                href={backPath}
                                className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                                {backLabel || "Go Back"}
                            </a>
                        ) : (
                            <a
                                href="/"
                                className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
                            >
                                <Home className="h-5 w-5" />
                                Go Home
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }
}

export default RouteErrorBoundary;
