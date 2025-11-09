import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { model } = await req.json();
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Testing AI model: ${model || 'google/gemini-2.5-flash'}`);

    // Fetch model configuration from database
    const { data: modelConfig, error: dbError } = await supabase
      .from('ai_models')
      .select('*')
      .eq('model_id', model || 'google/gemini-2.5-flash')
      .single();

    if (dbError || !modelConfig) {
      console.error('Model not found in database:', dbError);
      throw new Error(`Model configuration not found for: ${model}`);
    }

    // Get the API key from secrets
    const apiKey = Deno.env.get(modelConfig.secret_name || 'LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error(`API key not configured: ${modelConfig.secret_name}`);
    }

    // Prepare headers based on auth type
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (modelConfig.auth_type === 'x-api-key') {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Prepare request body based on provider
    let requestBody: any;
    const endpoint = modelConfig.api_endpoint || 'https://ai.gateway.lovable.dev/v1/chat/completions';

    if (modelConfig.provider.toLowerCase() === 'anthropic') {
      // Anthropic format
      requestBody = {
        model: modelConfig.model_id,
        messages: [
          {
            role: "user",
            content: "Reply with exactly: AI model test successful"
          }
        ],
        max_tokens: 50,
      };
    } else {
      // OpenAI/Lovable AI format
      requestBody = {
        model: modelConfig.model_id,
        messages: [
          {
            role: "user",
            content: "Reply with exactly: AI model test successful"
          }
        ],
        max_tokens: 50,
      };
    }

    console.log(`Making request to: ${endpoint}`);

    // Make test request to the AI
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Rate limit exceeded. Please try again later." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Payment required. Please check your API credits." 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract response based on provider
    let testResult = '';
    if (modelConfig.provider.toLowerCase() === 'anthropic') {
      testResult = data.content?.[0]?.text || '';
    } else {
      testResult = data.choices?.[0]?.message?.content || '';
    }

    console.log("AI test response:", testResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: "AI model is working correctly",
        response: testResult,
        model: modelConfig.model_id,
        provider: modelConfig.provider
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error testing AI model:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
