/**
 * Real Estate Agent Bio Generator (US-155).
 *
 * Deterministic templates, no model call — the same input always produces the
 * same bio. That is deliberate: it needs no API key, nothing leaves the
 * browser, it works on the first paint, and the worked examples at the bottom
 * of the page can be produced by this same code at module load, so what a
 * crawler reads is exactly what a visitor gets rather than marketing copy that
 * drifts from the tool.
 *
 * Follows src/lib/instagram-bio-analyzer/bio-generator.ts: template objects, a
 * structure function per shape, plain string assembly.
 */

import type { AgentBioInput, BioExample, BioNiche, GeneratedBio } from './types';

const INSTAGRAM_LIMIT = 150;

/** Joins a list the way a person would: "a, b and c". */
function listOf(items: string[]): string {
  const clean = items.map((i) => i.trim()).filter(Boolean);
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  return `${clean.slice(0, -1).join(', ')} and ${clean[clean.length - 1]}`;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim();
}

function specialtyList(input: AgentBioInput): string[] {
  return (input.specialties || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * How the agent's standing is described.
 *
 * The new-agent case is the one that matters. "Real estate bio for new agents"
 * and "real estate bio examples new agent" are both in the query data, and the
 * honest answer is not to imply experience that is not there — it is to lead
 * with what a new agent does have: attention, availability, and whatever they
 * did before this.
 */
function experienceClause(input: AgentBioInput): string {
  const { yearsExperience, city, niche } = input;
  const where = city ? ` in ${city}` : '';

  if (niche === 'new-agent' || yearsExperience < 1) {
    return `is a newly licensed agent${where} who brings a level of attention that a full book of business rarely allows`;
  }
  if (yearsExperience < 3) {
    return `has spent ${yearsExperience === 1 ? 'a year' : `${yearsExperience} years`} helping people buy and sell${where}`;
  }
  return `has ${yearsExperience} years of experience${where}`;
}

const NICHE_FOCUS: Record<BioNiche, string> = {
  'new-agent': 'first-time buyers and anyone who wants their questions answered properly',
  luxury: 'high-value homes and the discretion that comes with them',
  'rental-leasing': 'renters, landlords and the turnover that never waits',
  team: 'buyers and sellers who want a whole team behind them rather than one calendar',
  general: 'buyers and sellers',
};

const NICHE_CLOSER: Record<BioNiche, string> = {
  'new-agent': 'Ask the questions you think are too basic. Those are the good ones.',
  luxury: 'Enquiries are handled personally and in confidence.',
  'rental-leasing': 'Available for viewings on short notice, including evenings.',
  team: 'Someone on the team is reachable when you need them, not just when it suits us.',
  general: 'Happy to talk it through before you commit to anything.',
};

function toneOpener(input: AgentBioInput): string {
  const name = input.fullName.trim();
  switch (input.tone) {
    case 'direct':
      return `${name} ${experienceClause(input)}.`;
    case 'polished':
      return `${name} ${experienceClause(input)}, working with ${NICHE_FOCUS[input.niche]}.`;
    case 'warm':
    default:
      return `${name} ${experienceClause(input)}, and works mostly with ${NICHE_FOCUS[input.niche]}.`;
  }
}

/** Third person, two to three sentences. Brokerage pages and MLS profiles. */
function buildProfessional(input: AgentBioInput): string {
  const parts: string[] = [toneOpener(input)];

  const specialties = specialtyList(input);
  if (specialties.length > 0) {
    parts.push(`${firstName(input.fullName)} focuses on ${listOf(specialties)}.`);
  }

  if (input.brokerage) {
    const where = input.state ? `${input.city}, ${input.state}` : input.city;
    parts.push(
      `${firstName(input.fullName)} is licensed with ${input.brokerage}${where ? ` and serves ${where}` : ''}.`
    );
  }

  if (input.credential) {
    parts.push(`${input.credential}.`);
  }

  if (input.personalNote) {
    parts.push(`${input.personalNote}.`);
  }

  parts.push(NICHE_CLOSER[input.niche]);
  return parts.join(' ').replace(/\.\./g, '.').replace(/\s+/g, ' ').trim();
}

/** First person, one or two sentences. An about box or a listing presentation. */
function buildShort(input: AgentBioInput): string {
  const specialties = specialtyList(input);
  const where = input.city ? ` in ${input.city}` : '';
  const focus = specialties.length > 0 ? listOf(specialties) : NICHE_FOCUS[input.niche];

  const opener =
    input.niche === 'new-agent' || input.yearsExperience < 1
      ? `I am a newly licensed agent${where}`
      : `I have been ${input.niche === 'rental-leasing' ? 'leasing' : 'selling'}${where} for ${input.yearsExperience} year${input.yearsExperience === 1 ? '' : 's'}`;

  return `${opener}, and I work with ${focus}. ${NICHE_CLOSER[input.niche]}`
    .replace(/\s+/g, ' ')
    .trim();
}

/** 150 characters or fewer, for the Instagram bio field itself. */
function buildInstagram(input: AgentBioInput): string {
  const where = [input.city, input.state].filter(Boolean).join(', ');
  const specialties = specialtyList(input);
  const focus = specialties[0] || NICHE_FOCUS[input.niche].split(' and ')[0];

  const candidates = [
    `${where ? `${where} ` : ''}real estate | ${focus} | Listings and booking below`,
    `${where ? `${where} ` : ''}real estate | ${focus} | Tap the link`,
    `${where ? `${where} ` : ''}real estate | Listings below`,
    `Real estate | Listings below`,
  ];

  return (
    candidates.find((c) => c.length <= INSTAGRAM_LIMIT) ??
    candidates[candidates.length - 1].slice(0, INSTAGRAM_LIMIT)
  );
}

export function generateAgentBio(input: AgentBioInput): GeneratedBio {
  return {
    professional: buildProfessional(input),
    short: buildShort(input),
    instagram: buildInstagram(input),
  };
}

/**
 * The worked examples the page renders as text.
 *
 * Produced by the generator above rather than written by hand, so the examples
 * a crawler indexes cannot drift from what the tool actually returns. The names
 * and details are plainly illustrative — the page says so — and no example
 * claims a ranking, an award or a sales figure, because an invented credential
 * on a bio-examples page is the kind of thing an agent copies verbatim.
 */
export const BIO_EXAMPLES: BioExample[] = [
  {
    niche: 'new-agent',
    label: 'New agent',
    forWhom: 'Licensed this year, no closings yet, and tired of bios that imply a decade of them.',
    bio: generateAgentBio({
      fullName: 'Sam Whitfield',
      city: 'Boise',
      state: 'ID',
      niche: 'new-agent',
      tone: 'warm',
      yearsExperience: 0,
      brokerage: 'Cascade & Co.',
      specialties: 'first-time buyers, condos',
      personalNote: 'Spent six years in mortgage lending before getting licensed',
    }),
  },
  {
    niche: 'luxury',
    label: 'Luxury',
    forWhom: 'High-value listings where discretion matters more than enthusiasm.',
    bio: generateAgentBio({
      fullName: 'Nadia Ferreira',
      city: 'Coral Gables',
      state: 'FL',
      niche: 'luxury',
      tone: 'polished',
      yearsExperience: 12,
      brokerage: 'Ferreira Estates',
      specialties: 'waterfront homes, private sales',
      credential: 'Fluent in English, Portuguese and Spanish',
    }),
  },
  {
    niche: 'rental-leasing',
    label: 'Rentals and leasing',
    forWhom: 'Leasing agents and property managers, where speed beats polish.',
    bio: generateAgentBio({
      fullName: 'Marcus Bell',
      city: 'Philadelphia',
      state: 'PA',
      niche: 'rental-leasing',
      tone: 'direct',
      yearsExperience: 5,
      specialties: 'student rentals, small landlords',
    }),
  },
  {
    niche: 'team',
    label: 'Team lead',
    forWhom: 'Writing on behalf of a team without sounding like a brochure.',
    bio: generateAgentBio({
      fullName: 'Priya Raman',
      city: 'Round Rock',
      state: 'TX',
      niche: 'team',
      tone: 'warm',
      yearsExperience: 8,
      brokerage: 'The Raman Group',
      specialties: 'relocation, new builds',
      personalNote: 'The team covers five agents and one very organised transaction coordinator',
    }),
  },
  {
    niche: 'general',
    label: 'Everyone else',
    forWhom: 'A solid general-purpose bio when no niche fits.',
    bio: generateAgentBio({
      fullName: 'Dana Okafor',
      city: 'Columbus',
      state: 'OH',
      niche: 'general',
      tone: 'warm',
      yearsExperience: 4,
      specialties: 'downsizers, investment properties',
    }),
  },
];

export { INSTAGRAM_LIMIT };
