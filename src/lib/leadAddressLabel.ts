// A light copy of leadAddressLabel from leadFormSchema.ts, so the Leads list
// does not load the whole schema for one label (US-476). leadFormSchema.ts must
// stay byte-identical to supabase/functions/_shared/leadFormSchema.ts (Deno
// cannot resolve an extensionless re-export), so the function is duplicated;
// leadAddressLabel.test.ts holds the two copies to the same behaviour.
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
