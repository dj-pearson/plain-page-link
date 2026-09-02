# Technical Specification: Progressive Web App (PWA) Implementation

**Feature:** Mobile Management App/PWA  
**Version:** 1.0  
**Date:** October 31, 2025  
**Status:** 📋 Ready for Development

---

## 1. Overview

### 1.1 Purpose

Transform the AgentBio.net admin dashboard into a Progressive Web App (PWA) that provides a native app-like experience on mobile devices, with offline capabilities, push notifications, and optimized mobile UI.

### 1.2 Goals

-   Enable agents to manage profiles from mobile devices
-   Support offline editing with background sync
-   Reduce page load times on mobile to <3 seconds
-   Provide native app features (camera, notifications, home screen install)
-   Support 70% of admin tasks on mobile devices

### 1.3 Non-Goals (Out of Scope)

-   Full native iOS/Android apps (Phase 2)
-   Offline photo uploads (requires connection)
-   Advanced offline analytics (Phase 2)
-   Desktop PWA optimization (mobile-first only)

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Browser                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Frontend (PWA)                    │  │
│  │  ├─ Service Worker (caching, sync, notifications)   │  │
│  │  ├─ IndexedDB (offline data storage)                │  │
│  │  ├─ Cache API (static assets)                       │  │
│  │  └─ Push API (FCM integration)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS (REST API)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Laravel Backend API                       │
│  ├─ Authentication (JWT tokens)                             │
│  ├─ Listing Management Endpoints                            │
│  ├─ Lead Management Endpoints                               │
│  ├─ Notification Service (FCM)                              │
│  └─ Background Sync Queue                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ├─ Firebase Cloud Messaging (push notifications)           │
│  ├─ AWS S3 / Cloudflare R2 (image storage)                 │
│  └─ CDN (Cloudflare)                                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Breakdown

#### Frontend Components

**Core PWA Components:**

-   `ServiceWorkerManager` - Registers and manages service worker lifecycle
-   `OfflineSync` - Manages offline queue and background sync
-   `PushNotificationService` - Handles FCM integration
-   `CacheManager` - Controls caching strategies

**Mobile UI Components:**

-   `MobileNav` - Bottom navigation bar
-   `MobileListingCard` - Touch-optimized listing cards
-   `MobileEditor` - Full-screen mobile editor
-   `CameraUpload` - Native camera integration
-   `VoiceInput` - Speech-to-text component
-   `PullToRefresh` - Pull-to-refresh gesture handler

#### Backend Components

**New API Endpoints:**

```
POST   /api/v1/notifications/register     - Register FCM token
DELETE /api/v1/notifications/unregister   - Remove FCM token
POST   /api/v1/sync/listings               - Batch sync listings
POST   /api/v1/sync/leads                  - Batch sync leads
GET    /api/v1/offline/manifest            - Get offline data manifest
```

**Background Jobs:**

-   `SendPushNotification` - Queue notifications to FCM
-   `ProcessOfflineSync` - Process synced data from offline clients
-   `CleanupOldCaches` - Remove stale cached data

---

## 3. Service Worker Implementation

### 3.1 Service Worker Lifecycle

```javascript
// service-worker.js
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
    NetworkFirst,
    CacheFirst,
    StaleWhileRevalidate,
} from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

const CACHE_VERSION = "agentbio-v1";

// Precache critical assets at install
precacheAndRoute(self.__WB_MANIFEST);

// Cache strategies
registerRoute(
    ({ request }) => request.destination === "document",
    new NetworkFirst({
        cacheName: "pages-cache",
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "images-cache",
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// API requests: Network-first with background sync
const bgSyncPlugin = new BackgroundSyncPlugin("api-queue", {
    maxRetentionTime: 24 * 60, // Retry for max 24 hours
});

registerRoute(
    ({ url }) => url.pathname.startsWith("/api/"),
    new NetworkFirst({
        cacheName: "api-cache",
        plugins: [bgSyncPlugin],
    })
);

// Push notification handler
self.addEventListener("push", (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/badge-72.png",
        data: {
            url: data.url,
            leadId: data.leadId,
        },
        actions: [
            { action: "view", title: "View" },
            { action: "reply", title: "Reply" },
        ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url || "/dashboard";

    event.waitUntil(clients.openWindow(urlToOpen));
});
```

### 3.2 Caching Strategies

| Resource Type | Strategy      | Cache Duration | Justification                           |
| ------------- | ------------- | -------------- | --------------------------------------- |
| HTML Pages    | Network First | 24 hours       | Fresh content preferred, cache fallback |
| CSS/JS        | Cache First   | 7 days         | Versioned, rarely changes               |
| Images        | Cache First   | 30 days        | Large files, rarely change              |
| API Data      | Network First | 5 minutes      | Real-time data important                |
| Fonts         | Cache First   | 365 days       | Never change once loaded                |

