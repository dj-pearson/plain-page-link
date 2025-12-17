/**
 * Edge Functions Client
 * Centralized utility for calling self-hosted edge functions
 */

const EDGE_FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL || 'https://functions.agentbio.net';

// Validate edge functions URL
if (!EDGE_FUNCTIONS_URL) {
  console.warn('VITE_FUNCTIONS_URL is not set. Edge functions may not work correctly.');
}

interface EdgeFunctionOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean; // Whether to include Supabase auth token
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
  const {
    method = 'POST',
    body,
    headers = {},
    auth = false,
  } = options;

  const url = `${EDGE_FUNCTIONS_URL}/${functionName}`;

  // Build request headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add authorization if requested
  if (auth) {
    const token = localStorage.getItem('sb-access-token') || '';
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
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
    let errorMessage = `Edge function '${functionName}' failed: ${response.status} ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      // If not JSON, use text as is
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  // Parse and return response
  const data = await response.json();
  return data as T;
}

/**
 * Legacy compatibility: Mimics supabase.functions.invoke() API
 * Use this to quickly migrate existing code
 */
export const edgeFunctions = {
  invoke: async <T = any>(functionName: string, options?: { body?: any; headers?: Record<string, string> }) => {
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

  // Lead submission
  submitLead: (lead: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    source?: string;
  }) =>
    callEdgeFunction<{ success: boolean; leadId?: string }>('submit-lead', {
      body: lead,
      auth: false,
    }),

  // Contact form submission
  submitContact: (contact: {
    name: string;
    email: string;
    message: string;
    subject?: string;
  }) =>
    callEdgeFunction<{ success: boolean }>('submit-contact', {
      body: contact,
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
  sendListingGeneratorEmail: (data: {
    email: string;
    description: string;
    listingData: any;
  }) =>
    callEdgeFunction<{ success: boolean }>('send-listing-generator-email', {
      body: data,
      auth: false,
    }),

  // Send bio analyzer email
  sendBioAnalyzerEmail: (data: {
    email: string;
    analysis: any;
  }) =>
    callEdgeFunction<{ success: boolean }>('send-bio-analyzer-email', {
      body: data,
      auth: false,
    }),

  // Create Stripe checkout session
  createCheckoutSession: (data: {
    priceId: string;
    userId: string;
    successUrl: string;
    cancelUrl: string;
  }) =>
    callEdgeFunction<{ sessionId: string; url: string }>('create-checkout-session', {
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
  generateArticle: (data: {
    topic: string;
    keywords?: string[];
    tone?: string;
  }) =>
    callEdgeFunction<{ title: string; content: string; meta_description: string }>('generate-article', {
      body: data,
      auth: true,
    }),

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
};

export default EdgeFunctions;

