/**
 * PWA Registration and Management
 * Handles service worker registration, updates, and PWA installation
 */

import { registerSW } from "virtual:pwa-register";

interface PWAUpdateCallback {
    (registration: ServiceWorkerRegistration): void;
}

export class PWAManager {
    private static instance: PWAManager;
    private updateSW?: (reloadPage?: boolean) => Promise<void>;
    private registration?: ServiceWorkerRegistration;

    private constructor() {
        this.init();
    }

    static getInstance(): PWAManager {
        if (!PWAManager.instance) {
            PWAManager.instance = new PWAManager();
        }
        return PWAManager.instance;
    }

    private init() {
        if ("serviceWorker" in navigator) {
            this.updateSW = registerSW({
                immediate: true,
                onNeedRefresh: () => {
                    this.onUpdateAvailable();
                },
                onOfflineReady: () => {
                    this.onOfflineReady();
                },
                onRegistered: (registration) => {
                    this.registration = registration;
                    console.log("[PWA] Service Worker registered");
                },
                onRegisterError: (error) => {
                    console.error(
                        "[PWA] Service Worker registration failed:",
                        error
                    );
                },
            });
        }
    }

    private onUpdateAvailable() {
        console.log("[PWA] Update available");
        // Show update notification to user
        if (window.confirm("A new version is available. Reload to update?")) {
            this.update();
        }
    }

    private onOfflineReady() {
        console.log("[PWA] App ready to work offline");
        // Optionally show a notification that the app is ready for offline use
    }

    async update(reloadPage: boolean = true) {
        if (this.updateSW) {
            await this.updateSW(reloadPage);
        }
    }

    getRegistration(): ServiceWorkerRegistration | undefined {
        return this.registration;
    }

    async checkForUpdates() {
        if (this.registration) {
            await this.registration.update();
        }
    }

    // Check if running as installed PWA
    isInstalled(): boolean {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true
        );
    }

    // Prompt user to install PWA
    async promptInstall(deferredPrompt: any) {
        if (!deferredPrompt) return false;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        return outcome === "accepted";
    }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

// Listen for app installed event
window.addEventListener("appinstalled", () => {
    console.log("[PWA] App installed successfully");
});
