/**
 * How the Leads list labels a lead's address line. A buyer or contact lead
 * with a listing asked about that property; a seller or valuation lead gave
 * their own home.
 */
export function leadAddressLabel(lead: {
  lead_type: string;
  listing_id?: string | null;
}): 'Asked about' | 'Their property' | null {
  if (lead.listing_id) return 'Asked about';
  if (lead.lead_type === 'seller' || lead.lead_type === 'valuation') return 'Their property';
  return null;
}
