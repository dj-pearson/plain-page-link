/**
 * Which webhook destinations an agent may point the platform at (US-119).
 *
 * `profiles.zapier_webhook_url` had no validation on write, no CHECK on the
 * column, and no guard on read — and submit-lead fetches it with the service
 * role from an edge runtime that shares a Docker network with postgres-meta,
 * Kong and GoTrue. An agent could set it to http://postgres-meta:8080 and have
 * the platform fetch an internal service on every lead they received.
 *
 * Three layers now agree, and this is the one the agent sees: the column has a
 * CHECK, submit-lead re-checks and puts the fetch through the SSRF guard, and
 * this stops a wrong value being saved in the first place, with a message that
 * says what is wrong.
 *
 * Kept in step with the CHECK constraint in
 * 20260902000017_audit_redaction_and_webhook_check.sql and with
 * isValidWebhookUrl in supabase/functions/_shared/validation.ts.
 */

/** Matches the column's CHECK constraint exactly. */
const ALLOWED = /^https:\/\/(hooks\.zapier\.com|hook\.[a-z0-9-]+\.make\.com)\//;

export interface WebhookUrlCheck {
  valid: boolean;
  error?: string;
}

export function validateWebhookUrl(raw: string): WebhookUrlCheck {
  const url = raw.trim();

  // Empty means "no webhook", which is a valid state — the field clears it.
  if (!url) return { valid: true };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: 'That is not a valid URL.' };
  }

  if (parsed.protocol !== 'https:') {
    // This payload carries lead contact details to a third party.
    return { valid: false, error: 'The webhook URL must start with https://.' };
  }

  if (!ALLOWED.test(url)) {
    return {
      valid: false,
      error:
        'Only Zapier (hooks.zapier.com) and Make (hook.<region>.make.com) webhooks are accepted.',
    };
  }

  return { valid: true };
}
