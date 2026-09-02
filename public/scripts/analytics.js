/**
 * Google Analytics Deferred Loader
 * Loads GA after page is interactive for better performance
 */

(function() {
  'use strict';

  // The measurement id comes from a meta tag that Vite fills in from
  // VITE_GA_MEASUREMENT_ID at build time (US-123). It was hard-coded here, so
  // every deployment of this repository — a fork, a staging environment, a
  // preview build — reported into the production property.
  //
  // A meta tag rather than an inline script because index.html's CSP is
  // script-src 'self' with no 'unsafe-inline'; this file is a static asset, so
  // import.meta.env is not available to it.
  var meta = document.querySelector('meta[name="ga-measurement-id"]');
  var GA_ID = meta ? (meta.getAttribute('content') || '').trim() : '';

  // No id configured for this deployment: load nothing at all rather than
  // requesting gtag.js with an empty id.
  if (!GA_ID || GA_ID.charAt(0) !== 'G') {
    return;
  }

  function loadGA() {
    // Create and append the gtag.js script
    var script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Configure GA
    gtag('js', new Date());
    gtag('config', GA_ID, {
      // Respect user privacy settings
      anonymize_ip: true,
      // Use first-party cookies only
      cookie_flags: 'SameSite=Strict;Secure',
    });
  }

  // --- Consent gating (GDPR / ePrivacy) -----------------------------------
  // Keep these keys in sync with src/lib/cookie-consent.ts.
  var CONSENT_KEY = 'cookie_consent_v1';
  var CONSENT_EVENT = 'cookie-consent-updated';
  var loaded = false;

  function analyticsConsentGranted() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (!raw) return false;
      var parsed = JSON.parse(raw);
      return !!(parsed && parsed.analytics === true);
    } catch (e) {
      return false;
    }
  }

  function maybeLoadGA() {
    if (loaded || !analyticsConsentGranted()) return;
    loaded = true;
    // Load GA after page is idle or after 3 seconds, whichever comes first
    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadGA, { timeout: 3000 });
    } else {
      setTimeout(loadGA, 3000);
    }
  }

  // Load now if consent was granted on a previous visit...
  maybeLoadGA();
  // ...or as soon as the user grants analytics consent this visit.
  window.addEventListener(CONSENT_EVENT, maybeLoadGA);
})();
