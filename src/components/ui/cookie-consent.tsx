import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { hasMadeChoice, acceptAll, rejectNonEssential, saveConsent } from '@/lib/cookie-consent';

/**
 * Cookie consent banner. Renders on first visit (no stored choice) and
 * lets the user Accept All, Reject Non-Essential, or Manage Preferences.
 * The choice is persisted via the cookie-consent lib, which gates the
 * deferred Google Analytics loader.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [managing, setManaging] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);

  useEffect(() => {
    if (!hasMadeChoice()) setVisible(true);
  }, []);

  if (!visible) return null;

  const dismiss = () => setVisible(false);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-5 shadow-2xl">
        <h2 className="text-base font-semibold text-gray-900">We value your privacy</h2>
        <p className="mt-1 text-sm text-gray-600">
          We use strictly necessary cookies to run the site and, with your consent, analytics and
          preference cookies to improve it. See our{' '}
          <Link to="/cookies" className="text-blue-600 underline">
            Cookie Policy
          </Link>
          .
        </p>

        {managing && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" checked disabled className="mt-1" />
              <span>
                <strong>Strictly necessary</strong> — always on. Required for authentication and
                security.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-1"
                aria-label="Analytics cookies"
              />
              <span>
                <strong>Analytics</strong> — anonymous usage stats (Google Analytics) to help us
                improve.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={preferences}
                onChange={(e) => setPreferences(e.target.checked)}
                className="mt-1"
                aria-label="Preference cookies"
              />
              <span>
                <strong>Preferences</strong> — remember your settings and choices.
              </span>
            </label>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {managing ? (
            <Button
              onClick={() => {
                saveConsent({ analytics, preferences });
                dismiss();
              }}
            >
              Save preferences
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setManaging(true)}>
              Manage preferences
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              rejectNonEssential();
              dismiss();
            }}
          >
            Reject non-essential
          </Button>
          <Button
            onClick={() => {
              acceptAll();
              dismiss();
            }}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
