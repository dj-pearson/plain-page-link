/**
 * usePWA Hook
 * React hook for managing PWA installation and updates
 */

import { useState, useEffect } from "react";
import { pwaManager } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export function usePWA() {
    const [isInstalled, setIsInstalled] = useState(pwaManager.isInstalled());
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt
        );

        // Listen for appinstalled event
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
        };

        window.addEventListener("appinstalled", handleAppInstalled);

        // Check if already installed
        setIsInstalled(pwaManager.isInstalled());

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) {
            console.log("[usePWA] No install prompt available");
            return false;
        }

        const result = await pwaManager.promptInstall(deferredPrompt);
        if (result) {
            setDeferredPrompt(null);
        }
        return result;
    };

    const checkForUpdates = async () => {
        await pwaManager.checkForUpdates();
    };

    const update = async () => {
        await pwaManager.update();
    };

    return {
        isInstalled,
        canInstall: !!deferredPrompt,
        promptInstall,
        updateAvailable,
        checkForUpdates,
        update,
    };
}
