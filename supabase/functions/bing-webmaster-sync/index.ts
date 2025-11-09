import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

interface SyncRequest {
  site_id?: string;
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { site_id, start_date, end_date }: SyncRequest = await req.json();

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        userId = user?.id;
      } catch (e) {
        console.error('Failed to get user:', e);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get active OAuth credentials
    const { data: credentials, error: credError } = await supabase
      .from('bing_webmaster_oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No active Bing Webmaster credentials found. Please connect your account first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = credentials.access_token;
    if (new Date(credentials.expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');

      const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: credentials.refresh_token,
          client_id: Deno.env.get("MICROSOFT_CLIENT_ID")!,
          client_secret: Deno.env.get("MICROSOFT_CLIENT_SECRET")!,
          grant_type: 'refresh_token',
          scope: 'https://api.bing.microsoft.com/webmaster.read offline_access',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      await supabase
        .from('bing_webmaster_oauth_credentials')
        .update({
          access_token: accessToken,
          expires_at: expiresAt,
          last_refreshed_at: new Date().toISOString(),
        })
        .eq('id', credentials.id);
    }

    // Get sites to sync
    let siteQuery = supabase
      .from('bing_webmaster_sites')
      .select('*')
      .eq('user_id', userId);

    if (site_id) {
      siteQuery = siteQuery.eq('id', site_id);
    }

    const { data: sites, error: sitesError } = await siteQuery;

    if (sitesError || !sites || sites.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No sites found to sync' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default date range: last 30 days
    const endDateObj = end_date ? new Date(end_date) : new Date();
    const startDateObj = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const formattedStartDate = startDateObj.toISOString().split('T')[0];
    const formattedEndDate = endDateObj.toISOString().split('T')[0];

    let totalRecordsSynced = 0;

    // Sync each site
    for (const site of sites) {
      console.log(`Syncing Bing Webmaster site: ${site.site_url}`);

      // Update sync status
      await supabase
        .from('bing_webmaster_sites')
        .update({ sync_status: 'syncing' })
        .eq('id', site.id);

      try {
        // Fetch query stats from Bing Webmaster API
        // Note: Bing API uses different date format
        const queryStatsResponse = await fetch(
          `https://ssl.bing.com/webmaster/api.svc/json/GetQueryStats?siteUrl=${encodeURIComponent(site.site_url)}&query=&country=&device=&queryType=&date=${formattedStartDate}&toDate=${formattedEndDate}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!queryStatsResponse.ok) {
          const errorText = await queryStatsResponse.text();
          throw new Error(`Bing API error: ${errorText}`);
        }

        const queryStatsData = await queryStatsResponse.json();
        const queries = queryStatsData.d || [];

        console.log(`Fetched ${queries.length} query records for ${site.site_url}`);

        // Process and store data
        const searchData = [];
        for (const query of queries) {
          const record = {
            site_id: site.id,
            date: query.Date ? new Date(query.Date).toISOString().split('T')[0] : formattedStartDate,
            query: query.Query || null,
            page_url: query.Url || null,
            country: query.Country || null,
            device: query.Device || 'Desktop',
            clicks: parseInt(query.Clicks || '0'),
            impressions: parseInt(query.Impressions || '0'),
            ctr: parseFloat(query.Ctr || '0'),
            average_position: parseFloat(query.AvgImpressionPosition || '0'),
          };

          searchData.push(record);
        }

        // Also fetch page stats for more comprehensive data
        const pageStatsResponse = await fetch(
          `https://ssl.bing.com/webmaster/api.svc/json/GetPageStats?siteUrl=${encodeURIComponent(site.site_url)}&date=${formattedStartDate}&toDate=${formattedEndDate}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (pageStatsResponse.ok) {
          const pageStatsData = await pageStatsResponse.json();
          const pages = pageStatsData.d || [];

          console.log(`Fetched ${pages.length} page records for ${site.site_url}`);

          for (const page of pages) {
            const record = {
              site_id: site.id,
              date: page.Date ? new Date(page.Date).toISOString().split('T')[0] : formattedStartDate,
              query: null, // Page stats don't include query
              page_url: page.Url || null,
              country: null,
              device: 'Desktop',
              clicks: parseInt(page.Clicks || '0'),
              impressions: parseInt(page.Impressions || '0'),
              ctr: parseFloat(page.Ctr || '0'),
              average_position: parseFloat(page.AvgImpressionPosition || '0'),
            };

            searchData.push(record);
          }
        }

        // Batch insert data
        if (searchData.length > 0) {
          const chunkSize = 1000;
          for (let i = 0; i < searchData.length; i += chunkSize) {
            const chunk = searchData.slice(i, i + chunkSize);

            const { error: insertError } = await supabase
              .from('bing_webmaster_search_data')
              .upsert(chunk, {
                onConflict: 'site_id,date,query,page_url,device,country',
                ignoreDuplicates: false,
              });

            if (insertError) {
              console.error(`Error inserting chunk ${i / chunkSize + 1}:`, insertError);
            } else {
              totalRecordsSynced += chunk.length;
            }
          }
        }

        // Update sync status
        await supabase
          .from('bing_webmaster_sites')
          .update({
            sync_status: 'completed',
            last_synced_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', site.id);

      } catch (syncError) {
        console.error(`Error syncing site ${site.site_url}:`, syncError);
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';

        await supabase
          .from('bing_webmaster_sites')
          .update({
            sync_status: 'failed',
            sync_error: errorMessage,
          })
          .eq('id', site.id);
      }
    }

    console.log(`Bing Webmaster sync completed. Total records synced: ${totalRecordsSynced}`);

    return new Response(
      JSON.stringify({
        success: true,
        sites_synced: sites.length,
        records_synced: totalRecordsSynced,
        date_range: {
          start: formattedStartDate,
          end: formattedEndDate,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Bing Webmaster sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
