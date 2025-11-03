import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FullPageLoader } from "./LoadingSpinner";

/**
 * Component to verify Router context is available before rendering children
 * This prevents the "Cannot destructure property 'basename'" error
 */
export function RouterCheck({ children }: { children: React.ReactNode }) {
    const [isRouterReady, setIsRouterReady] = useState(false);

    // Try to access the router context
    try {
        const navigate = useNavigate();

        useEffect(() => {
            // If we can call useNavigate successfully, router is ready
            if (navigate) {
                setIsRouterReady(true);
            }
        }, [navigate]);

    } catch (error) {
        console.error("[RouterCheck] Router context not available:", error);
        // If router isn't ready, show loader
        return <FullPageLoader text="Initializing..." />;
    }

    // Wait for router to be ready
    if (!isRouterReady) {
        return <FullPageLoader text="Loading..." />;
    }

    return <>{children}</>;
}
