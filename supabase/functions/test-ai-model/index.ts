import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders } from '../_shared/cors.ts';
import { successResponse, errorResponse, rateLimitResponse, handleUnexpectedError } from '../_shared/response.ts';

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
        return rateLimitResponse(60, req, 'Rate limit exceeded. Please try again later.');
      }

      if (response.status === 402) {
        return errorResponse('Payment required. Please check your API credits.', 'ARTICLE_GENERATE_QUOTA', req, 402);
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

    return successResponse({
      message: "AI model is working correctly",
      response: testResult,
      model: modelConfig.model_id,
      provider: modelConfig.provider,
    }, req);

  } catch (error) {
    return handleUnexpectedError(error, req);
  }
});
