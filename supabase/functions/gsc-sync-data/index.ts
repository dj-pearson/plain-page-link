import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';
import { requireAuth } from '../_shared/auth.ts';

/**
 * Sync Google Search Console Data
 * Fetches keyword and page performance data from GSC and stores in database
 */

/** One row of a Search Console searchAnalytics/query response. */
interface GSCRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

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

    // Securely authenticate user with JWT verification
    let userId = null;
    try {
      const user = await requireAuth(req, supabase);
      userId = user.id;
    } catch (e) {
      console.error('Failed to authenticate user:', e);
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

    // Resolve the property ROW, not just its URL.
    //
    // US-201: gsc_keyword_performance and gsc_page_performance key on
    // property_id (uuid), not on a user_id/property_url pair — neither column
    // exists on either table. Every insert below was rejected by PostgREST with
    // 400, counted as a failure, and reported to the caller as
    // `keywordsSynced: 0`. The sync has never stored a row.
    const propertyQuery = supabase
      .from('gsc_properties')
      .select('id, property_url')
      .eq('user_id', userId);

    const { data: property } = await (propertyUrl
      ? propertyQuery.eq('property_url', propertyUrl).maybeSingle()
      : propertyQuery.eq('is_verified', true).limit(1).maybeSingle());

    if (!property) {
      return new Response(
        JSON.stringify({
          error: propertyUrl
            ? 'That Search Console property is not connected to this account'
            : 'No verified GSC property found',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const propertyId = property.id;
    const siteUrl = property.property_url;

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

    // Save keyword performance data.
    //
    // Replace the day rather than appending to it. The unique constraint is
    // (property_id, query, url, date, device, country) and this request asks
    // GSC for neither device nor country, so those arrive NULL — and NULLs do
    // not conflict in Postgres, which means an upsert would silently duplicate
    // every row on a re-sync. Deleting the day first is idempotent whatever the
    // dimensions are.
    //
    // One insert, not one per row: this loop was 1000 sequential round trips.
    let keywordsSaved = 0;
    if (keywords.length > 0) {
      await supabase
        .from('gsc_keyword_performance')
        .delete()
        .eq('property_id', propertyId)
        .eq('date', endDate);

      const { error: insertError } = await supabase.from('gsc_keyword_performance').insert(
        keywords.map((row: GSCRow) => ({
          property_id: propertyId,
          query: row.keys[0],
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
          date: endDate,
        }))
      );

      if (insertError) {
        console.error('Error saving keywords:', insertError);
      } else {
        keywordsSaved = keywords.length;
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

      // Save page performance data. Same shape as the keywords above: the
      // column is `url`, not `page_url`, and the day is replaced rather than
      // appended to.
      if (pages.length > 0) {
        await supabase
          .from('gsc_page_performance')
          .delete()
          .eq('property_id', propertyId)
          .eq('date', endDate);

        const { error: insertError } = await supabase.from('gsc_page_performance').insert(
          pages.map((row: GSCRow) => ({
            property_id: propertyId,
            url: row.keys[0],
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
            date: endDate,
          }))
        );

        if (insertError) {
          console.error('Error saving pages:', insertError);
        } else {
          pagesSaved = pages.length;
        }
      }
    }

    // Update last sync time. US-201: the column is last_synced_at; `last_sync_at`
    // does not exist, so this update 400'd and the dashboard's "last synced"
    // has always been empty. sync_status is set for the same reason — it
    // defaults to 'pending' and nothing ever moved it off.
    await supabase
      .from('gsc_properties')
      .update({ last_synced_at: new Date().toISOString(), sync_status: 'completed' })
      .eq('id', propertyId);

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
