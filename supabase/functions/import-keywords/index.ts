import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    if (user.user_metadata?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { keywords, category = 'Real Estate' } = await req.json();

    if (!keywords || !Array.isArray(keywords)) {
      throw new Error('Keywords array is required');
    }

    // Parse keywords and prepare for insert
    const keywordsToInsert = keywords.map((keyword: string) => {
      const cleanKeyword = keyword.trim().toLowerCase();

      // Categorize keywords based on content
      let autoCategory = category;
      if (cleanKeyword.includes('luxury') || cleanKeyword.includes('high-end')) {
        autoCategory = 'Luxury Real Estate';
      } else if (cleanKeyword.includes('social media') || cleanKeyword.includes('instagram') || cleanKeyword.includes('facebook')) {
        autoCategory = 'Social Media';
      } else if (cleanKeyword.includes('bio link') || cleanKeyword.includes('link in bio')) {
        autoCategory = 'Link in Bio';
      } else if (cleanKeyword.includes('agent') || cleanKeyword.includes('realtor')) {
        autoCategory = 'Real Estate Agents';
      } else if (cleanKeyword.includes('marketing') || cleanKeyword.includes('branding')) {
        autoCategory = 'Marketing';
      }

      return {
        keyword: cleanKeyword,
        category: autoCategory,
        is_active: true,
        usage_count: 0,
      };
    });

    // Insert keywords (ignore duplicates)
    const { data, error: insertError } = await supabaseClient
      .from('keywords')
      .upsert(keywordsToInsert, {
        onConflict: 'keyword',
        ignoreDuplicates: true
      })
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    // Get count of existing keywords
    const { count, error: countError } = await supabaseClient
      .from('keywords')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully imported ${data?.length || 0} new keywords`,
        totalKeywords: count || 0,
        imported: data?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in import-keywords:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
