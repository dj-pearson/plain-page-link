/**
 * Web Vitals Monitoring & Reporting
 *
 * Captures Core Web Vitals (LCP, FID, CLS, TTFB, INP) and reports them.
 * In development: logs to console with budget warnings.
 * In production: sends to Google Analytics as custom events (when available).
 *
 * Google's Core Web Vitals thresholds (used as performance budgets):
 *   LCP  < 2500ms  (Largest Contentful Paint)
 *   FID  < 100ms   (First Input Delay)
 *   CLS  < 0.1     (Cumulative Layout Shift)
 *   TTFB < 800ms   (Time to First Byte)
 *   INP  < 200ms   (Interaction to Next Paint)
 */

import type { Metric } from 'web-vitals';

// Performance budgets — Google's "Good" thresholds
export const PERFORMANCE_BUDGETS = {
  LCP: 2500,   // ms
  FID: 100,    // ms
  CLS: 0.1,    // score
  TTFB: 800,   // ms
  INP: 200,    // ms
} as const;

type MetricName = keyof typeof PERFORMANCE_BUDGETS;

/**
 * Check if a metric exceeds its performance budget
 */
function exceedsBudget(name: string, value: number): boolean {
  const budget = PERFORMANCE_BUDGETS[name as MetricName];
  return budget !== undefined && value > budget;
}

/**
 * Format metric value for display
 */
function formatValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

/**
 * Send metric to Google Analytics (if gtag is available)
 */
function sendToAnalytics(metric: Metric): void {
  const gtag = (window as Record<string, unknown>).gtag as
    | ((...args: unknown[]) => void)
    | undefined;

  if (typeof gtag === 'function') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

/**
 * Log metric to console in development mode
 */
function logMetric(metric: Metric): void {
  const overBudget = exceedsBudget(metric.name, metric.value);
  const formatted = formatValue(metric.name, metric.value);
  const budget = PERFORMANCE_BUDGETS[metric.name as MetricName];

  if (overBudget && budget !== undefined) {
    const budgetFormatted = metric.name === 'CLS' ? budget.toString() : `${budget}ms`;
    console.warn(
      `[Web Vitals] ⚠ ${metric.name}: ${formatted} (exceeds budget of ${budgetFormatted})`
    );
  } else {
    // Using console.warn since console.log is linted — this is intentional dev output
    console.warn(`[Web Vitals] ✓ ${metric.name}: ${formatted}`);
  }
}

/**
 * Handle a web vitals metric report
 */
function reportMetric(metric: Metric): void {
  // Always send to analytics in production
  if (import.meta.env.PROD) {
    sendToAnalytics(metric);
  }

  // Log to console in development for debugging
  if (import.meta.env.DEV) {
    logMetric(metric);
  }
}

/**
 * Initialize Web Vitals monitoring.
 * Call this once at app startup (in main.tsx).
 *
 * Uses dynamic import so web-vitals doesn't bloat the initial bundle.
 */
export async function initWebVitals(): Promise<void> {
  try {
    const { onLCP, onFID, onCLS, onTTFB, onINP } = await import('web-vitals');

    onLCP(reportMetric);
    onFID(reportMetric);
    onCLS(reportMetric);
    onTTFB(reportMetric);
    onINP(reportMetric);
  } catch {
    // Silently fail — web vitals are observability, not critical functionality
    if (import.meta.env.DEV) {
      console.warn('[Web Vitals] Failed to initialize web vitals monitoring');
    }
  }
}
