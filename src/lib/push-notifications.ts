/**
 * Push Notifications Manager
 * Handles Firebase Cloud Messaging for push notifications
 */

import { logger } from "@/lib/logger";

// Firebase configuration will be loaded from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export class PushNotificationManager {
    private static instance: PushNotificationManager;
    private messaging: any;
    private currentToken?: string;

    private constructor() {}

    static getInstance(): PushNotificationManager {
        if (!PushNotificationManager.instance) {
            PushNotificationManager.instance = new PushNotificationManager();
        }
        return PushNotificationManager.instance;
    }

    async init() {
        // Check if Firebase is configured
        if (!firebaseConfig.apiKey) {
            if (import.meta.env.DEV) {
                logger.warn("[PushNotifications] Firebase not configured");
            }
            return false;
        }

        try {
            // Register service worker first
            await this.registerServiceWorker();

            // Dynamically import Firebase to reduce initial bundle size
            const { initializeApp } = await import("firebase/app");
            const { getMessaging, getToken, onMessage } = await import(
                "firebase/messaging"
            );

            const app = initializeApp(firebaseConfig);
            this.messaging = getMessaging(app);

            // Handle foreground messages
            onMessage(this.messaging, (payload) => {
                if (import.meta.env.DEV) {
                    logger.debug("[PushNotifications] Foreground message received:", { payload });
                }
                this.handleForegroundMessage(payload);
            });

            return true;
        } catch (error) {
            logger.error("[PushNotifications] Failed to initialize:", error as Error);
            return false;
        }
    }

    private async registerServiceWorker(): Promise<void> {
        if (!('serviceWorker' in navigator)) {
            logger.warn('[PushNotifications] Service workers not supported');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register(
                '/firebase-messaging-sw.js',
                { scope: '/' }
            );

            if (import.meta.env.DEV) {
                logger.debug('[PushNotifications] Service worker registered:', { registration });
            }

            // Send Firebase config to service worker
            if (registration.active) {
                registration.active.postMessage({
                    type: 'FIREBASE_CONFIG',
                    config: firebaseConfig,
                });
            }

            // Listen for service worker updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'activated') {
                            newWorker.postMessage({
                                type: 'FIREBASE_CONFIG',
                                config: firebaseConfig,
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error('[PushNotifications] Service worker registration failed:', error as Error);
        }
    }

    async requestPermission(): Promise<boolean> {
        try {
            const permission = await Notification.requestPermission();
            if (import.meta.env.DEV) {
                logger.debug("[PushNotifications] Permission:", { permission });
            }
            return permission === "granted";
        } catch (error) {
            logger.error("[PushNotifications] Permission request failed:", error as Error);
            return false;
        }
    }

    async getToken(): Promise<string | null> {
        if (!this.messaging) {
            await this.init();
            if (!this.messaging) return null;
        }

        try {
            const { getToken } = await import("firebase/messaging");

            const token = await getToken(this.messaging, { vapidKey });

            if (token) {
                if (import.meta.env.DEV) {
                    logger.debug("[PushNotifications] FCM Token:", { token });
                }
                this.currentToken = token;
                return token;
            } else {
                if (import.meta.env.DEV) {
                    logger.debug("[PushNotifications] No registration token available");
                }
                return null;
            }
        } catch (error) {
            logger.error("[PushNotifications] Failed to get token:", error as Error);
            return null;
        }
    }

    async registerToken(userId: string): Promise<boolean> {
        const token = await this.getToken();
        if (!token) return false;

        try {
            // Get Supabase session token
            const { supabase } = await import('@/integrations/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                logger.error('[PushNotifications] No active session', new Error('No active session'));
                return false;
            }

            // Send token to backend
            const response = await fetch("/api/v1/notifications/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    token,
                    userId,
                    device: this.getDeviceInfo(),
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to register token");
            }

            if (import.meta.env.DEV) {
                logger.debug("[PushNotifications] Token registered successfully");
            }
            return true;
        } catch (error) {
            logger.error("[PushNotifications] Failed to register token:", error as Error);
            return false;
        }
    }

    async unregisterToken(): Promise<boolean> {
        if (!this.currentToken) return true;

        try {
            // Get Supabase session token
            const { supabase } = await import('@/integrations/supabase/client');
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.access_token) {
                logger.error('[PushNotifications] No active session', new Error('No active session'));
                return false;
            }

            const response = await fetch("/api/v1/notifications/unregister", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    token: this.currentToken,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to unregister token");
            }

            if (import.meta.env.DEV) {
                logger.debug("[PushNotifications] Token unregistered successfully");
            }
            this.currentToken = undefined;
            return true;
        } catch (error) {
            logger.error("[PushNotifications] Failed to unregister token:", error as Error);
            return false;
        }
    }

    private handleForegroundMessage(payload: any) {
        const { notification, data } = payload;

        // Show browser notification
        if (notification) {
            this.showNotification(notification.title, {
                body: notification.body,
                icon: notification.icon || "/icons/icon-192.png",
                badge: "/icons/icon-72.png",
                data: data,
                tag: data?.type || "default",
                requireInteraction: data?.requireInteraction === "true",
            });
        }

        // Dispatch custom event for app to handle
        window.dispatchEvent(
            new CustomEvent("push-notification", {
                detail: payload,
            })
        );
    }

    private async showNotification(
        title: string,
        options: NotificationOptions
    ) {
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.showNotification(title, options);
            } catch (error) {
                logger.error("[PushNotifications] Failed to show notification:", error as Error);
                // Fallback to browser notification
                new Notification(title, options);
            }
        }
    }

    private getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timestamp: Date.now(),
        };
    }

    // Check if notifications are supported and permitted
    isSupported(): boolean {
        return "Notification" in window && "serviceWorker" in navigator;
    }

    getPermissionStatus(): NotificationPermission {
        return Notification.permission;
    }
}

// Export singleton instance
export const pushNotifications = PushNotificationManager.getInstance();
