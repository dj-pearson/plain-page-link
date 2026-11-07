/**
 * Where a page-builder link button may send a visitor (US-327).
 *
 * The First-Time Buyer and Investor templates shipped link buttons titled
 * "First-Time Buyer Guide (Free Download)" and "Market Analysis Report" with
 * url '#', and a new Link block defaulted to https://example.com. Applied
 * unchanged, the agent's public page carried a button promising a free
 * download that went nowhere. The templates no longer do that, but pages
 * built from them are already saved as jsonb, so the renderer also refuses to
 * publish a link that has no real destination.
 */
import { sanitizeUrl } from '@/utils/sanitize';

/** RFC 2606 reserves these for documentation; they are never a real target. */
const RESERVED_HOST = /(^|\.)example\.(com|org|net)$/i;

/**
 * The URL a link block may navigate to, or '' when it has no real
 * destination: empty, unsafe (javascript:, data:, ...), a bare '#', or a
 * documentation placeholder host.
 */
export function usableLinkUrl(url: string | null | undefined): string {
  const safe = sanitizeUrl(url);
  if (!safe || safe === '#') return '';
  if (/^https?:\/\//i.test(safe)) {
    try {
      if (RESERVED_HOST.test(new URL(safe).hostname)) return '';
    } catch {
      return '';
    }
  }
  return safe;
}
