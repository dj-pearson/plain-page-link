/**
 * Claims the marketing pages are allowed to make.
 *
 * US-111: the signup page said "2,500+ agents" while the landing page said
 * "5,000+" — two different invented numbers for the same thing, on two pages
 * one click apart. The landing page's JSON-LD also carried ratingValue 4.8 over
 * 523 reviews, which Google renders as stars in search results.
 *
 * Everything user-facing and countable now comes from here, so the numbers
 * cannot disagree with each other. More importantly: a claim goes here only if
 * someone can point at the thing that makes it true. Until an agent count is
 * measured, the copy does not name one.
 */
export const MARKETING_COPY = {
  /**
   * Deliberately not a number. Replace with `Join ${count}+ agents` once
   * there is a query behind `count`, not before.
   */
  joinLine: 'Join agents growing their business with AgentBio',

  /**
   * What the security section may claim.
   *
   * The previous copy said "SOC 2 compliant". No attestation exists — there is
   * no report, no auditor and no Trust Center in this repo or referenced from
   * it. These three are things the code actually does: Postgres row-level
   * security on every table, AES-256-GCM on lead contact details (US-066,
   * US-086), and TLS in transit.
   */
  securityClaims: [
    'Row-level security on every table',
    'Lead contact details encrypted at rest',
    'Encrypted in transit (TLS)',
  ],
} as const;
