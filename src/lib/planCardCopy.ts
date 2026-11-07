/**
 * What a plan card on /pricing says, built from a subscription_plans row.
 *
 * The page used to print every truthy key of `plan.features` through
 * `key.replace(/_/g, ' ')` under `text-transform: capitalize`. The keys are
 * camelCase, so the public page an agent buys from read "CustomThemes",
 * "RemoveBranding", "AiListingDescriptions" and "LeadScoring" — and any key a
 * migration added later would have appeared the same way, sold or not.
 *
 * Now a key reaches the card only through this allowlist, worded here, and
 * only if the product actually delivers it per plan (US-143, "say what
 * ships"). Keys that are deliberately NOT on the card:
 *
 *   analytics             covered by the "N days of analytics" line
 *   openHouseManagement   covered by the open-house count line
 *   leadScoring           every plan gets scores; no code gates it, so listing
 *                         it on paid cards would imply Free lacks it
 *   workflows,            follow-up sequences do not send email yet (US-136,
 *   emails_per_month      US-224); the quota exists so they cannot ship
 *                         unmetered, not because they are sold
 *   sms_per_month         there is no SMS provider (US-103)
 *   market_reports_*, cma_reports_*, virtual_staging_*, video_tours_*
 *                         metered in the database, features not built
 *
 * A new line belongs here only once the thing it describes works.
 */

export interface PlanCardSource {
  /** subscription_plans.limits (jsonb); typed loosely so any row shape fits. */
  limits: object | null | undefined;
  features: Record<string, unknown> | null | undefined;
}

/** Yes/no plan features the card may name, with the words it uses. */
export const PLAN_CARD_FEATURES = {
  customThemes: 'Premium themes',
  customDomain: 'Your own domain',
  removeBranding: 'No AgentBio branding',
  prioritySupport: 'Priority support',
} as const;

export type PlanCardFeatureKey = keyof typeof PLAN_CARD_FEATURES;

function count(limits: PlanCardSource['limits'], key: string): number | null {
  const value = limits ? (limits as Record<string, unknown>)[key] : undefined;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** "Unlimited" for -1, a grouped number otherwise. */
function amount(n: number): string {
  return n === -1 ? 'Unlimited' : n.toLocaleString('en-US');
}

/**
 * The card's lines, in order. Counts first (what the agent can hold), then the
 * yes/no features the plan includes. A limit of 0 means "not on this plan"
 * and is left off rather than printed as "0 testimonials".
 */
export function planCardLines(plan: PlanCardSource): string[] {
  const { limits, features } = plan;
  const lines: string[] = [];

  const listings = count(limits, 'listings');
  if (listings !== null && listings !== 0) lines.push(`${amount(listings)} active listings`);

  const contacts = count(limits, 'contacts');
  if (contacts !== null && contacts !== 0) {
    lines.push(`${amount(contacts)} clients with key dates`);
  }

  const openHouses = count(limits, 'open_houses_per_month');
  if (openHouses !== null && openHouses !== 0) {
    lines.push(
      openHouses === -1
        ? 'Unlimited open houses with sign-in kiosk'
        : `${amount(openHouses)} open house${openHouses === 1 ? '' : 's'} a month with sign-in kiosk`
    );
  }

  const leads = count(limits, 'leads_per_month');
  if (leads !== null && leads !== 0) {
    lines.push(leads === -1 ? 'Unlimited leads' : `${amount(leads)} leads a month`);
  }

  const links = count(limits, 'links');
  if (links !== null && links !== 0) lines.push(`${amount(links)} custom links`);

  const testimonials = count(limits, 'testimonials');
  if (testimonials !== null && testimonials !== 0) {
    lines.push(`${amount(testimonials)} testimonials`);
  }

  const analyticsDays = count(limits, 'analytics_days');
  if (analyticsDays !== null && analyticsDays !== 0) {
    lines.push(
      analyticsDays === -1
        ? 'Unlimited analytics history'
        : `${amount(analyticsDays)}-day analytics`
    );
  }

  // Charged per use by generate-listing-description (consume_plan_quota), so
  // the monthly number is what the agent actually gets.
  const aiDescriptions = count(limits, 'ai_listing_descriptions_per_month');
  if (aiDescriptions !== null && aiDescriptions !== 0) {
    lines.push(
      aiDescriptions === -1
        ? 'Unlimited AI listing descriptions'
        : `${amount(aiDescriptions)} AI listing description${aiDescriptions === 1 ? '' : 's'} a month`
    );
  } else if (aiDescriptions === null && features?.aiListingDescriptions === true) {
    lines.push('AI listing descriptions');
  }

  for (const [key, label] of Object.entries(PLAN_CARD_FEATURES)) {
    if (features?.[key] === true) lines.push(label);
  }

  return lines;
}
