/**
 * Lead Submission Utilities
 *
 * US-069: this used to insert into `leads` directly, naming four columns that
 * do not exist (agent_id, type, data, referrer) and omitting both NOT NULL ones
 * (user_id, lead_type). Every submission from BuyerInquiryForm,
 * SellerInquiryForm and HomeValuationForm — the three forms reachable from the
 * public profile — was rejected by PostgREST, retried three times, and shown to
 * the visitor as a generic failure. tsc reported it the whole time
 * (TS2769 at the insert) but `npm run build` does not typecheck.
 *
 * The fix is not to rename the columns: a direct insert from the browser also
 * bypasses the rate limiting, validation and sanitisation in the `submit-lead`
 * edge function, and the `leads` RLS policy "Anyone can submit leads" is
 * WITH CHECK (true), so it would accept anything. Everything now goes through
 * that function, which is what ContactBlock.tsx already did.
 */

import { callEdgeFunction } from '@/lib/edgeFunctions';
import { logger } from '@/lib/logger';

/** Lead types accepted by the edge function's validateLeadData(). */
export type LeadType = 'buyer' | 'seller' | 'valuation' | 'contact';

export interface LeadSubmissionData {
  /** The agent receiving the lead. Maps to leads.user_id. */
  agentId: string;
  leadType: LeadType;
  name: string;
  email: string;
  phone?: string;
  /**
   * Answers the form collected. Fields with a dedicated column are lifted out
   * below; the rest are persisted to leads.form_data.
   */
  data: Record<string, unknown>;
  source?: string;
  referrer?: string;
}

export interface LeadSubmissionResponse {
  success: boolean;
  leadId?: string;
  error?: string;
}

/** Form answers that have a real column on `leads`, and the column they map to. */
const DEDICATED_COLUMNS: Record<string, string> = {
  priceRange: 'price_range',
  timeline: 'timeline',
  address: 'property_address',
  preApproved: 'preapproved',
  message: 'message',
};

/**
 * Split a form's answer bag into the columns `leads` actually has and the
 * remainder, which the edge function stores in leads.form_data.
 */
function splitFormData(data: Record<string, unknown>): {
  columns: Record<string, unknown>;
  formData: Record<string, unknown>;
} {
  const columns: Record<string, unknown> = {};
  const formData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    const column = DEDICATED_COLUMNS[key];
    if (column) {
      columns[column] = value;
    } else {
      formData[key] = value;
    }
  }

  return { columns, formData };
}

/**
 * Submit a lead through the submit-lead edge function.
 *
 * No retry loop: the edge function is rate limited (5/min per IP), so retrying
 * a rejection just burns the visitor's budget. The previous implementation
 * retried three times on every failure, including validation failures it could
 * never recover from.
 */
export async function submitLead(leadData: LeadSubmissionData): Promise<LeadSubmissionResponse> {
  const { columns, formData } = splitFormData(leadData.data);

  try {
    const result = await callEdgeFunction<{ success: boolean; leadId?: string }>('submit-lead', {
      body: {
        user_id: leadData.agentId,
        lead_type: leadData.leadType,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: leadData.source ?? 'website',
        referrer_url:
          leadData.referrer ?? (typeof document !== 'undefined' ? document.referrer : undefined),
        ...columns,
        form_data: Object.keys(formData).length > 0 ? formData : undefined,
      },
      auth: false, // public capture — visitors are not signed in
    });

    return { success: true, leadId: result?.leadId };
  } catch (error) {
    logger.error('Lead submission failed', error as Error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to submit lead. Please try again later.',
    };
  }
}

/**
 * Track form submission analytics
 */
export function trackFormSubmission(formType: string, success: boolean) {
  try {
    // Track with visitor analytics if available
    if (
      typeof window !== 'undefined' &&
      (window as { analytics?: { track: (e: string, p: unknown) => void } }).analytics
    ) {
      (
        window as unknown as { analytics: { track: (e: string, p: unknown) => void } }
      ).analytics.track('form_submit', {
        formType,
        success,
        timestamp: new Date().toISOString(),
      });
    }

    // Also track in localStorage for local analytics
    const storageKey = `analytics_form_submissions`;
    const existing = localStorage.getItem(storageKey);
    const submissions = existing ? JSON.parse(existing) : [];
    submissions.push({
      formType,
      success,
      timestamp: Date.now(),
    });
    localStorage.setItem(storageKey, JSON.stringify(submissions));
  } catch (error) {
    logger.error('Failed to track form submission:', error as Error);
    // Don't fail the submission if analytics fails
  }
}
