import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const rootEl = document.getElementById("root")!;
if (!rootEl) {
    console.error("Root element #root not found");
}
if (import.meta.env.DEV) {
    console.log("[Lovable] Mounting React app", { mode: import.meta?.env?.MODE });
}

ReactDOM.createRoot(rootEl).render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ErrorBoundary>
            <HelmetProvider>
                <QueryClientProvider client={queryClient}>
                    <App />
                    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
                </QueryClientProvider>
            </HelmetProvider>
        </ErrorBoundary>
    </BrowserRouter>
);

if (import.meta.env.DEV) {
    console.log("[Lovable] React render invoked");
}
