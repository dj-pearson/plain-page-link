/**
 * The site-wide JSON-LD entities — AgentBio the Organization and agentbio.net
 * the WebSite — named one way everywhere (US-356).
 *
 * A JSON-LD `@id` is how a consumer learns that two nodes describe the same
 * thing, and it compares them as strings. The Organization was published under
 * two: PageSEO declared it as `https://agentbio.net#organization` and pointed
 * every WebPage and WebSite publisher at that, while the enhanced Organization
 * schema, the city pages and the landing page used
 * `https://agentbio.net/#organization`. The WebSite had the same split. So a
 * page could carry an Organization node and a publisher reference that did not
 * resolve to it.
 *
 * And the BlogPosting publisher gave its logo as /Cover.png, the 1536x1024
 * social banner, where the Organization node gives /logo.png. Google reads
 * Article.publisher.logo as the publisher's logo; a banner is not one, and two
 * different logos for one publisher is two answers to one question.
 *
 * Everything that names these entities builds them here.
 */
import { ORGANIZATION_LOGO } from './og-image';

/** The origin with no trailing slash, so `${origin}/#…` never doubles it. */
function bare(origin: string): string {
  return origin.replace(/\/+$/, '');
}

/** The Organization's node id: `${origin}/#organization`. */
export function organizationId(origin: string): string {
  return `${bare(origin)}/#organization`;
}

/** The WebSite's node id: `${origin}/#website`. */
export function websiteId(origin: string): string {
  return `${bare(origin)}/#website`;
}

export interface LogoImageObject {
  '@type': 'ImageObject';
  url: string;
  width: string;
  height: string;
}

/**
 * The organisation logo as an ImageObject, at the size the file actually is
 * (verified against the bytes by og-image.test.ts). Used by the Organization
 * node and by every publisher that names AgentBio, so they share one logo.
 */
export function organizationLogo(origin: string): LogoImageObject {
  return {
    '@type': 'ImageObject',
    url: `${bare(origin)}${ORGANIZATION_LOGO.path}`,
    width: String(ORGANIZATION_LOGO.width),
    height: String(ORGANIZATION_LOGO.height),
  };
}

/**
 * AgentBio as the publisher of a page or article: a reference to the
 * Organization node by id, with enough inline (name, url, logo) that a
 * consumer which does not follow references still gets a complete publisher.
 */
export function publisherOrganization(origin: string) {
  return {
    '@type': 'Organization' as const,
    '@id': organizationId(origin),
    name: 'AgentBio',
    url: bare(origin),
    logo: organizationLogo(origin),
  };
}