### 3.3 Cache Size Management

```javascript
// Maximum cache sizes
const MAX_CACHE_SIZE = {
    "images-cache": 50, // 50 images max
    "pages-cache": 20, // 20 pages max
    "api-cache": 100, // 100 API responses max
};

// Cache cleanup on activate
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_VERSION)
                    .map((cacheName) => caches.delete(cacheName))
            );
        })
    );
});
```

---

## 4. Offline Data Storage

### 4.1 IndexedDB Schema

```typescript
// Database: agentbio_offline
// Version: 1

interface OfflineDB {
    listings: {
        key: string;
        value: {
            id: string;
            address: string;
            price: number;
            status: "active" | "pending" | "sold";
            photos: string[];
            description: string;
            lastSync: number;
            localChanges: boolean;
        };
    };

    leads: {
        key: string;
        value: {
            id: string;
            name: string;
            email: string;
            phone: string;
            message: string;
            listingId: string;
            timestamp: number;
            read: boolean;
        };
    };

    syncQueue: {
        key: string;
        value: {
            id: string;
            type: "listing_update" | "lead_response" | "photo_upload";
            action: "create" | "update" | "delete";
            data: any;
            timestamp: number;
            attempts: number;
        };
    };

    userPreferences: {
        key: string;
        value: {
            notificationSettings: any;
            theme: string;
            lastSync: number;
        };
    };
}
```

### 4.2 Offline Sync Manager

```typescript
// services/OfflineSyncManager.ts
export class OfflineSyncManager {
    private db: IDBDatabase;
    private syncInterval: number = 5000; // 5 seconds

    async init() {
        this.db = await openDB("agentbio_offline", 1, {
            upgrade(db) {
                db.createObjectStore("listings", { keyPath: "id" });
                db.createObjectStore("leads", { keyPath: "id" });
                db.createObjectStore("syncQueue", { keyPath: "id" });
                db.createObjectStore("userPreferences", { keyPath: "key" });
            },
        });

        this.startSyncInterval();
    }

    async addToSyncQueue(item: SyncQueueItem) {
        const tx = this.db.transaction("syncQueue", "readwrite");
        await tx.objectStore("syncQueue").add(item);
    }

    async processSyncQueue() {
        if (!navigator.onLine) return;

        const tx = this.db.transaction("syncQueue", "readonly");
        const queue = await tx.objectStore("syncQueue").getAll();

        for (const item of queue) {
            try {
                await this.syncItem(item);
                await this.removeFromSyncQueue(item.id);
            } catch (error) {
                await this.incrementSyncAttempts(item.id);
            }
        }
    }

    private async syncItem(item: SyncQueueItem) {
        const endpoint = this.getEndpointForType(item.type);
        const response = await fetch(endpoint, {
            method: item.action === "delete" ? "DELETE" : "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.getAuthToken()}`,
            },
            body: JSON.stringify(item.data),
        });

        if (!response.ok) {
            throw new Error("Sync failed");
        }
    }

    private startSyncInterval() {
        setInterval(() => {
            this.processSyncQueue();
        }, this.syncInterval);
    }
}
```

---

## 5. Push Notifications

### 5.1 Firebase Cloud Messaging Setup

```javascript
// firebase-config.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
        const token = await getToken(messaging, {
            vapidKey: process.env.VITE_FIREBASE_VAPID_KEY,
        });

        // Send token to backend
        await fetch("/api/v1/notifications/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
            body: JSON.stringify({ token, device: getUserDevice() }),
        });

        return token;
    }

    return null;
}

// Handle foreground messages
onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);

    // Show in-app notification toast
    showToast({
        title: payload.notification.title,
        body: payload.notification.body,
        onClick: () => (window.location.href = payload.data.url),
    });
});
```

### 5.2 Backend Notification Service

```php
// app/Services/PushNotificationService.php
namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;

class PushNotificationService
{
    private $messaging;

    public function __construct()
    {
        $factory = (new Factory)->withServiceAccount(config('services.firebase.credentials'));
        $this->messaging = $factory->createMessaging();
    }

