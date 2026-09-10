/**
 * The site's default social preview image, and the size it actually is
 * (US-174).
 *
 * Four components each hardcoded `og:image:width 1200` and
 * `og:image:height 630` next to the URL. Cover.png is 1536x1024 — a 1.5 aspect
 * ratio where the tags claim 1.905. Facebook, LinkedIn, Slack and X read those
 * numbers to reserve layout before the bytes arrive, so every unfurl of every
 * page on the site reserved a shape the image does not have.
 *
 * Worse, ArticleSEO asserted the same 1200x630 for an article's own
 * featured_image_url — an arbitrary upload the code has never seen — including
 * inside the BlogPosting JSON-LD as ImageObject.width / .height. Google reads
 * those to decide large-image rich-result eligibility, which needs 1200px or
 * more. Claiming 1200 for an image that might be 600 is not a rounding error;
 * it is a false eligibility claim about a file the crawler is about to fetch
 * and measure for itself.
 *
 * So the rule this file exists to hold: state a dimension only for an image
 * whose dimensions are known here. For anything supplied by a caller, emit the
 * URL and no size. The Open Graph spec makes width and height optional, and an
 * absent number costs a placeholder; a wrong one costs a broken card.
 *
 * The numbers below are verified against the bytes on disk by
 * src/config/og-image.test.ts, which reads the PNG header. Editing them without
 * changing the file fails that test, and so does replacing the file without
 * editing them.
 */

export interface SocialImage {
  /** Path under public/, served from the site root. */
  path: string;
  /** Intrinsic width in pixels, as the file has it. */
  width: number;
  /** Intrinsic height in pixels, as the file has it. */
  height: number;
  /** Fallback alt text, used when a page does not describe its own image. */
  alt: string;
}

export const DEFAULT_SOCIAL_IMAGE: SocialImage = {
  path: '/Cover.png',
  width: 1536,
  height: 1024,
  alt: 'AgentBio: a real estate agent profile page showing listings, contact links and a booking button',
};

/**
 * Whether a social image URL is the site default, and therefore one whose
 * dimensions are known.
 *
 * Compared on the path rather than the whole URL because the same file is
 * referenced against whichever origin getBaseUrl() resolves to.
 */
export function isDefaultSocialImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url, 'https://agentbio.net').pathname === DEFAULT_SOCIAL_IMAGE.path;
  } catch {
    return url === DEFAULT_SOCIAL_IMAGE.path;
  }
}

/**
 * The organisation logo, and the size it actually is (US-178).
 *
 * SEO_CONFIG.organization declared logoWidth 512 and logoHeight 512, and two
 * Organization schemas shipped `logo: { '@type': 'ImageObject', width: '512',
 * height: '512' }` on every page. public/logo.png is 946x436. Google reads
 * Organization.logo for the knowledge panel and fetches the file, so this was
 * the US-174 defect again, in the node that says who the company is.
 *
 * Verified against the bytes on disk by src/config/og-image.test.ts, the same
 * way DEFAULT_SOCIAL_IMAGE is.
 */
export const ORGANIZATION_LOGO: SocialImage = {
  path: '/logo.png',
  width: 946,
  height: 436,
  alt: 'AgentBio',
};
