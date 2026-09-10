/**
 * The free tools, in one place (US-167).
 *
 * Read by the /tools hub and by the footer, so a tool cannot be added in one
 * and forgotten in the other — which is how /tools/real-estate-agent-bio-generator
 * came to be in the sitemap with no inbound link anywhere on the site (US-165).
 *
 * No React and no `@/` import, for the same reason src/config/prerender-routes.ts
 * has none: node reads this at build time.
 */

export interface ToolDefinition {
  /** Route path, which is also what the prerender and the sitemap use. */
  path: string;
  /** Full name, as the tool's own <h1> says it. */
  name: string;
  /** Short name for a footer column. */
  shortName: string;
  /** What it does, in the tool's own terms rather than in adjectives. */
  summary: string;
  /** The situation someone is in when this is the right one to open. */
  useWhen: string;
  /** Link text out of the hub. */
  cta: string;
}

export const TOOLS: readonly ToolDefinition[] = [
  {
    path: '/tools/real-estate-agent-bio-generator',
    name: 'Real estate agent bio generator',
    shortName: 'Agent bio generator',
    summary:
      'Answer six questions and get three versions of your bio: a professional paragraph for a brokerage page or MLS profile, a shorter first-person version, and one that fits Instagram’s 150 characters.',
    useWhen:
      'you are setting up a profile somewhere and the empty bio box is the reason you have not finished.',
    cta: 'Write a bio',
  },
  {
    path: '/tools/instagram-bio-analyzer',
    name: 'Instagram bio analyzer',
    shortName: 'Instagram bio analyzer',
    summary:
      'Paste an Instagram bio and get it scored on the things that decide whether a profile visitor taps the link: whether it says who you help, whether it says where, and whether there is a reason to click.',
    useWhen:
      'your profile gets visits and your link does not get taps, and you want to know which of the two is the problem.',
    cta: 'Score a bio',
  },
  {
    path: '/tools/listing-description-generator',
    name: 'Listing description generator',
    shortName: 'Listing description writer',
    summary:
      'Give it the facts of a property — beds, baths, square footage, what is actually good about it — and get a first draft of the description, in a few lengths.',
    useWhen: 'the listing goes live tomorrow and the description is the last thing left.',
    cta: 'Draft a description',
  },
] as const;
