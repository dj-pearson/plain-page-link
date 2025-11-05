import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keywordId, keyword, url, saveResults = true } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    let targetKeyword: any = null;

    // Get keyword details
    if (keywordId) {
      const { data } = await supabase
        .from('seo_keywords')
        .select('*')
        .eq('id', keywordId)
        .single();
      targetKeyword = data;
    } else if (keyword && url) {
      targetKeyword = { keyword, target_url: url };
    } else {
      throw new Error('Either keywordId or keyword+url is required');
    }

    console.log(`Checking position for keyword: ${targetKeyword.keyword}`);

    // Simulate SERP position check
    // In production, integrate with real SERP API (DataForSEO, SEMrush, etc.)
    const position = await checkSERPPosition(targetKeyword.keyword, targetKeyword.target_url);

    // Get previous position for trend analysis
    let previousPosition = null;
    let positionChange = null;
    let trend = 'stable';

    if (keywordId) {
      const { data: history } = await supabase
        .from('seo_keyword_history')
        .select('position')
        .eq('keyword_id', keywordId)
        .order('checked_at', { ascending: false })
        .limit(1)
        .single();

      if (history) {
        previousPosition = history.position;
        positionChange = previousPosition ? previousPosition - position : 0;

        if (positionChange > 0) trend = 'up';
        else if (positionChange < 0) trend = 'down';
        else trend = 'stable';
      }
    }

    // Calculate visibility score (positions 1-10 are most valuable)
    let visibilityScore = 0;
    if (position === 1) visibilityScore = 100;
    else if (position <= 3) visibilityScore = 85;
    else if (position <= 5) visibilityScore = 70;
    else if (position <= 10) visibilityScore = 50;
    else if (position <= 20) visibilityScore = 25;
    else if (position <= 50) visibilityScore = 10;
    else visibilityScore = 5;

    const analysis = {
      keyword: targetKeyword.keyword,
      url: targetKeyword.target_url,
      position,
      previousPosition,
      positionChange,
      trend,
      visibilityScore,
      isRanking: position > 0 && position <= 100,
      isTopTen: position > 0 && position <= 10,
      isFirstPage: position > 0 && position <= 10,
      checkedAt: new Date().toISOString(),
    };

    if (saveResults) {
      // Update keyword record
      if (keywordId) {
        await supabase
          .from('seo_keywords')
          .update({
            current_position: position,
            previous_position: previousPosition,
            position_change: positionChange,
            last_checked_at: new Date().toISOString(),
            visibility_score: visibilityScore,
          })
          .eq('id', keywordId);

        // Create history entry
        await supabase
          .from('seo_keyword_history')
          .insert({
            keyword_id: keywordId,
            keyword: targetKeyword.keyword,
            position,
            visibility_score: visibilityScore,
            search_volume: targetKeyword.search_volume || 0,
            checked_at: new Date().toISOString(),
          });
      }

      // Create alert if position dropped significantly
      if (positionChange && positionChange < -5) {
        await supabase
          .from('seo_alerts')
          .insert({
            user_id: targetKeyword.user_id,
            alert_type: 'keyword_ranking',
            severity: positionChange < -10 ? 'high' : 'medium',
            message: `Keyword "${targetKeyword.keyword}" dropped from position ${previousPosition} to ${position}`,
            related_url: targetKeyword.target_url,
            metadata: { keyword: targetKeyword.keyword, positionChange, position },
            status: 'active',
          });
      }
    }

    console.log(`Position check complete: "${targetKeyword.keyword}" at position ${position}`);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error checking keyword position:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkSERPPosition(keyword: string, targetUrl: string): Promise<number> {
  // This is a mock implementation
  // In production, integrate with:
  // - DataForSEO API
  // - SEMrush API
  // - Ahrefs API
  // - SerpAPI
  // - Custom SERP scraper (with proper rate limiting and proxies)

  console.log(`Simulating SERP check for "${keyword}" on ${targetUrl}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate mock position (1-100 or 0 if not found)
  const hash = Array.from(keyword).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const mockPosition = (hash % 50) + 1; // Position between 1-50

  // 20% chance of not ranking
  if (hash % 5 === 0) return 0;

  return mockPosition;
}
