import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywords, userId, saveResults = true } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Tracking SERP positions for ${keywords?.length || 'all'} keywords`);

    let keywordsToTrack: any[] = [];

    if (keywords && keywords.length > 0) {
      // Track specific keywords
      const { data } = await supabase
        .from('seo_keywords')
        .select('*')
        .in('id', keywords);
      keywordsToTrack = data || [];
    } else if (userId) {
      // Track all keywords for user
      const { data } = await supabase
        .from('seo_keywords')
        .select('*')
        .eq('user_id', userId);
      keywordsToTrack = data || [];
    } else {
      throw new Error('Either keywords array or userId is required');
    }

    if (keywordsToTrack.length === 0) {
      throw new Error('No keywords found to track');
    }

    const results = [];
    const errors = [];

    for (const kw of keywordsToTrack) {
      try {
        // Call check-keyword-positions for each keyword
        const response = await fetch(`${SUPABASE_URL}/functions/v1/check-keyword-positions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            keywordId: kw.id,
            saveResults: true,
          }),
        });

        const data = await response.json();

        if (data.success) {
          results.push({
            keywordId: kw.id,
            keyword: kw.keyword,
            position: data.analysis.position,
            trend: data.analysis.trend,
            visibilityScore: data.analysis.visibilityScore,
          });
        } else {
          errors.push({
            keywordId: kw.id,
            keyword: kw.keyword,
            error: data.error || 'Unknown error',
          });
        }

        // Rate limiting: wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Error tracking keyword ${kw.keyword}:`, error);
        errors.push({
          keywordId: kw.id,
          keyword: kw.keyword,
          error: error.message,
        });
      }
    }

    // Calculate summary statistics
    const totalTracked = results.length;
    const rankingCount = results.filter(r => r.position > 0 && r.position <= 100).length;
    const topTenCount = results.filter(r => r.position > 0 && r.position <= 10).length;
    const improvingCount = results.filter(r => r.trend === 'up').length;
    const decliningCount = results.filter(r => r.trend === 'down').length;
    const avgPosition = results.filter(r => r.position > 0).reduce((sum, r) => sum + r.position, 0) / Math.max(1, results.filter(r => r.position > 0).length);
    const avgVisibility = results.reduce((sum, r) => sum + r.visibilityScore, 0) / Math.max(1, results.length);

    const summary = {
      totalTracked,
      rankingCount,
      topTenCount,
      improvingCount,
      decliningCount,
      stableCount: totalTracked - improvingCount - decliningCount,
      avgPosition: Math.round(avgPosition),
      avgVisibility: Math.round(avgVisibility),
      errorCount: errors.length,
    };

    // Save tracking summary
    if (saveResults && userId) {
      await supabase
        .from('seo_keyword_tracking_summary')
        .insert({
          user_id: userId,
          tracked_at: new Date().toISOString(),
          total_keywords: totalTracked,
          ranking_keywords: rankingCount,
          top_ten_keywords: topTenCount,
          improving_keywords: improvingCount,
          declining_keywords: decliningCount,
          avg_position: Math.round(avgPosition),
          avg_visibility_score: Math.round(avgVisibility),
          results: results,
          errors: errors,
        });
    }

    console.log(`SERP tracking complete: ${totalTracked} keywords tracked, ${topTenCount} in top 10`);

    return new Response(
      JSON.stringify({ success: true, summary, results, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error tracking SERP positions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
