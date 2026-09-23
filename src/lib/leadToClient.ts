/**
 * How a lead's details become a sphere contact's. Pure, so the mapping is
 * tested apart from the button that uses it.
 */
import type { ContactRelationship } from '@/hooks/useContacts';

/** What the lead's form says about where they are, as a sphere relationship. */
export function relationshipForLead(leadType: string): ContactRelationship {
  switch (leadType) {
    case 'buyer':
    case 'open_house':
      return 'active_buyer';
    case 'seller':
    case 'valuation':
      return 'active_seller';
    default:
      return 'prospect';
  }
}

/** "Mary Ann Smith" → first "Mary Ann", last "Smith". One word is a first name. */
export function splitName(full: string): { first_name: string; last_name: string | null } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first_name: parts[0] ?? full.trim(), last_name: null };
  return { first_name: parts.slice(0, -1).join(' '), last_name: parts[parts.length - 1] };
}
