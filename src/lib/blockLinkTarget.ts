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

/**
 * Whether a saved block should be published at all on the public page
 * (US-327, US-350). A link button and a CTA block exist only to send the
 * visitor somewhere, so with no usable destination nothing is left worth
 * showing. Every other block type passes — a hero keeps its headline and only
 * drops its button (HeroBlock).
 *
 * The config arrives as jsonb, so its shape is not trusted.
 */
export function blockHasDestination(block: { type?: unknown; config?: unknown }): boolean {
  const config = (block.config && typeof block.config === 'object' ? block.config : {}) as Record<
    string,
    unknown
  >;
  const asUrl = (value: unknown) => (typeof value === 'string' ? value : undefined);
  switch (block.type) {
    case 'link':
      return usableLinkUrl(asUrl(config.url)) !== '';
    case 'cta':
      return usableLinkUrl(asUrl(config.buttonUrl)) !== '';
    default:
      return true;
  }
}
