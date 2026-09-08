/**
 * The homepage's positioning, in one place (US-152).
 *
 * The old title was "Real Estate Agent Bio Page Builder | Turn Instagram
 * Followers into Leads – AgentBio", and the Search Console export of 2026-09-08
 * shows exactly who that attracted. The largest impression cluster on the whole
 * site was informational and unservable: "real estate agent bio" 82 impressions
 * at position 88.6, "agent bio" 60 at 7.3, "luxury real estate agent bio" 6 at
 * 63.3, "real estate bio new agent" 4 at 105.3, "professional real estate agent
 * bio examples" 2 at 7.5, and a long tail — roughly 180 impressions and one
 * click, from people looking for bio COPY to write about themselves. They do
 * not want a page builder.
 *
 * Meanwhile the query that describes what this actually is, "link in bio for
 * real estate agents", sat at 28 impressions and position 21.2, and "link in
 * bio for realtors" at 4 and position 28.3. Page three for the product, page
 * nine for something it does not sell.
 *
 * So the homepage stops competing for "agent bio". US-155 builds the free bio
 * tool that cluster actually wants, which is how it gets served rather than
 * abandoned.
 *
 * EXPECT IMPRESSIONS TO FALL. Losing ~180 impressions that produced one click
 * in sixteen months is the point of the change, not a regression in it.
 *
 * These values are the single source: src/pages/public/Landing.tsx renders
 * them, and the `homepage-seo` plugin in vite.config.ts writes the same strings
 * into index.html at build time so the static shell and the hydrated page can
 * never drift.
 */

export const HOMEPAGE_SEO = {
  /**
   * 45 characters. The old one was 84 and Google truncated it mid-phrase
   * ("...| Turn Instagram Follo..."), so the half that described the product
   * never reached the SERP at all.
   */
  title: 'Link in Bio for Real Estate Agents | AgentBio',

  description:
    'The link in bio built for real estate agents and realtors. Show your listings, capture buyer and seller leads, and take bookings straight from Instagram.',

  /** The H1. Deliberately the same phrase as the title, minus the brand. */
  h1: 'Link in Bio for Real Estate Agents',

  /**
   * Which words of the H1 take the highlight treatment. Explicit because
   * HeroSection otherwise highlights the last two words positionally, which
   * would break this headline as "Link in Bio for Real" / "Estate Agents".
   */
  h1Highlight: 'Real Estate Agents',

  subtitle: 'Turn Your Instagram Followers Into Qualified Buyer & Seller Leads',

  /**
   * Kept close to the queries that convert. "real estate agent bio" is
   * deliberately absent — US-155 owns that intent.
   */
  keywords: [
    'link in bio for real estate agents',
    'link in bio for realtors',
    'real estate link in bio',
    'linktree alternative for real estate agents',
    'instagram bio link for realtors',
    'real estate agent portfolio link',
    'property listings link in bio',
    'lead capture link in bio',
    'agent booking page for showings',
    'turn instagram followers into real estate leads',
  ],
} as const;
