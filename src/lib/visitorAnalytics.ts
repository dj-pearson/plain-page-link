/**
 * Visitor Analytics Engine
 * Track visitor behavior on public pages
 */

// Analytics Event Types
export type AnalyticsEvent =
    | "page_view"
    | "block_view"
    | "block_click"
    | "link_click"
    | "form_submit"
    | "listing_view"
    | "listing_click"
    | "social_click"
    | "video_play"
    | "phone_click"
    | "email_click"
    | "scroll_depth"
    | "time_on_page"
    | "session_start"
    | "session_end";

// Analytics Event Data
export interface AnalyticsEventData {
    event: AnalyticsEvent;
    pageSlug: string;
    timestamp: number;
    sessionId: string;
    visitorId: string;
    data?: Record<string, any>;
    userAgent?: string;
    referrer?: string;
    screenSize?: string;
    deviceType?: "mobile" | "tablet" | "desktop";
}

// Visitor Session
export interface VisitorSession {
    sessionId: string;
    visitorId: string;
    startTime: number;
    endTime?: number;
    pageSlug: string;
    events: AnalyticsEventData[];
    referrer?: string;
    deviceType: "mobile" | "tablet" | "desktop";
}

// Analytics Summary
export interface AnalyticsSummary {
    totalViews: number;
    uniqueVisitors: number;
    avgTimeOnPage: number;
    bounceRate: number;
    topBlocks: Array<{ blockType: string; views: number }>;
    topLinks: Array<{ url: string; clicks: number }>;
    deviceBreakdown: Record<string, number>;
    referrerBreakdown: Record<string, number>;
    scrollDepth: {
        "25%": number;
        "50%": number;
        "75%": number;
        "100%": number;
    };
}

/**
 * Visitor Analytics Manager
 */
class VisitorAnalyticsEngine {
    private sessionId: string;
    private visitorId: string;
    private startTime: number;
    private events: AnalyticsEventData[] = [];
    private scrollDepthTracked = new Set<number>();

    constructor() {
        this.sessionId = this.generateSessionId();
        this.visitorId = this.getOrCreateVisitorId();
        this.startTime = Date.now();
        this.initializeTracking();
    }

