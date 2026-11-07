/**
 * The agent's own numbers and reviews, as page-builder blocks show them (US-305).
 *
 * Four of the six page-builder templates used to ship literal figures and
 * reviews — "200+ Homes Sold", "98% Client Satisfaction", "$50M in Sales",
 * and three five-star reviews from clients who do not exist ("Sold our home in
 * just 5 days above asking price"). Applying a template published all of it on
 * a licensed agent's public page, under their name. That is the same class of
 * fabricated trust claim US-111 removed from the profile itself, and a
 * fabricated testimonial is exactly what the FTC's 2024 rule on fake reviews
 * prohibits.
 *
 * Templates now carry no numbers and no review text. A stat item names a
 * `source` and its value is read from the agent's real data at render time;
 * a testimonial block with `source: 'profile'` shows the agent's published
 * testimonials. A figure that does not exist yet (no sold listings, no years
 * entered, no reviews) is left out rather than shown as 0 or guessed.
 *
 * Pages built from the old templates still hold the invented entries in
 * custom_pages.blocks. `isTemplateFabricatedStat` / `isTemplateFabricatedTestimonial`
 * recognise those exact entries so the blocks never render them, publicly or
 * in the editor's preview.
 */

import type { AgentStatSource, StatItem, Testimonial } from '@/types/pageBuilder';

export type { AgentStatSource };

/** The agent's real figures, as read for a page. */
export interface AgentPageFacts {
  soldListings: number;
  activeListings: number;
  yearsExperience: number | null;
  reviewCount: number;
  /** Mean of published testimonial ratings; null with no reviews. */
  averageRating: number | null;
}

/** One of the agent's published testimonials, shaped for the block. */
export type AgentTestimonial = Testimonial;

export const AGENT_STAT_SOURCES: ReadonlyArray<{
  source: AgentStatSource;
  label: string;
  icon: string;
  /** Where the figure comes from, said to the agent in the settings panel. */
  from: string;
}> = [
  { source: 'sold_listings', label: 'Homes sold', icon: 'home', from: 'your listings marked Sold' },
  {
    source: 'active_listings',
    label: 'Active listings',
    icon: 'trending',
    from: 'your active listings',
  },
  {
    source: 'years_experience',
    label: 'Years experience',
    icon: 'award',
    from: 'Years of experience on your profile',
  },
  {
    source: 'review_count',
    label: 'Client reviews',
    icon: 'users',
    from: 'your published testimonials',
  },
  {
    source: 'average_rating',
    label: 'Average rating',
    icon: 'star',
    from: 'your published testimonials',
  },
];

export function isAgentStatSource(value: unknown): value is AgentStatSource {
  return AGENT_STAT_SOURCES.some((s) => s.source === value);
}

/**
 * The display value for a live stat, or null when the agent has no such
 * figure yet. Zero is "no figure": "0 Homes sold" on a public page is not a
 * claim worth making, and a missing years_experience must not become 0.
 */
export function resolveAgentStat(source: AgentStatSource, facts: AgentPageFacts): string | null {
  switch (source) {
    case 'sold_listings':
      return facts.soldListings > 0 ? String(facts.soldListings) : null;
    case 'active_listings':
      return facts.activeListings > 0 ? String(facts.activeListings) : null;
    case 'years_experience':
      return facts.yearsExperience && facts.yearsExperience > 0
        ? String(facts.yearsExperience)
        : null;
    case 'review_count':
      return facts.reviewCount > 0 ? String(facts.reviewCount) : null;
    case 'average_rating':
      return facts.reviewCount > 0 && facts.averageRating !== null
        ? `${facts.averageRating.toFixed(1)} / 5`
        : null;
  }
}

/** A stat as it will be shown: the value is final, prefix/suffix applied by the block. */
export interface ShownStat {
  id: string;
  value: string;
  label: string;
  icon?: string;
  prefix?: string;
  suffix?: string;
  live: boolean;
}

/**
 * Every literal stat a template or a block default ever shipped. Matched on
 * value, label, prefix and suffix together, so an agent who genuinely typed
 * "200 Homes Sold" keeps it unless it also carries the template's exact "+".
 */
const TEMPLATE_STATS: ReadonlyArray<Pick<StatItem, 'value' | 'label' | 'prefix' | 'suffix'>> = [
  // Premium Showcase template
  { value: '200', label: 'Homes Sold', suffix: '+' },
  { value: '98', label: 'Client Satisfaction', suffix: '%' },
  { value: '15', label: 'Years Experience', suffix: '+' },
  { value: '50', label: 'M in Sales', prefix: '$' },
  // Modern Minimal template
  { value: '100', label: 'Properties Sold', suffix: '+' },
  { value: '5', label: 'Star Rating' },
  { value: '10', label: 'Years in Market', suffix: '+' },
  // The Stats block's default config before US-111
  { value: '150', label: 'Homes Sold', suffix: '+' },
  // The settings panel's "Add" placeholder: never filled in
  { value: '0', label: 'New Stat' },
];

