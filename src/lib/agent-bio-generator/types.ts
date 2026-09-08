/**
 * Types for the Real Estate Agent Bio Generator (US-155).
 *
 * Distinct from src/lib/instagram-bio-analyzer, which scores an existing
 * 150-character Instagram bio. This writes the professional bio an agent needs
 * for a brokerage page, an MLS profile, a listing presentation or a brochure —
 * which is what the Search Console data shows people are actually looking for:
 * "real estate agent bio" (82 impressions, position 88.6), "professional real
 * estate agent bio examples", "real estate bio for new agents", "luxury real
 * estate agent bio", "real estate bio generator". Roughly 180 impressions over
 * 16 months landing on a homepage that sold them a page builder instead.
 */

/** The five audiences the query data actually shows. */
export type BioNiche = 'new-agent' | 'luxury' | 'rental-leasing' | 'team' | 'general';

export type BioTone = 'warm' | 'direct' | 'polished';

export interface AgentBioInput {
  fullName: string;
  city: string;
  state: string;
  niche: BioNiche;
  tone: BioTone;
  /** Years in the business. 0 is meaningful — it selects the new-agent framing. */
  yearsExperience: number;
  brokerage?: string;
  /** Free text, comma separated in the UI: "first-time buyers, condos, relocation". */
  specialties?: string;
  /** What they want the reader to do. */
  credential?: string;
  /** Something human. The single most useful field and the one most often left out. */
  personalNote?: string;
}

export interface GeneratedBio {
  /** Two to three sentences, third person — brokerage pages and MLS profiles. */
  professional: string;
  /** One or two sentences, first person — an about box or a listing presentation. */
  short: string;
  /** 150 characters or fewer, for the Instagram bio field itself. */
  instagram: string;
}

/** A worked example rendered into the page as text, not generated on interaction. */
export interface BioExample {
  niche: BioNiche;
  label: string;
  /** Who this example is for, in one line. */
  forWhom: string;
  bio: GeneratedBio;
}
