// Edge Functions Server for Self-Hosted Supabase
// This server hosts all your Supabase Edge Functions

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Map of available functions
const FUNCTIONS_MAP: { [key: string]: string } = {
  "generate-listing-description": "./functions/generate-listing-description/index.ts",
  "send-listing-generator-email": "./functions/send-listing-generator-email/index.ts",
  "send-bio-analyzer-email": "./functions/send-bio-analyzer-email/index.ts",
  "send-scheduled-listing-emails": "./functions/send-scheduled-listing-emails/index.ts",
  "send-scheduled-bio-emails": "./functions/send-scheduled-bio-emails/index.ts",
  "submit-lead": "./functions/submit-lead/index.ts",
  "submit-contact": "./functions/submit-contact/index.ts",
  "stripe-webhook": "./functions/stripe-webhook/index.ts",
  "create-checkout-session": "./functions/create-checkout-session/index.ts",
  "check-username": "./functions/check-username/index.ts",
  "seo-audit": "./functions/seo-audit/index.ts",
  "generate-article": "./functions/generate-article/index.ts",
  "generate-social-post": "./functions/generate-social-post/index.ts",
  // Add more functions as needed
};

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (path === "/" || path === "/health") {
    return new Response(JSON.stringify({ 
      status: "ok", 
      functions: Object.keys(FUNCTIONS_MAP).length,
      available: Object.keys(FUNCTIONS_MAP)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Extract function name from path (e.g., /functions/generate-article or /generate-article)
  const functionName = path.replace(/^\/functions\//, "").replace(/^\//, "");

  if (!FUNCTIONS_MAP[functionName]) {
    return new Response(JSON.stringify({ 
      error: "Function not found",
      available: Object.keys(FUNCTIONS_MAP)
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Dynamically import the function
    const functionPath = FUNCTIONS_MAP[functionName];
    const module = await import(functionPath);
    
    // Set environment variables for the function
    Deno.env.set("SUPABASE_URL", SUPABASE_URL);
    Deno.env.set("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY);
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);

    // Call the function's default export (handler)
    const response = await module.default(req);
    
    // Add CORS headers to response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error(`Error executing function ${functionName}:`, error);
    return new Response(JSON.stringify({ 
      error: "Function execution failed",
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

console.log("🚀 Edge Functions Server starting on port 8000...");
console.log(`📦 Loaded ${Object.keys(FUNCTIONS_MAP).length} functions`);
console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);

serve(handler, { port: 8000 });
