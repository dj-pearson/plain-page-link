export type LeadFormType =
  | 'buyer_inquiry'
  | 'seller_inquiry'
  | 'home_valuation'
  | 'general_contact'
  | 'showing_request';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'nurturing'
  | 'converted'
  | 'closed'
  | 'spam';
export type LeadPriority = 'low' | 'medium' | 'high';
export type ContactMethod = 'email' | 'phone' | 'sms' | 'video';

import type { Database } from '@/integrations/supabase/types';

/** A row from `leads`, exactly as stored — contact details as ciphertext. */
export type LeadRow = Database['public']['Tables']['leads']['Row'];

/**
 * A lead as the app consumes it: the row, with the contact details decrypted.
 *
 * US-086 dropped the plaintext `email` and `phone` columns, so the row itself
 * carries only `encrypted_email` / `encrypted_phone`. Every reader wants the
 * readable values, and every reader gets them from a decrypting boundary
 * (useLeads.decryptLeadRows, useAnalytics.decryptRecentLeads) rather than from
 * the row — so the encrypted fields are swapped out here for the plaintext
 * ones. Nothing downstream can read ciphertext by accident, and nothing can
 * write plaintext to a column that no longer exists.
 */
export type Lead = Omit<LeadRow, 'encrypted_email' | 'encrypted_phone'> & {
  email: string | null;
  phone: string | null;
};

// Legacy Lead type for compatibility
export interface LegacyLead {
  id: number;
  profile_id: number;
  listing_id: number | null;

  form_type: LeadFormType;

  // Contact Info
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  preferred_contact_method: ContactMethod;

  // Lead Details
  lead_data: Record<string, any>;

  // Management
  status: LeadStatus;
  priority: LeadPriority;
  notes: string | null;

  // Source Tracking
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;

  // Follow-up
  contacted_at: string | null;
  next_follow_up: string | null;

  created_at: string;
  updated_at: string;
}

export interface BuyerInquiryData {
  price_range_min?: number;
  price_range_max?: number;
  bedrooms_min?: number;
  timeline?: string;
  preapproval_status?: string;
  message?: string;
}

export interface SellerInquiryData {
  property_address: string;
  desired_timeline?: string;
  estimated_value?: number;
  reason_for_selling?: string;
  message?: string;
}

export interface HomeValuationData {
  property_address: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  best_time_to_discuss?: string;
}

export interface LeadSubmitData {
  listing_id?: number;
  form_type: LeadFormType;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  preferred_contact_method?: ContactMethod;
  lead_data: BuyerInquiryData | SellerInquiryData | HomeValuationData | Record<string, any>;
  source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface LeadUpdateData {
  status?: LeadStatus;
  priority?: LeadPriority;
  notes?: string;
  contacted_at?: string;
  next_follow_up?: string;
}
