// Simple analytics tracking utility
// Can be extended to integrate with Google Analytics, Plausible, etc.

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

class Analytics {
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true';
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      }
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', analyticsEvent);
    }

    // Send to backend analytics endpoint
    this.sendToBackend(analyticsEvent);
  }

  page(pageName: string, properties?: Record<string, any>) {
    this.track('page_view', {
      page: pageName,
      ...properties,
    });
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (!this.enabled) return;

    const identifyEvent = {
      userId,
      traits,
      timestamp: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
      console.log('[Analytics] Identify', identifyEvent);
    }
  }

  private async sendToBackend(event: AnalyticsEvent) {
    try {
      // Future: send to analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
    } catch (error) {
      console.error('[Analytics] Error sending event:', error);
    }
  }
}

export const analytics = new Analytics();

// Track page views on route changes
export const trackPageView = (path: string) => {
  analytics.page(path);
};

// Common event tracking functions
export const trackButtonClick = (buttonName: string, context?: Record<string, any>) => {
  analytics.track('button_click', {
    button_name: buttonName,
    ...context,
  });
};

export const trackFormSubmit = (formName: string, success: boolean) => {
  analytics.track('form_submit', {
    form_name: formName,
    success,
  });
};

export const trackLeadCapture = (leadType: string, source: string) => {
  analytics.track('lead_captured', {
    lead_type: leadType,
    source,
  });
};

export const trackListingView = (listingId: string, listingPrice: number) => {
  analytics.track('listing_viewed', {
    listing_id: listingId,
    listing_price: listingPrice,
  });
};
