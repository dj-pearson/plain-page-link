/**
 * Cookie consent state (ePrivacy / GDPR cookie rules).
 *
 * The choice is persisted in localStorage under COOKIE_CONSENT_KEY with a
 * timestamp and schema version. The deferred GA loader
 * (public/scripts/analytics.js) reads the SAME key and only initializes
 * Google Analytics when `analytics` consent is granted, and also listens
 * for the COOKIE_CONSENT_EVENT so a later opt-in loads GA without a reload.
 *
 * Keep COOKIE_CONSENT_KEY / COOKIE_CONSENT_EVENT in sync with
 * public/scripts/analytics.js.
 */

export const COOKIE_CONSENT_KEY = 'cookie_consent_v1';
export const COOKIE_CONSENT_EVENT = 'cookie-consent-updated';
/** Fired to re-open the consent banner after a choice has already been made. */
export const COOKIE_PREFERENCES_OPEN_EVENT = 'cookie-preferences-open';
const CONSENT_VERSION = 1;

export interface CookieConsent {
  version: number;
  timestamp: string;
  /** Strictly necessary cookies are always on and cannot be rejected. */
  necessary: true;
  analytics: boolean;
  preferences: boolean;
}

export function getStoredConsent(): CookieConsent | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasMadeChoice(): boolean {
  return getStoredConsent() !== null;
}

export function saveConsent(choice: { analytics: boolean; preferences: boolean }): CookieConsent {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    necessary: true,
    analytics: choice.analytics,
    preferences: choice.preferences,
  };
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: consent }));
  } catch {
    // localStorage unavailable (private mode) — consent simply won't persist.
  }
  return consent;
}

export const acceptAll = () => saveConsent({ analytics: true, preferences: true });

export const rejectNonEssential = () => saveConsent({ analytics: false, preferences: false });

/**
 * Re-open the cookie consent banner so users can review or withdraw consent at
 * any time (GDPR requires withdrawing consent to be as easy as giving it).
 * Wired from the footer "Cookie Preferences" control and the Privacy Choices
 * page. Safe to call before the banner mounts — it's a no-op until then.
 */
export function openCookiePreferences(): void {
  try {
    window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_OPEN_EVENT));
  } catch {
    // window unavailable (SSR) — nothing to open.
  }
}
