/**
 * Quick-response templates for the lead detail modal (US-130 slice 2).
 *
 * The templates used to prefill the notes box and stop there: an agent who
 * chose "Buyer Follow-up" got the text saved as a note about the lead, not
 * sent to the lead. These helpers fill a template for one lead and build the
 * mailto:/sms: link that hands it to the agent's own mail or messages app, so
 * the reply goes out from the agent's address and the CRM records what was
 * sent. AgentBio does not send lead email itself yet (US-135).
 */
import type { Lead } from '@/types/lead';

export interface QuickResponse {
  id: string;
  title: string;
  /** Email subject. Texts carry the body only. */
  subject: string;
  template: string;
}

export const QUICK_RESPONSES: readonly QuickResponse[] = [
  {
    id: 'intro',
    title: 'Introduction',
    subject: 'Thanks for reaching out',
    template:
      "Hi {name}, thank you for reaching out! I'd love to help you {lead_type}. When would be a good time to chat?",
  },
  {
    id: 'buyer_followup',
    title: 'Buyer Follow-up',
    subject: 'Homes that match what you are looking for',
    template:
      "Hi {name}, I have some great properties that match what you're looking for. Are you available for a showing this week?",
  },
  {
    id: 'seller_followup',
    title: 'Seller Follow-up',
    subject: 'Visiting your property',
    template:
      "Hi {name}, I'd like to schedule a time to visit your property and discuss your goals. What days work best for you?",
  },
  {
    id: 'valuation',
    title: 'Home Valuation',
    subject: 'Your home valuation',
    template:
      "Hi {name}, I've prepared a comparative market analysis for your property. Can we schedule a call to discuss the current market value?",
  },
];

/** What the agent offers to help with, phrased to follow "help you". */
function leadGoal(leadType: string | null | undefined): string {
  const type = (leadType ?? '').toLowerCase();
  if (type.includes('buyer') || type === 'open_house') return 'find your next home';
  if (type.includes('seller')) return 'sell your property';
  if (type.includes('valuation')) return 'understand what your home is worth';
  return 'with your real estate plans';
}

/** The first name, so "Hi Dana" rather than "Hi Dana Q. Buyer". */
function greetingName(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first || 'there';
}

/** Fills every placeholder, not only the first of each. */
export function fillQuickResponse(
  template: string,
  lead: Pick<Lead, 'name' | 'lead_type'>
): string {
  const goal = leadGoal(lead.lead_type);
  return template.split('{name}').join(greetingName(lead.name)).split('{lead_type}').join(goal);
}

export type QuickResponseChannel = 'email' | 'sms';

/**
 * The link that opens the agent's mail or messages app with the reply filled
 * in. Returns null when the lead has no address for that channel (a
 * phone-only lead, or a locked lead whose details pii-crypto withheld).
 */
export function quickResponseHref(
  channel: QuickResponseChannel,
  lead: Pick<Lead, 'email' | 'phone'>,
  body: string,
  subject: string
): string | null {
  if (channel === 'email') {
    if (!lead.email) return null;
    const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return `mailto:${encodeURIComponent(lead.email).replace(/%40/g, '@')}?${query}`;
  }
  if (!lead.phone) return null;
  // `?&body=` is the form both iOS Messages and Android accept.
  const number = lead.phone.replace(/[^\d+]/g, '');
  return `sms:${number}?&body=${encodeURIComponent(body)}`;
}
