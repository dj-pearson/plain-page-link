import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * The last-resort app URL, used only when VITE_APP_URL is unset.
 *
 * This module is the ONLY place either of these two values is written. There
 * used to be four independent copies of `VITE_APP_URL || 'https://agentbio.net'`
 * — here, lib/constants.ts, lib/structured-data.ts and lib/url-validation.ts —
 * plus a fifth hard-coded literal in config/seo.config.ts and nine
 * `process.env.NEXT_PUBLIC_APP_URL` references (a Next.js name, always
 * undefined in a Vite build). Setting VITE_APP_URL for a staging deploy fixed
 * one of them (US-123).
 */
const FALLBACK_APP_URL = 'https://agentbio.net';

/**
 * The deployment's configured app URL, independent of where the code is running.
 *
 * Use this when you need the canonical address of *this deployment* — the
 * origin an emailed link should point at, or the origin a redirect is allowed
 * to target. Use getSafeOrigin() instead when you want the origin the visitor
 * is actually on (a custom domain, say).
 */
export function getConfiguredAppUrl(): string {
  const configured = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_APP_URL : undefined;
  return (configured || '').trim() || FALLBACK_APP_URL;
}

/**
 * Get the site origin in a way that's safe for SSR/prerendering/crawlers
 * Falls back to the configured app URL when window is not available
 */
export function getSafeOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Fallback for SSR/prerendering/crawler contexts
  return getConfiguredAppUrl();
}
