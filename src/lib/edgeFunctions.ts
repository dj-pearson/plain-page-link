/**
 * Edge Functions Client
 * Centralized utility for calling self-hosted edge functions
 *
 * For self-hosted Supabase:
 * - API subdomain (api.agentbio.net) - REST API, Auth, Storage via Kong
 * - Functions subdomain (functions.agentbio.net) - Edge Functions
 */

import { supabase, supabaseConfig } from '@/integrations/supabase/client';

// Use the centralized config for edge functions URL
const EDGE_FUNCTIONS_URL = supabaseConfig.functionsUrl;

interface EdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // Whether to include Supabase auth token
}

/**
 * A failure returned by an edge function, carrying what the function actually
 * said rather than only a string.
 *
 * US-197: every edge function that uses `_shared/response.ts` answers a failure
 * with `{ success: false, error: { code, message, details } }` — `error` is an
 * object. This client read `errorJson.error || errorJson.message`, assigned the
 * object to a string, and threw `new Error(object)`, whose `.message` is the
 * literal "[object Object]". That string is what the four public capture forms
 * put in their failure toast, so a rate-limited or invalid lead submission told
 * the visitor "[object Object]" instead of "Too many requests. Please try again
 * later." The code, the HTTP status and the Retry-After were discarded with it,
 * so no caller could distinguish "slow down" from "that email is not valid".
 */
export class EdgeFunctionError extends Error {
  readonly functionName: string;
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  /** Seconds to wait, from a 429's Retry-After header or error.details. */
  readonly retryAfterSeconds?: number;

  constructor(
    message: string,
    init: {
      functionName: string;
      status: number;
      code?: string;
      details?: unknown;
      retryAfterSeconds?: number;
    }
  ) {
    super(message);
    this.name = 'EdgeFunctionError';
    this.functionName = init.functionName;
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.retryAfterSeconds = init.retryAfterSeconds;
  }
}

/**
 * Field-level validation detail, flattened into something a visitor can act on.
 *
 * `validationError()` sends the message "Validation failed" and puts the useful
 * part in `details` — either `{ email: 'Invalid email address' }` or
 * `['Invalid email address']`. Showing only "Validation failed" tells the
 * visitor nothing about which of eight fields to correct.
 */
function describeValidationDetails(details: unknown): string | null {
  const parts: string[] = [];

  if (Array.isArray(details)) {
    for (const entry of details) {
      if (typeof entry === 'string' && entry.trim()) parts.push(entry.trim());
    }
  } else if (details && typeof details === 'object') {
    for (const [field, value] of Object.entries(details as Record<string, unknown>)) {
      if (typeof value === 'string' && value.trim()) parts.push(`${field}: ${value.trim()}`);
    }
  }

  if (parts.length === 0) return null;
  // Bounded: a validation bag with 40 entries is not a toast.
  return parts.slice(0, 5).join('; ');
}

/**
 * Turn an edge function's failure response into an EdgeFunctionError.
 *
 * Handles all three shapes in the codebase: the standardized
 * `{ error: { code, message, details } }`, the older `{ error: 'message' }` and
 * `{ message: '...' }`, and a non-JSON body (a proxy's HTML 502, say), which
 * must not be pasted into a toast.
 */
function toEdgeFunctionError(
  functionName: string,
  response: Response,
  errorText: string
): EdgeFunctionError {
  const fallback = `Edge function '${functionName}' failed: ${response.status} ${response.statusText}`;

  const retryAfterHeader = Number(response.headers.get('Retry-After'));
  let retryAfterSeconds =
    Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(errorText);
  } catch {
    // Not JSON. Some functions still answer with a bare string, which is worth
    // showing; a proxy's HTML error page is not, and pasting one into a toast
    // is how a 502 becomes a wall of markup in front of the visitor.
    const plain = errorText.trim();
    const usable = plain && plain.length <= 200 && !plain.includes('<') ? plain : fallback;
    return new EdgeFunctionError(usable, {
      functionName,
      status: response.status,
      retryAfterSeconds,
    });
  }

  if (!parsed || typeof parsed !== 'object') {
    return new EdgeFunctionError(fallback, {
      functionName,
      status: response.status,
      retryAfterSeconds,
    });
  }

  const body = parsed as { error?: unknown; message?: unknown };
  let message: string | undefined;
  let code: string | undefined;
  let details: unknown;

  if (body.error && typeof body.error === 'object' && !Array.isArray(body.error)) {
    const err = body.error as { code?: unknown; message?: unknown; details?: unknown };
    if (typeof err.message === 'string' && err.message.trim()) message = err.message.trim();
    if (typeof err.code === 'string') code = err.code;
    details = err.details;
  } else if (typeof body.error === 'string' && body.error.trim()) {
    message = body.error.trim();
  }

  if (!message && typeof body.message === 'string' && body.message.trim()) {
    message = body.message.trim();
  }

  // rateLimitResponse puts the wait in details as well as the header; prefer
  // whichever is present so a proxy that strips Retry-After doesn't lose it.
  if (retryAfterSeconds === undefined && details && typeof details === 'object') {
    const retryAfter = (details as { retryAfter?: unknown }).retryAfter;
    if (typeof retryAfter === 'number' && Number.isFinite(retryAfter) && retryAfter > 0) {
      retryAfterSeconds = retryAfter;
    }
  }

  if (code === 'REQUEST_VALIDATION_FAILED') {
    const described = describeValidationDetails(details);
    if (described) message = message ? `${message}: ${described}` : described;
  }

  return new EdgeFunctionError(message || fallback, {
    functionName,
    status: response.status,
    code,
    details,
    retryAfterSeconds,
  });
}

