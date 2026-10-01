/**
 * A six-digit code from whatever was typed or pasted (US-238, SC 3.3.8).
 *
 * The inputs had maxLength={6}, which the browser applies BEFORE onChange
 * strips non-digits — so a code pasted from an authenticator as "123 456"
 * arrived as "123 45" and could never be submitted. Strip, then cut.
 */
export function normalizeOtp(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 6);
}
