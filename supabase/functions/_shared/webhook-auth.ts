/**
 * Webhook & API Key Authentication
 * Supports external services like Make.com, Zapier, n8n, etc.
 * 
 * Security: Validates API keys for server-to-server communication
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * Validate API key from request headers
 * Checks both x-api-key and apikey headers
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User object associated with API key, or throws error
 */
export async function validateApiKey(
  req: Request,
  supabase: SupabaseClient
): Promise<{ user_id: string; key_name: string } | null> {
  // Check for API key in headers (x-api-key or apikey)
  const apiKey = req.headers.get('x-api-key') || req.headers.get('apikey');
  
  if (!apiKey) {
    return null; // No API key provided
  }

  try {
    // Query api_keys table for valid key
    const { data: keyData, error } = await supabase
      .from('api_keys')
      .select('user_id, name, is_active, expires_at, last_used_at')
      .eq('key_hash', apiKey) // In production, hash the key
      .single();

    if (error || !keyData) {
      throw new Error('Invalid API key');
    }

    // Check if key is active
    if (!keyData.is_active) {
      throw new Error('API key is inactive');
    }

    // Check if key has expired
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
      throw new Error('API key has expired');
    }

    // Update last_used_at timestamp
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', apiKey);

    return {
      user_id: keyData.user_id,
      key_name: keyData.name,
    };
  } catch (error) {
    console.error('API key validation failed:', error);
    throw new Error('Unauthorized: Invalid API key');
  }
}

/**
 * Flexible authentication - supports both JWT and API key
 * Use this for functions that can be called from web app or webhooks
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User ID or null if no auth provided
 */
export async function flexibleAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<string | null> {
  // Try API key first (for webhooks)
  try {
    const apiKeyResult = await validateApiKey(req, supabase);
    if (apiKeyResult) {
      console.log(`[webhook-auth] Authenticated via API key: ${apiKeyResult.key_name}`);
      return apiKeyResult.user_id;
    }
  } catch (error) {
    // API key validation failed, will try JWT next
  }

  // Try JWT token (for web app)
  const authHeader = req.headers.get('Authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (user && !error) {
        console.log('[webhook-auth] Authenticated via JWT');
        return user.id;
      }
    } catch (error) {
      // JWT validation failed
    }
  }

  // No valid authentication found
  return null;
}

/**
 * Require authentication (JWT or API key)
 * Throws error if neither is valid
 * @param req - Request object
 * @param supabase - Supabase client
 * @returns User ID
 */
export async function requireFlexibleAuth(
  req: Request,
  supabase: SupabaseClient
): Promise<string> {
  const userId = await flexibleAuth(req, supabase);
  
  if (!userId) {
    throw new Error('Unauthorized: Valid JWT token or API key required');
  }

  return userId;
}