const norm = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function isTemplateFabricatedStat(stat: Partial<StatItem>): boolean {
  return TEMPLATE_STATS.some(
    (t) =>
      norm(t.value) === norm(stat.value) &&
      norm(t.label) === norm(stat.label) &&
      norm(t.prefix) === norm(stat.prefix) &&
      norm(t.suffix) === norm(stat.suffix)
  );
}

/** Reviews the templates and the settings panel's "Add" button invented. */
const TEMPLATE_TESTIMONIALS: ReadonlyArray<Pick<Testimonial, 'name' | 'content'>> = [
  {
    name: 'Sarah & James M.',
    content:
      'An incredible agent who went above and beyond to find us our dream home. Their market knowledge and negotiation skills saved us thousands.',
  },
  {
    name: 'Michael R.',
    content:
      'Sold our home in just 5 days above asking price. The marketing strategy was top-notch and communication was excellent throughout.',
  },
  {
    name: 'Lisa T.',
    content:
      'A true professional who understands the investment side of real estate. Helped me build a portfolio of three rental properties.',
  },
  { name: 'Client Name', content: 'Working with this agent was an amazing experience...' },
];

export function isTemplateFabricatedTestimonial(t: Partial<Testimonial>): boolean {
  return TEMPLATE_TESTIMONIALS.some(
    (f) => norm(f.name) === norm(t.name) && norm(f.content) === norm(t.content)
  );
}

/**
 * The stats a block shows, in order: live items resolved against the agent's
 * facts (dropped when the figure does not exist or the facts are not loaded),
 * typed items kept unless they are a template's invented figure or empty.
 */
export function shownStats(
  stats: ReadonlyArray<Partial<StatItem>> | undefined,
  facts: AgentPageFacts | null
): { shown: ShownStat[]; hiddenFabricated: number; pendingLive: number } {
  const shown: ShownStat[] = [];
  let hiddenFabricated = 0;
  let pendingLive = 0;

  (stats ?? []).forEach((stat, index) => {
    if (!stat || typeof stat !== 'object') return;
    const id = stat.id || `stat_${index}`;
    const label = norm(stat.label);

    if (isAgentStatSource(stat.source)) {
      const meta = AGENT_STAT_SOURCES.find((s) => s.source === stat.source);
      const value = facts ? resolveAgentStat(stat.source, facts) : null;
      if (value === null) {
        pendingLive += 1;
        return;
      }
      shown.push({
        id,
        value,
        label: label || meta?.label || '',
        icon: stat.icon || meta?.icon,
        live: true,
      });
      return;
    }

    if (isTemplateFabricatedStat(stat)) {
      hiddenFabricated += 1;
      return;
    }
    const value = norm(stat.value);
    if (!value || !label) return;
    shown.push({
      id,
      value,
      label,
      icon: stat.icon,
      prefix: stat.prefix,
      suffix: stat.suffix,
      live: false,
    });
  });

  return { shown, hiddenFabricated, pendingLive };
}

/**
 * The typed testimonials a block may show: not a template's invented review,
 * and with both a name and some text (an "Add" never filled in is skipped).
 */
export function shownManualTestimonials(
  testimonials: ReadonlyArray<Partial<Testimonial>> | undefined
): { shown: Testimonial[]; hiddenFabricated: number } {
  const shown: Testimonial[] = [];
  let hiddenFabricated = 0;
  (testimonials ?? []).forEach((t, index) => {
    if (!t || typeof t !== 'object') return;
    if (isTemplateFabricatedTestimonial(t)) {
      hiddenFabricated += 1;
      return;
    }
    const name = norm(t.name);
    const content = norm(t.content);
    if (!name || !content) return;
    shown.push({ ...t, id: t.id || `t_${index}`, name, content } as Testimonial);
  });
  return { shown, hiddenFabricated };
}

/** Raw rows the facts are computed from (kept separate so it is testable). */
export interface AgentFactRows {
  yearsExperience: number | null;
  soldListings: number | null;
  activeListings: number | null;
  testimonials: ReadonlyArray<{
    id: string;
    client_name: string;
    client_title: string | null;
    client_photo: string | null;
    review: string;
    rating: number | null;
  }>;
}

export function buildAgentPageFacts(rows: AgentFactRows): {
  facts: AgentPageFacts;
  testimonials: AgentTestimonial[];
} {
  const ratings = rows.testimonials
    .map((t) => t.rating)
    .filter((r): r is number => typeof r === 'number' && r >= 1 && r <= 5);
  const averageRating =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;

  return {
    facts: {
      soldListings: rows.soldListings ?? 0,
      activeListings: rows.activeListings ?? 0,
      yearsExperience: rows.yearsExperience,
      reviewCount: rows.testimonials.length,
      averageRating,
    },
    testimonials: rows.testimonials.map((t) => ({
      id: t.id,
      name: t.client_name,
      role: t.client_title ?? undefined,
      content: t.review,
      avatarUrl: t.client_photo ?? undefined,
      rating: t.rating ?? undefined,
    })),
  };
}
