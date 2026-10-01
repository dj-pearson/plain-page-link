/**
 * The accessibility statement's feedback form (US-239).
 *
 * The statement offered only an email address. A visitor who cannot easily use
 * an email client — the people the statement is for — needs a form, and the
 * form must reach the same inbox. Pure functions here so the validation and
 * the email are tested without Deno.
 */
import { escapeHtml, type EmailOptions } from './email.ts';
import { stripLinks } from './public-email.ts';

export interface FeedbackInput {
  name: string;
  email: string;
  pageUrl: string;
  assistiveTech: string;
  message: string;
}

export type FeedbackResult = { ok: true; value: FeedbackInput } | { ok: false; errors: Record<string, string> };

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validateFeedback(raw: Record<string, unknown> | null | undefined): FeedbackResult {
  const value: FeedbackInput = {
    name: text(raw?.name, 120),
    email: text(raw?.email, 254),
    pageUrl: text(raw?.pageUrl, 500),
    assistiveTech: text(raw?.assistiveTech, 200),
    message: text(raw?.message, 5000),
  };
  const errors: Record<string, string> = {};
  if (value.message.length < 10) errors.message = 'Please describe the problem in a sentence or two.';
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) errors.email = 'Please enter a valid email address, or leave it blank.';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };
}

/**
 * The visitor's words go into mail from our domain, so they are escaped and
 * link-free in the HTML part. The reporter's own address is the Reply-To, so
 * whoever answers writes back to them directly.
 */
export function buildFeedbackEmail(input: FeedbackInput, inbox: string): EmailOptions {
  const rows: [string, string][] = [
    ['From', input.name || '(not given)'],
    ['Email', input.email || '(not given)'],
    ['Page', input.pageUrl || '(not given)'],
    ['Assistive technology', input.assistiveTech || '(not given)'],
  ];
  const body = [...rows.map(([k, v]) => `${k}: ${v}`), '', input.message].join('\n');
  const html = `<!DOCTYPE html><html lang="en"><body style="font-family:Arial,sans-serif;color:#1f2937;">
<h1 style="font-size:18px;">Accessibility feedback</h1>
<table style="border-collapse:collapse;font-size:14px;">${rows
    .map(([k, v]) => `<tr><th scope="row" style="text-align:left;padding:4px 12px 4px 0;">${escapeHtml(k)}</th><td>${escapeHtml(stripLinks(v, 500))}</td></tr>`)
    .join('')}</table>
<p style="white-space:pre-wrap;font-size:14px;">${escapeHtml(stripLinks(input.message, 5000))}</p>
<p style="font-size:12px;color:#4b5563;">Statement promise: a reply within 5 business days.</p>
</body></html>`;
  return {
    to: inbox,
    subject: 'Accessibility feedback',
    body,
    html,
    replyTo: input.email || undefined,
  };
}