/**
 * Call a self-hosted edge function
 * @param functionName - Name of the edge function (e.g., 'check-username')
 * @param options - Request options
 * @returns Response data
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  options: EdgeFunctionOptions = {}
): Promise<T> {
  const { method = 'POST', body, headers = {}, auth = false } = options;

  const url = `${EDGE_FUNCTIONS_URL}/${functionName}`;

  // Build request headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization if requested
  if (auth) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      requestHeaders['Authorization'] = `Bearer ${session.access_token}`;
    }
  }

  // Make the request
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    const errorText = await response.text();
    throw toEdgeFunctionError(functionName, response, errorText);
  }

  // Parse and return response
  const responseData = await response.json();

  // Unwrap standardized response format { success, data } if present
  if (
    responseData &&
    typeof responseData === 'object' &&
    'success' in responseData &&
    'data' in responseData
  ) {
    return responseData.data as T;
  }

  return responseData as T;
}

/**
 * Legacy compatibility: Mimics supabase.functions.invoke() API
 * Use this to quickly migrate existing code
 */
export const edgeFunctions = {
  invoke: async <T = any>(
    functionName: string,
    options?: { body?: any; headers?: Record<string, string> }
  ) => {
    try {
      const data = await callEdgeFunction<T>(functionName, {
        method: 'POST',
        body: options?.body,
        headers: options?.headers,
        auth: true, // Assume auth by default for compatibility
      });

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },
};

/**
 * Specific edge function helpers for type safety
 */
export const EdgeFunctions = {
  // Username validation
  checkUsername: (username: string) =>
    callEdgeFunction<{ available: boolean; message?: string }>('check-username', {
      body: { username },
      auth: false,
    }),

  // Generate listing description
  generateListingDescription: (listing: {
    address: string;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    price: number;
    features?: string[];
    description?: string;
  }) =>
    callEdgeFunction<{ description: string; generated: boolean }>('generate-listing-description', {
      body: listing,
      auth: true,
    }),

  // Send listing generator email
  sendListingGeneratorEmail: (data: { email: string; description: string; listingData: any }) =>
    callEdgeFunction<{ success: boolean }>('send-listing-generator-email', {
      body: data,
      auth: false,
    }),

  // Send bio analyzer email
  sendBioAnalyzerEmail: (data: { email: string; analysis: any }) =>
    callEdgeFunction<{ success: boolean }>('send-bio-analyzer-email', {
      body: data,
      auth: false,
    }),

  // Create Stripe checkout session (subscription or one-time)
  createCheckoutSession: (data: {
    priceId: string;
    successUrl: string;
    cancelUrl: string;
    mode?: 'subscription' | 'payment';
    productType?: string;
    quantity?: number;
  }) =>
    callEdgeFunction<{ sessionId: string; url: string }>('create-checkout-session', {
      body: data,
      auth: true,
    }),

  // Create Stripe customer portal session
  createPortalSession: (data: { returnUrl: string }) =>
    callEdgeFunction<{ url: string }>('create-portal-session', {
      body: data,
      auth: true,
    }),

  // Create Stripe customer
  createStripeCustomer: () =>
    callEdgeFunction<{ id: string; email: string; exists: boolean }>('create-stripe-customer', {
      auth: true,
    }),

  // Report usage to Stripe (for metered billing)
  reportStripeUsage: (data: {
    subscription_item_id: string;
    quantity: number;
    timestamp?: number;
    action?: 'increment' | 'set';
  }) =>
    callEdgeFunction<{ id: string; quantity: number; timestamp: number }>('report-stripe-usage', {
      body: data,
      auth: true,
    }),

  // SEO Audit
  seoAudit: (url: string) =>
    callEdgeFunction<{ score: number; issues: any[]; recommendations: any[] }>('seo-audit', {
      body: { url },
      auth: true,
    }),

  // Generate article
  generateArticle: (data: { topic: string; keywords?: string[]; tone?: string }) =>
    callEdgeFunction<{ title: string; content: string; meta_description: string }>(
      'generate-article',
      {
        body: data,
        auth: true,
      }
    ),

  // Generate social post
  generateSocialPost: (data: {
    topic: string;
    platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram';
    tone?: string;
  }) =>
    callEdgeFunction<{ content: string; hashtags: string[] }>('generate-social-post', {
      body: data,
      auth: true,
    }),

  // Google Indexing API - submit URLs for indexing/removal
  submitGoogleIndexing: (data: { urls: string[]; action?: 'URL_UPDATED' | 'URL_DELETED' }) =>
    callEdgeFunction<{
      success: boolean;
      total: number;
      succeeded: number;
      failed: number;
      action: string;
      results: Array<{ url: string; success: boolean; error?: string }>;
    }>('google-indexing', {
      body: data,
      auth: true,
    }),
};

export default EdgeFunctions;
