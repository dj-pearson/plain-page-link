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
console.log("[Lovable] Mounting React app", { mode: import.meta?.env?.MODE });

ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
        <BrowserRouter>
            <ErrorBoundary>
                <HelmetProvider>
                    <QueryClientProvider client={queryClient}>
                        <App />
                        <ReactQueryDevtools initialIsOpen={false} />
                    </QueryClientProvider>
                </HelmetProvider>
            </ErrorBoundary>
        </BrowserRouter>
    </React.StrictMode>
);

console.log("[Lovable] React render invoked");
