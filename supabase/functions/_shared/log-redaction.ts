/**
 * Log redaction for edge functions (US-259).
 *
 * Function logs are kept by the hosting platform and read by whoever operates
 * it; they are not the place for a lead's or visitor's email address. These
 * helpers keep enough of an address to tell two recipients apart while
 * debugging ("j***@g***.com" vs "m***@o***.com") and nothing that identifies
 * the person.
 *
 * Pure, so vitest covers it directly (log-redaction.test.ts), and that test
 * also scans every function for console calls that still print an address,
 * an OAuth token response or a raw request body.
 */

/**
 * "jane.doe@gmail.com" -> "j***@g***.com". Anything that is not a single
 * address (empty, missing, malformed, a list) comes back fully masked, so a
 * caller can pass whatever it has without checking first.
 */
export function maskEmail(value: unknown): string {
  if (typeof value !== 'string') return '[no email]';
  const email = value.trim();
  const at = email.lastIndexOf('@');
  if (at <= 0 || at !== email.indexOf('@') || at === email.length - 1 || /[\s,;<>]/.test(email)) {
    return '***';
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  const tld = dot > 0 && dot < domain.length - 1 ? domain.slice(dot) : '';
  return `${local[0]}***@${domain[0]}***${tld}`;
}

/** Masks one address or a list of them, for a log line. */
export function maskEmails(value: unknown): string {
  if (Array.isArray(value)) return value.map(maskEmail).join(', ');
  return maskEmail(value);
}
