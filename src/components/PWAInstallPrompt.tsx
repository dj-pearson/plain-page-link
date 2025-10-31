/**
 * PWA Install Prompt Component
 * Shows a prompt to install the app as a PWA
 */

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { cn } from "@/lib/utils";

export function PWAInstallPrompt() {
    const { canInstall, promptInstall, isInstalled } = usePWA();
    const [isDismissed, setIsDismissed] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            setIsDismissed(true);
        }

        // Show prompt after a short delay
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    const handleInstall = async () => {
        const installed = await promptInstall();
        if (installed) {
            setIsDismissed(true);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    if (!canInstall || isInstalled || isDismissed || !isVisible) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:max-w-sm",
                "bg-white rounded-lg shadow-lg border border-gray-200 p-4",
                "animate-in slide-in-from-bottom-5 duration-300",
                "z-40"
            )}
        >
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">
                        Install AgentBio
                    </h3>
                    <p className="text-xs text-gray-600 mb-3">
                        Add to your home screen for quick access and offline
                        support
                    </p>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleInstall}>
                            Install
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDismiss}
                        >
                            Not now
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
