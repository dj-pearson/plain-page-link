import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';

/**
 * Sync Google Search Console Data
 * Fetches keyword and page performance data from GSC and stores in database
 */

interface GSCSyncRequest {
  propertyUrl?: string;
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  dimensions?: string[]; // ['query', 'page', 'country', 'device']
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      propertyUrl,
      startDate = getDateString(-30), // Default: last 30 days
      endDate = getDateString(0),      // Default: today
      dimensions = ['query', 'page'],
    }: GSCSyncRequest = await req.json();

    // Initialize Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from JWT
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing GSC data for user: ${userId}, period: ${startDate} to ${endDate}`);

    // Get OAuth credentials
    const { data: credentials, error: credError } = await supabase
      .from('gsc_oauth_credentials')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({
          error: 'Google Search Console not connected',
          needsAuth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token expiration
    if (new Date(credentials.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: 'Access token expired. Please re-authenticate.',
          needsAuth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get property URL if not provided
    let siteUrl = propertyUrl;
    if (!siteUrl) {
      const { data: property } = await supabase
        .from('gsc_properties')
        .select('property_url')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .limit(1)
        .maybeSingle();

      if (!property) {
        return new Response(
          JSON.stringify({ error: 'No verified GSC property found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      siteUrl = property.property_url;
    }

    console.log(`Fetching data for property: ${siteUrl}`);

    // Fetch keyword performance data
    const keywordResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 1000,
          dataState: 'final',
        }),
      }
    );

    if (!keywordResponse.ok) {
      const errorText = await keywordResponse.text();
      console.error('GSC API error:', errorText);
      throw new Error(`GSC API error: ${keywordResponse.status}`);
    }

    const keywordData = await keywordResponse.json();
    const keywords = keywordData.rows || [];

    console.log(`Fetched ${keywords.length} keywords`);

    // Save keyword performance data
    let keywordsSaved = 0;
    for (const row of keywords) {
      const { error: insertError } = await supabase
        .from('gsc_keyword_performance')
        .insert({
          user_id: userId,
          property_url: siteUrl,
          keyword: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          date: endDate,
          platform: 'google',
        });

      if (!insertError) {
        keywordsSaved++;
      } else {
        console.error('Error saving keyword:', insertError);
      }
    }

    // Fetch page performance data
    const pageResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['page'],
          rowLimit: 1000,
          dataState: 'final',
        }),
      }
    );

    let pagesSaved = 0;
    if (pageResponse.ok) {
      const pageData = await pageResponse.json();
      const pages = pageData.rows || [];

      console.log(`Fetched ${pages.length} pages`);

      // Save page performance data
      for (const row of pages) {
        const { error: insertError } = await supabase
          .from('gsc_page_performance')
          .insert({
            user_id: userId,
            property_url: siteUrl,
            page_url: row.keys[0],
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
            date: endDate,
            platform: 'google',
          });

        if (!insertError) {
          pagesSaved++;
        }
      }
    }

    // Update last sync time
    await supabase
      .from('gsc_properties')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('property_url', siteUrl);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'GSC data synced successfully',
        stats: {
          propertyUrl: siteUrl,
          period: { startDate, endDate },
          keywordsSynced: keywordsSaved,
          pagesSynced: pagesSaved,
          totalKeywords: keywords.length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error syncing GSC data:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to get date string (YYYY-MM-DD)
function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}
