/**
 * Push Notifications Manager
 * Handles Firebase Cloud Messaging for push notifications
 */

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
            console.warn("[PushNotifications] Firebase not configured");
            return false;
        }

        try {
            // Dynamically import Firebase to reduce initial bundle size
            const { initializeApp } = await import("firebase/app");
            const { getMessaging, getToken, onMessage } = await import(
                "firebase/messaging"
            );

            const app = initializeApp(firebaseConfig);
            this.messaging = getMessaging(app);

            // Handle foreground messages
            onMessage(this.messaging, (payload) => {
                console.log(
                    "[PushNotifications] Foreground message received:",
                    payload
                );
                this.handleForegroundMessage(payload);
            });

            return true;
        } catch (error) {
            console.error("[PushNotifications] Failed to initialize:", error);
            return false;
        }
    }

    async requestPermission(): Promise<boolean> {
        try {
            const permission = await Notification.requestPermission();
            console.log("[PushNotifications] Permission:", permission);
            return permission === "granted";
        } catch (error) {
            console.error(
                "[PushNotifications] Permission request failed:",
                error
            );
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
                console.log("[PushNotifications] FCM Token:", token);
                this.currentToken = token;
                return token;
            } else {
                console.log(
                    "[PushNotifications] No registration token available"
                );
                return null;
            }
        } catch (error) {
            console.error("[PushNotifications] Failed to get token:", error);
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
                console.error('[PushNotifications] No active session');
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

            console.log("[PushNotifications] Token registered successfully");
            return true;
        } catch (error) {
            console.error(
                "[PushNotifications] Failed to register token:",
                error
            );
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
                console.error('[PushNotifications] No active session');
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

            console.log("[PushNotifications] Token unregistered successfully");
            this.currentToken = undefined;
            return true;
        } catch (error) {
            console.error(
                "[PushNotifications] Failed to unregister token:",
                error
            );
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
                console.error(
                    "[PushNotifications] Failed to show notification:",
                    error
                );
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
