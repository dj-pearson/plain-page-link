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

    // Check if user has admin role in user_roles table
    const { data: userRoles, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRoles) {
      throw new Error('Admin access required');
    }

    const { keywords } = await req.json();

    if (!keywords || !Array.isArray(keywords)) {
      throw new Error('Keywords array is required');
    }

    // Parse keywords and prepare for insert
    const keywordsToInsert = keywords.map((kw: any) => {
      // Support both string format (legacy) and object format (CSV)
      if (typeof kw === 'string') {
        return {
          keyword: kw.trim().toLowerCase(),
          category: 'Real Estate',
          is_active: true,
          usage_count: 0,
        };
      }

      // Object format from CSV
      return {
        keyword: kw.keyword?.trim().toLowerCase() || '',
        category: kw.category || 'Real Estate',
        difficulty: kw.difficulty || 'medium',
        search_volume: kw.search_volume ? parseInt(kw.search_volume) : null,
        notes: kw.notes || null,
        is_active: kw.is_active !== undefined ? kw.is_active : true,
        usage_count: 0,
      };
    }).filter(k => k.keyword); // Remove empty keywords

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
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
