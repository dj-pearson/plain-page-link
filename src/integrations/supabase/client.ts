// Supabase client configuration for self-hosted instance
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Self-hosted Supabase configuration
// API subdomain for REST API, Auth, Storage (Kong API Gateway)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Functions subdomain for Edge Functions
const EDGE_FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL;

// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local'
  );
}

// Warn if edge functions URL is not configured
if (!EDGE_FUNCTIONS_URL) {
  console.warn(
    'VITE_FUNCTIONS_URL is not set. Edge functions will use default Supabase URL. ' +
    'For self-hosted Supabase, set this to your functions subdomain (e.g., https://functions.agentbio.net)'
  );
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'agentbio-web',
    },
  },
});

// Export configuration for use in other modules
export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_PUBLISHABLE_KEY,
  functionsUrl: EDGE_FUNCTIONS_URL || `${SUPABASE_URL}/functions/v1`,
};