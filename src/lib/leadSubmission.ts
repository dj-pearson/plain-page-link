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
  /** The property the lead asked about, when the form was opened from one. */
  listingId?: string;
  source?: string;
  referrer?: string;
}

export interface LeadSubmissionResponse {
  success: boolean;
  leadId?: string;
  error?: string;
}

/**
 * How one form answer maps onto `leads`.
 *
 * `transform` exists because the form's vocabulary and the column's type are
 * not always the same. `raw` names a key in form_data to keep the original
 * answer under, so narrowing a value for storage never loses what was asked.
 */
interface ColumnMapping {
  column: string;
  transform?: (value: unknown) => unknown;
  raw?: string;
}

/**
 * `preapproved` is a boolean column, but the buyer form asks a four-way
 * question: yes / in-process / not-yet / cash. The raw string used to be sent
 * straight through, so Postgres coerced 'yes' and raised 22P02 on the other
 * three — submit-lead rethrew and the buyer saw "Submission Failed". The leads
 * an agent most wants, the not-yet-approved ones, were exactly the ones lost
 * (US-096).
 *
 * A cash buyer needs no approval, so both 'yes' and 'cash' mean financing is
 * settled; anything else is false. The four-way answer itself is not thrown
 * away — it is kept in form_data.preApprovalStatus, where the agent can read
 * whether this is a cash offer or someone who needs a lender introduction.
 */
export const toPreapprovedBoolean = (value: unknown): boolean =>
  value === true || value === 'yes' || value === 'cash';

/** Form answers that have a real column on `leads`, and how they map to it. */
const DEDICATED_COLUMNS: Record<string, ColumnMapping> = {
  priceRange: { column: 'price_range' },
  timeline: { column: 'timeline' },
  address: { column: 'property_address' },
  preApproved: {
    column: 'preapproved',
    transform: toPreapprovedBoolean,
    raw: 'preApprovalStatus',
  },
  message: { column: 'message' },
};

/**
 * Split a form's answer bag into the columns `leads` actually has and the
 * remainder, which the edge function stores in leads.form_data.
 *
 * Exported for test: this is where a form's vocabulary meets the column types,
 * and it is where US-096 went wrong.
 */
export function splitFormData(data: Record<string, unknown>): {
  columns: Record<string, unknown>;
  formData: Record<string, unknown>;
} {
  const columns: Record<string, unknown> = {};
  const formData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    const mapping = DEDICATED_COLUMNS[key];
    if (mapping) {
      columns[mapping.column] = mapping.transform ? mapping.transform(value) : value;
      if (mapping.raw) formData[mapping.raw] = value;
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
        listing_id: leadData.listingId,
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