    /**
     * Initialize tracking
     */
    private initializeTracking() {
        // Track scroll depth
        this.trackScrollDepth();

        // Track time on page
        this.trackTimeOnPage();

        // Track page unload
        window.addEventListener("beforeunload", () => {
            this.trackEvent("session_end", {});
            this.sendEvents();
        });
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 9)}`;
    }

    /**
     * Get or create visitor ID (stored in localStorage)
     */
    private getOrCreateVisitorId(): string {
        const storageKey = "agentbio_visitor_id";
        let visitorId = localStorage.getItem(storageKey);

        if (!visitorId) {
            visitorId = `visitor_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 9)}`;
            localStorage.setItem(storageKey, visitorId);
        }

        return visitorId;
    }

    /**
     * Get device type
     */
    private getDeviceType(): "mobile" | "tablet" | "desktop" {
        const width = window.innerWidth;
        if (width < 768) return "mobile";
        if (width < 1024) return "tablet";
        return "desktop";
    }

    /**
     * Track an event
     */
    trackEvent(event: AnalyticsEvent, data: Record<string, any> = {}): void {
        const eventData: AnalyticsEventData = {
            event,
            pageSlug: this.getCurrentPageSlug(),
            timestamp: Date.now(),
            sessionId: this.sessionId,
            visitorId: this.visitorId,
            data,
            userAgent: navigator.userAgent,
            referrer: document.referrer,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
            deviceType: this.getDeviceType(),
        };

        this.events.push(eventData);

        // Send events in batches
        if (this.events.length >= 10) {
            this.sendEvents();
        }
    }

    /**
     * Get current page slug from URL
     */
    private getCurrentPageSlug(): string {
        const pathParts = window.location.pathname.split("/");
        return pathParts[pathParts.length - 1] || "home";
    }

    /**
     * Track page view
     */
    trackPageView(): void {
        this.trackEvent("page_view", {
            path: window.location.pathname,
            url: window.location.href,
        });
    }

    /**
     * Track block view (using Intersection Observer)
     */
    trackBlockView(blockId: string, blockType: string): void {
        this.trackEvent("block_view", {
            blockId,
            blockType,
        });
    }

    /**
     * Track block click
     */
    trackBlockClick(blockId: string, blockType: string): void {
        this.trackEvent("block_click", {
            blockId,
            blockType,
        });
    }

    /**
     * Track link click
     */
    trackLinkClick(url: string, title?: string): void {
        this.trackEvent("link_click", {
            url,
            title,
        });
    }

    /**
     * Track form submission
     */
    trackFormSubmit(formType: string, fields: string[]): void {
        this.trackEvent("form_submit", {
            formType,
            fields,
        });
    }

    /**
     * Track listing view
     */
    trackListingView(listingId: string, listingTitle: string): void {
        this.trackEvent("listing_view", {
            listingId,
            listingTitle,
        });
    }

    /**
     * Track listing click
     */
    trackListingClick(listingId: string, listingTitle: string): void {
        this.trackEvent("listing_click", {
            listingId,
            listingTitle,
        });
    }

    /**
     * Track social media click
     */
    trackSocialClick(platform: string, url: string): void {
        this.trackEvent("social_click", {
            platform,
            url,
        });
    }

    /**
     * Track video play
     */
    trackVideoPlay(videoUrl: string): void {
        this.trackEvent("video_play", {
            videoUrl,
        });
    }

    /**
     * Track phone click
     */
    trackPhoneClick(phoneNumber: string): void {
        this.trackEvent("phone_click", {
            phoneNumber,
        });
    }

    /**
     * Track email click
     */
    trackEmailClick(email: string): void {
        this.trackEvent("email_click", {
            email,
        });
    }

    /**
     * Track scroll depth
     */
    private trackScrollDepth(): void {
        const trackScroll = () => {
            const scrollPercentage =
                (window.scrollY /
                    (document.documentElement.scrollHeight -
                        window.innerHeight)) *
                100;

            const depths = [25, 50, 75, 100];
            for (const depth of depths) {
                if (
                    scrollPercentage >= depth &&
                    !this.scrollDepthTracked.has(depth)
                ) {
                    this.scrollDepthTracked.add(depth);
                    this.trackEvent("scroll_depth", {
                        depth: `${depth}%`,
                    });
                }
            }
        };

        window.addEventListener("scroll", trackScroll, { passive: true });
    }

    /**
     * Track time on page
     */
    private trackTimeOnPage(): void {
        setInterval(() => {
            const timeOnPage = Math.floor((Date.now() - this.startTime) / 1000);
            this.trackEvent("time_on_page", {
                seconds: timeOnPage,
            });
        }, 30000); // Track every 30 seconds
    }

    /**
     * Send events to backend
     */
    private async sendEvents(): Promise<void> {
        if (this.events.length === 0) return;

        const eventsToSend = [...this.events];
        this.events = [];

        try {
            // TODO: Implement actual API call
            // await api.sendAnalytics(eventsToSend);

            // For now, store in localStorage
            const storageKey = `analytics_${this.getCurrentPageSlug()}`;
            const existing = localStorage.getItem(storageKey);
            const allEvents = existing
                ? [...JSON.parse(existing), ...eventsToSend]
                : eventsToSend;
            localStorage.setItem(storageKey, JSON.stringify(allEvents));

            console.log("Analytics events sent:", eventsToSend.length);
        } catch (error) {
            console.error("Failed to send analytics:", error);
            // Put events back in queue
            this.events.unshift(...eventsToSend);
        }
    }

    /**
     * Get analytics summary from stored events
     */
    getAnalyticsSummary(pageSlug: string): AnalyticsSummary {
        const storageKey = `analytics_${pageSlug}`;
        const stored = localStorage.getItem(storageKey);
        const events: AnalyticsEventData[] = stored ? JSON.parse(stored) : [];

        // Calculate metrics
        const pageViews = events.filter((e) => e.event === "page_view").length;
        const uniqueVisitors = new Set(events.map((e) => e.visitorId)).size;

        // Calculate average time on page
        const timeEvents = events.filter((e) => e.event === "time_on_page");
        const avgTimeOnPage =
            timeEvents.length > 0
                ? timeEvents.reduce(
                      (sum, e) => sum + (e.data?.seconds || 0),
                      0
                  ) / timeEvents.length
                : 0;

        // Calculate bounce rate (sessions with only 1 event)
        const sessions = new Map<string, number>();
        events.forEach((e) => {
            sessions.set(e.sessionId, (sessions.get(e.sessionId) || 0) + 1);
        });
        const bouncedSessions = Array.from(sessions.values()).filter(
            (count) => count === 1
        ).length;
        const bounceRate =
            sessions.size > 0 ? (bouncedSessions / sessions.size) * 100 : 0;

        // Top blocks
        const blockViews = new Map<string, number>();
        events
            .filter((e) => e.event === "block_view")
            .forEach((e) => {
                const blockType = e.data?.blockType || "unknown";
                blockViews.set(blockType, (blockViews.get(blockType) || 0) + 1);
            });
        const topBlocks = Array.from(blockViews.entries())
            .map(([blockType, views]) => ({ blockType, views }))
            .sort((a, b) => b.views - a.views)
            .slice(0, 5);

        // Top links
        const linkClicks = new Map<string, number>();
        events
            .filter((e) => e.event === "link_click")
            .forEach((e) => {
                const url = e.data?.url || "unknown";
                linkClicks.set(url, (linkClicks.get(url) || 0) + 1);
            });
        const topLinks = Array.from(linkClicks.entries())
            .map(([url, clicks]) => ({ url, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
            .slice(0, 5);

        // Device breakdown
        const deviceBreakdown: Record<string, number> = {};
        events.forEach((e) => {
            const device = e.deviceType || "unknown";
            deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
        });

        // Referrer breakdown
        const referrerBreakdown: Record<string, number> = {};
        events
            .filter((e) => e.event === "page_view" && e.referrer)
            .forEach((e) => {
                const referrer = e.referrer || "direct";
                referrerBreakdown[referrer] =
                    (referrerBreakdown[referrer] || 0) + 1;
            });

        // Scroll depth
        const scrollDepth = {
            "25%": events.filter(
                (e) => e.event === "scroll_depth" && e.data?.depth === "25%"
            ).length,
            "50%": events.filter(
                (e) => e.event === "scroll_depth" && e.data?.depth === "50%"
            ).length,
            "75%": events.filter(
                (e) => e.event === "scroll_depth" && e.data?.depth === "75%"
            ).length,
            "100%": events.filter(
                (e) => e.event === "scroll_depth" && e.data?.depth === "100%"
            ).length,
        };

        return {
            totalViews: pageViews,
            uniqueVisitors,
            avgTimeOnPage,
            bounceRate,
            topBlocks,
            topLinks,
            deviceBreakdown,
            referrerBreakdown,
            scrollDepth,
        };
    }
}

// Singleton instance
let visitorAnalytics: VisitorAnalyticsEngine | null = null;

export const getVisitorAnalytics = (): VisitorAnalyticsEngine => {
    if (!visitorAnalytics) {
        visitorAnalytics = new VisitorAnalyticsEngine();
    }
    return visitorAnalytics;
};

// Export convenience functions
export const trackPageView = () => getVisitorAnalytics().trackPageView();
export const trackBlockView = (blockId: string, blockType: string) =>
    getVisitorAnalytics().trackBlockView(blockId, blockType);
export const trackBlockClick = (blockId: string, blockType: string) =>
    getVisitorAnalytics().trackBlockClick(blockId, blockType);
export const trackLinkClick = (url: string, title?: string) =>
    getVisitorAnalytics().trackLinkClick(url, title);
export const trackFormSubmit = (formType: string, fields: string[]) =>
    getVisitorAnalytics().trackFormSubmit(formType, fields);
export const trackListingView = (listingId: string, listingTitle: string) =>
    getVisitorAnalytics().trackListingView(listingId, listingTitle);
export const trackListingClick = (listingId: string, listingTitle: string) =>
    getVisitorAnalytics().trackListingClick(listingId, listingTitle);
export const trackSocialClick = (platform: string, url: string) =>
    getVisitorAnalytics().trackSocialClick(platform, url);
export const trackVideoPlay = (videoUrl: string) =>
    getVisitorAnalytics().trackVideoPlay(videoUrl);
export const trackPhoneClick = (phoneNumber: string) =>
    getVisitorAnalytics().trackPhoneClick(phoneNumber);
export const trackEmailClick = (email: string) =>
    getVisitorAnalytics().trackEmailClick(email);
export const getAnalyticsSummary = (pageSlug: string) =>
    getVisitorAnalytics().getAnalyticsSummary(pageSlug);
