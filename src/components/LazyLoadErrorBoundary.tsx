import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error boundary specifically for lazy-loaded routes
 * Handles chunk loading failures and other async errors
 */
export class LazyLoadErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Check if this is a chunk loading error
        const isChunkLoadError =
            error.name === "ChunkLoadError" ||
            error.message.includes("Failed to fetch dynamically imported module") ||
            error.message.includes("Importing a module script failed");

        if (isChunkLoadError) {
            console.error("[LazyLoad] Chunk loading failed:", error.message);

            // Store error info for debugging
            if (import.meta.env.DEV) {
                console.error("[LazyLoad] Error details:", errorInfo);
            }
        } else {
            console.error("[LazyLoad] Unexpected error:", error, errorInfo);
        }
    }

    private handleReload = () => {
        // For chunk load errors, reload the entire page
        window.location.reload();
    };

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isChunkLoadError =
                this.state.error?.name === "ChunkLoadError" ||
                this.state.error?.message.includes("Failed to fetch dynamically imported module") ||
                this.state.error?.message.includes("Importing a module script failed");

            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center px-4">
                    <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-orange-100 rounded-full">
                                <AlertCircle className="h-8 w-8 text-orange-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {isChunkLoadError
                                        ? "Update Required"
                                        : "Something went wrong"}
                                </h1>
                                <p className="text-gray-600">
                                    {isChunkLoadError
                                        ? "The page needs to be refreshed"
                                        : "We're sorry for the inconvenience"}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                                {isChunkLoadError ? (
                                    <>
                                        The application has been updated. Please refresh the page to
                                        load the latest version.
                                    </>
                                ) : (
                                    <>
                                        An unexpected error occurred while loading this page. This
                                        might be due to a network issue or outdated cached files.
                                    </>
                                )}
                            </p>
                        </div>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-xs font-mono text-red-800 mb-1">
                                    Development Error Details:
                                </p>
                                <p className="text-xs font-mono text-red-700">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={
                                    isChunkLoadError ? this.handleReload : this.handleReset
                                }
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCcw className="h-5 w-5" />
                                {isChunkLoadError ? "Reload Page" : "Try Again"}
                            </button>
                            <a
                                href="/"
                                className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:border-gray-400 transition-colors"
                            >
                                <Home className="h-5 w-5" />
                                Go Home
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default LazyLoadErrorBoundary;