    public function sendNewLeadNotification($user, $lead)
    {
        $tokens = $user->pushTokens()->pluck('token')->toArray();

        if (empty($tokens)) {
            return;
        }

        $message = CloudMessage::new()
            ->withNotification([
                'title' => 'New Lead from ' . $lead->listing->address,
                'body' => $lead->name . ' is interested in your listing',
                'icon' => '/icons/icon-192.png'
            ])
            ->withData([
                'url' => '/leads/' . $lead->id,
                'leadId' => $lead->id,
                'type' => 'new_lead'
            ])
            ->withAndroidConfig([
                'priority' => 'high',
                'notification' => [
                    'sound' => 'default',
                    'click_action' => 'OPEN_LEAD'
                ]
            ])
            ->withApnsConfig([
                'payload' => [
                    'aps' => [
                        'sound' => 'default',
                        'badge' => 1
                    ]
                ]
            ]);

        foreach ($tokens as $token) {
            try {
                $this->messaging->send($message->withChangedTarget('token', $token));
            } catch (\Exception $e) {
                // Token invalid, remove from database
                PushToken::where('token', $token)->delete();
            }
        }
    }
}
```

---

## 6. Mobile UI Implementation

### 6.1 Bottom Navigation Component

```typescript
// components/MobileNav.tsx
import { Home, List, Users, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
    label: string;
    icon: React.ComponentType;
    href: string;
    badge?: number;
}

export function MobileNav() {
    const location = useLocation();
    const unreadLeads = useUnreadLeadsCount();

    const navItems: NavItem[] = [
        { label: "Home", icon: Home, href: "/dashboard" },
        { label: "Listings", icon: List, href: "/listings" },
        { label: "Leads", icon: Users, href: "/leads", badge: unreadLeads },
        { label: "Analytics", icon: BarChart3, href: "/analytics" },
        { label: "More", icon: Settings, href: "/settings" },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={`flex flex-col items-center justify-center flex-1 h-full relative ${
                                isActive ? "text-blue-600" : "text-gray-600"
                            }`}
                            style={{ minWidth: "44px", minHeight: "44px" }}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.label}</span>

                            {item.badge && item.badge > 0 && (
                                <span className="absolute top-1 right-1/4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
```

### 6.2 Pull-to-Refresh Component

```typescript
// components/PullToRefresh.tsx
import { useState, useRef } from "react";

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [pulling, setPulling] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);
    const pullDistance = useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (window.scrollY === 0) {
            startY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startY.current === 0) return;

        const currentY = e.touches[0].clientY;
        pullDistance.current = currentY - startY.current;

        if (pullDistance.current > 0 && pullDistance.current < 150) {
            setPulling(true);
        }
    };

    const handleTouchEnd = async () => {
        if (pullDistance.current > 80 && !refreshing) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }

        setPulling(false);
        startY.current = 0;
        pullDistance.current = 0;
    };

    return (
        <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {(pulling || refreshing) && (
                <div className="flex justify-center items-center h-16 text-gray-600">
                    {refreshing ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    ) : (
                        <span>Pull to refresh...</span>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}
```

---

## 7. Performance Optimization

### 7.1 Code Splitting Strategy

```typescript
// App.tsx - Lazy load routes
import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Listings = lazy(() => import("./pages/Listings"));
const Leads = lazy(() => import("./pages/Leads"));
const Analytics = lazy(() => import("./pages/Analytics"));

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/analytics" element={<Analytics />} />
            </Routes>
        </Suspense>
    );
}
```

### 7.2 Image Optimization

```typescript
// components/OptimizedImage.tsx
interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    loading?: "lazy" | "eager";
}

export function OptimizedImage({
    src,
    alt,
    width,
    height,
    loading = "lazy",
}: OptimizedImageProps) {
    // Generate WebP and JPEG versions
    const webpSrc = src.replace(/\.(jpg|jpeg|png)$/, ".webp");

    return (
        <picture>
            <source srcSet={webpSrc} type="image/webp" />
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading={loading}
                decoding="async"
                className="object-cover"
            />
        </picture>
    );
}
```

### 7.3 Performance Budget

| Metric                         | Target | Critical Threshold |
| ------------------------------ | ------ | ------------------ |
| First Contentful Paint (FCP)   | <1.8s  | <2.5s              |
| Largest Contentful Paint (LCP) | <2.5s  | <4.0s              |
| First Input Delay (FID)        | <100ms | <300ms             |
| Cumulative Layout Shift (CLS)  | <0.1   | <0.25              |
| Total Blocking Time (TBT)      | <200ms | <600ms             |
| Speed Index                    | <3.4s  | <5.8s              |
| Bundle Size (JS)               | <200KB | <300KB             |
| Bundle Size (CSS)              | <50KB  | <100KB             |

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// __tests__/OfflineSyncManager.test.ts
import { OfflineSyncManager } from "../services/OfflineSyncManager";

describe("OfflineSyncManager", () => {
    let syncManager: OfflineSyncManager;

    beforeEach(async () => {
        syncManager = new OfflineSyncManager();
        await syncManager.init();
    });

    test("should add item to sync queue when offline", async () => {
        const item = {
            id: "123",
            type: "listing_update",
            action: "update",
            data: { status: "pending" },
            timestamp: Date.now(),
            attempts: 0,
        };

        await syncManager.addToSyncQueue(item);
        const queue = await syncManager.getSyncQueue();

        expect(queue).toContainEqual(item);
    });

    test("should sync queued items when online", async () => {
        // Test implementation
    });
});
```

