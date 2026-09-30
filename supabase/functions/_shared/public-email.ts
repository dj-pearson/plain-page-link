/**
 * Text that reaches an email the sender did not write (US-219).
 *
 * The free tools (listing description generator, Instagram bio analyzer) are
 * public: an anonymous visitor inserts the capture row, including the address
 * to mail, and the content that goes in the email. Before US-219 the two send
 * functions went further and took the recipient and every line of content from
 * the request body, interpolated unescaped into HTML — anyone could send any
 * markup, phishing links included, to any inbox, from agentbio.net.
 *
 * The send functions now load the recipient and content from the stored rows
 * and send at most once per capture. This module is the remaining layer: what
 * is interpolated is text, with links removed, so a visitor-chosen string
 * cannot become a clickable lure in mail from our domain.
 */
import { escapeHtml } from './email.ts';

const LINKISH =
  /\b(?:https?:\/\/|www\.)[^\s<>"']+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|io|co|info|biz|xyz|link|click|app|ru|cn|top|me|ly)\b(?:\/[^\s<>"']*)?/gi;

/** Removes URLs and bare domains, collapses what is left, and caps the length. */
export function stripLinks(value: unknown, maxLength = 2000): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(LINKISH, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** For HTML bodies: link-free and escaped. */
export function safeHtmlText(value: unknown, maxLength = 2000): string {
  return escapeHtml(stripLinks(value, maxLength));
}

/** A number, or 0 — for values interpolated with toLocaleString(). */
export function safeNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
