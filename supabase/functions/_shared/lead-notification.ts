/**
 * What notify-lead puts in the agent's new-lead email beyond name and contact
 * details (US-409): the listing the visitor asked about, a seller's or
 * valuation's own address, every answer the form collected, and a link that
 * opens this lead rather than the list.
 *
 * Pure, so it is testable without Deno; notify-lead does the reads.
 */
import { describeLeadAnswers, type LeadAnswer, type LeadAnswerSource } from './leadFormSchema.ts';

export interface NotifiableLead {
  id: string;
  lead_type?: string | null;
  listing_id?: string | null;
  property_address?: string | null;
  price_range?: string | null;
  timeline?: string | null;
  preapproved?: boolean | null;
  form_data?: LeadAnswerSource['form_data'];
}

export interface NotifiableListing {
  address?: string | null;
  city?: string | null;
}

export interface LeadNotificationDetails {
  listingAddress?: string;
  propertyAddress?: string;
  answers: LeadAnswer[];
  dashboardUrl: string;
}

const clean = (value: string | null | undefined): string | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  return trimmed ? trimmed : undefined;
};

export function buildLeadNotificationDetails(
  lead: NotifiableLead,
  listing: NotifiableListing | null,
  siteUrl: string
): LeadNotificationDetails {
  const address = clean(listing?.address);
  // A listing deleted since (or unreadable) falls back to the address the form
  // sent with it, as LeadListingCard does on the lead detail.
  const listingAddress = address
    ? [address, clean(listing?.city)].filter(Boolean).join(', ')
    : lead.listing_id
      ? clean(lead.property_address)
      : undefined;

  // The modal shows property_address as "Their property" only when the lead is
  // not about a listing (a buyer's fallback copy of the listing address is not
  // their home). Same rule here.
  const propertyAddress = lead.listing_id ? undefined : clean(lead.property_address);

  const answers = describeLeadAnswers({
    lead_type: lead.lead_type ?? 'contact',
    price_range: lead.price_range ?? null,
    timeline: lead.timeline ?? null,
    preapproved: lead.preapproved ?? null,
    form_data: lead.form_data ?? null,
  });

  return {
    listingAddress,
    propertyAddress,
    answers,
    dashboardUrl: `${siteUrl}/dashboard/leads?lead=${encodeURIComponent(lead.id)}`,
  };
}