### 8.2 Integration Tests

```typescript
// __tests__/integration/PWAInstallation.test.ts
import { test, expect } from "@playwright/test";

test("PWA installation flow", async ({ page, context }) => {
    await page.goto("https://agentbio.net/dashboard");

    // Check manifest
    const manifestResponse = await page.request.get("/manifest.json");
    expect(manifestResponse.ok()).toBeTruthy();

    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe("AgentBio Admin");
    expect(manifest.display).toBe("standalone");

    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
        return "serviceWorker" in navigator;
    });
    expect(swRegistered).toBeTruthy();
});
```

### 8.3 Device Testing Matrix

| Device             | OS         | Browser | Priority |
| ------------------ | ---------- | ------- | -------- |
| iPhone 14 Pro      | iOS 16     | Safari  | P0       |
| iPhone 13          | iOS 15     | Safari  | P1       |
| Samsung Galaxy S23 | Android 13 | Chrome  | P0       |
| Google Pixel 7     | Android 13 | Chrome  | P1       |
| iPad Pro 12.9"     | iOS 16     | Safari  | P2       |
| OnePlus 10 Pro     | Android 12 | Chrome  | P2       |

---

## 9. Security Considerations

### 9.1 Authentication

```typescript
// Secure token storage
import SecureLS from "secure-ls";

const ls = new SecureLS({ encodingType: "aes" });

export function saveAuthToken(token: string) {
    ls.set("auth_token", token);
}

export function getAuthToken(): string | null {
    return ls.get("auth_token");
}

export function clearAuthToken() {
    ls.remove("auth_token");
}
```

### 9.2 API Request Security

```typescript
// API client with security headers
export async function apiRequest(endpoint: string, options: RequestInit = {}) {
    const token = getAuthToken();

    const headers = {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: "include",
    });

    if (response.status === 401) {
        // Token expired, redirect to login
        clearAuthToken();
        window.location.href = "/login";
    }

    return response;
}
```

---

## 10. Monitoring & Analytics

### 10.1 Performance Monitoring

```typescript
// services/PerformanceMonitor.ts
export class PerformanceMonitor {
    static trackPageLoad() {
        if ("PerformanceObserver" in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.sendMetric({
                        name: entry.name,
                        value: entry.startTime,
                        metric: "page_load",
                    });
                }
            });

            observer.observe({ entryTypes: ["navigation", "paint"] });
        }
    }

    static trackWebVitals() {
        import("web-vitals").then(
            ({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(this.sendMetric);
                getFID(this.sendMetric);
                getFCP(this.sendMetric);
                getLCP(this.sendMetric);
                getTTFB(this.sendMetric);
            }
        );
    }

    private static sendMetric(metric: any) {
        // Send to analytics service
        fetch("/api/v1/analytics/performance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(metric),
            keepalive: true,
        });
    }
}
```

---

## 11. Deployment

### 11.1 Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"],
            manifest: {
                name: "AgentBio Admin",
                short_name: "AgentBio",
                description: "Manage your real estate link-in-bio profile",
                theme_color: "#2563eb",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait",
                icons: [
                    {
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                    },
                ],
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\.agentbio\.net\/api\/.*/,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 300,
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                ],
            },
        }),
    ],
    build: {
        target: "es2015",
        minify: "terser",
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ["react", "react-dom"],
                    router: ["react-router-dom"],
                },
            },
        },
    },
});
```

---

## 12. Success Metrics

### 12.1 Technical Metrics

-   Service Worker install rate: >95%
-   PWA installation rate: >40% of mobile users
-   Offline capability usage: >20% of sessions
-   Push notification delivery rate: >95%
-   Average load time: <3 seconds on 4G
-   Crash-free rate: >99.5%

### 12.2 User Metrics

-   Mobile admin usage: >50% of all admin actions
-   Time to update listing status: <30 seconds
-   Lead response time: <15 minutes average
-   Agent satisfaction: >8/10

---

**Document Status:** ✅ Ready for Implementation  
**Technical Review:** Pending  
**Security Review:** Pending  
**Last Updated:** October 31, 2025
