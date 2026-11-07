import { PRICING_PLANS } from '@/config/pricing-plans';

/**
 * The FAQ on every /for/{city} page, as data (US-311).
 *
 * LocationTemplate used to write these five questions twice: once in the
 * FAQPage JSON-LD and once as JSX. The two copies drifted. US-157 corrected the
 * pricing answer in the schema and left the visible one claiming a free trial
 * and "unlimited property listings" on every plan, so verify:seo failed 23 city
 * pages with "FAQPage answer is not on the page" — and Google was being shown
 * an answer the visitor could not see, which is what its FAQPage policy
 * forbids. One list, rendered in both places, cannot drift.
 *
 * Every answer must be true of the product as shipped:
 * - There is no MLS or IDX feed. Listings are added by hand or imported from a
 *   CSV (CSVUploadDialog), which carries the MLS number. The old answer said
 *   AgentBio "integrates with major MLS and IDX providers" and could
 *   "automatically sync" listings — on 26 pages and in a rich result.
 * - Plan facts come from PRICING_PLANS, so they move when the plans do.
 */
export interface LocationFaq {
  question: string;
  answer: string;
}

function planNamed(id: string) {
  const plan = PRICING_PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`locationFaq: no pricing plan "${id}"`);
  return plan;
}

/** The cheapest plan that has a price. */
function firstPaidPlan() {
  const paid = PRICING_PLANS.filter((p) => p.price_monthly > 0).sort(
    (a, b) => a.price_monthly - b.price_monthly
  );
  if (paid.length === 0) throw new Error('locationFaq: no paid plan');
  return paid[0];
}

function firstPlanWith(feature: 'customDomain' | 'customThemes') {
  const plan = [...PRICING_PLANS]
    .sort((a, b) => a.price_monthly - b.price_monthly)
    .find((p) => p.features[feature] === true);
  if (!plan) throw new Error(`locationFaq: no plan includes ${feature}`);
  return plan;
}

export function buildLocationFaqs(city: string): LocationFaq[] {
  const free = planNamed('free');
  const paid = firstPaidPlan();
  const domainPlan = firstPlanWith('customDomain');
  const themePlan = firstPlanWith('customThemes');

  return [
    {
      question: `How do ${city} real estate agents use AgentBio?`,
      answer: `${city} real estate agents use AgentBio as their Instagram link in bio to showcase ${city} property listings, capture local buyer and seller leads, and book consultations. The page is built for mobile traffic from Instagram and includes features made for real estate professionals.`,
    },
    {
      question: `Can I showcase ${city} property listings on AgentBio?`,
      answer: `Yes. AgentBio lets ${city} agents display property listing cards with photos, addresses, prices, and details. You can mark a listing pending or sold the moment it changes, so your ${city} followers always see current inventory.`,
    },
    {
      question: `Does AgentBio work with ${city} MLS systems?`,
      answer: `Not directly yet: AgentBio does not sync from MLS or IDX feeds. You add your ${city} listings by hand, or import them in bulk from a CSV file that keeps the MLS number with each listing.`,
    },
    {
      question: `How much does AgentBio cost for ${city} agents?`,
      answer: `AgentBio has a free plan with ${free.limits.listings} active listings, lead capture forms and analytics. Paid plans start at $${paid.price_monthly}/month and add more listings and a longer analytics history, and the ${domainPlan.name} plan adds a custom domain. That leaves room to grow for ${city} real estate businesses.`,
    },
    {
      question: `Can I customize my AgentBio page for ${city} branding?`,
      answer: `Yes. Every plan lets you set your photo, bio, brokerage logo and a theme, and the ${themePlan.name} plan and above unlock the premium themes. Many ${city} agents keep the same branding across Instagram, their website, and AgentBio.`,
    },
  ];
}
