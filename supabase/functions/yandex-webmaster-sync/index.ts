import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  site_id?: string;
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
}

serve(async (req) => {
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
      .from('yandex_webmaster_oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No active Yandex Webmaster credentials found. Please connect your account first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = credentials.access_token;
    if (new Date(credentials.expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');

      if (!credentials.refresh_token) {
        throw new Error('No refresh token available. Please re-authenticate.');
      }

      const refreshResponse = await fetch('https://oauth.yandex.ru/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: credentials.refresh_token,
          client_id: Deno.env.get("YANDEX_CLIENT_ID")!,
          client_secret: Deno.env.get("YANDEX_CLIENT_SECRET")!,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      await supabase
        .from('yandex_webmaster_oauth_credentials')
        .update({
          access_token: accessToken,
          expires_at: expiresAt,
          last_refreshed_at: new Date().toISOString(),
        })
        .eq('id', credentials.id);
    }

    // Get sites to sync
    let siteQuery = supabase
      .from('yandex_webmaster_sites')
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
      console.log(`Syncing Yandex Webmaster site: ${site.host_id}`);

      // Update sync status
      await supabase
        .from('yandex_webmaster_sites')
        .update({ sync_status: 'syncing' })
        .eq('id', site.id);

      try {
        // Fetch search queries from Yandex Webmaster API
        // Yandex API uses specific date formats
        const searchQueriesResponse = await fetch(
          `https://api.webmaster.yandex.net/v4/user/${site.host_id}/search-queries/popular?date_from=${formattedStartDate}&date_to=${formattedEndDate}&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS&query_indicator=AVG_CLICK_POSITION&query_indicator=AVG_SHOW_POSITION&device_type_indicator=ALL`,
          {
            method: 'GET',
            headers: {
              'Authorization': `OAuth ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!searchQueriesResponse.ok) {
          const errorText = await searchQueriesResponse.text();
          throw new Error(`Yandex API error: ${errorText}`);
        }

        const searchQueriesData = await searchQueriesResponse.json();
        const queries = searchQueriesData.queries || [];

        console.log(`Fetched ${queries.length} query records for ${site.host_id}`);

        // Process and store data
        const searchData = [];
        for (const queryData of queries) {
          const record = {
            site_id: site.id,
            date: formattedEndDate, // Yandex returns aggregated data, use end date
            query: queryData.query_text || null,
            page_url: null, // Yandex popular queries don't include specific pages
            device: 'ALL',
            clicks: parseInt(queryData.indicators?.TOTAL_CLICKS || '0'),
            shows: parseInt(queryData.indicators?.TOTAL_SHOWS || '0'),
            ctr: 0, // Calculate if needed
            position: parseFloat(queryData.indicators?.AVG_SHOW_POSITION || '0'),
          };

          // Calculate CTR if we have clicks and shows
          if (record.shows > 0) {
            record.ctr = record.clicks / record.shows;
          }

          searchData.push(record);
        }

        // Also fetch search URLs for page-level data
        const searchUrlsResponse = await fetch(
          `https://api.webmaster.yandex.net/v4/user/${site.host_id}/search-urls/popular?date_from=${formattedStartDate}&date_to=${formattedEndDate}&query_indicator=TOTAL_SHOWS&query_indicator=TOTAL_CLICKS`,
          {
            method: 'GET',
            headers: {
              'Authorization': `OAuth ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (searchUrlsResponse.ok) {
          const searchUrlsData = await searchUrlsResponse.json();
          const urls = searchUrlsData.urls || [];

          console.log(`Fetched ${urls.length} URL records for ${site.host_id}`);

          for (const urlData of urls) {
            const record = {
              site_id: site.id,
              date: formattedEndDate,
              query: null, // URL data doesn't include specific queries
              page_url: urlData.url || null,
              device: 'ALL',
              clicks: parseInt(urlData.indicators?.TOTAL_CLICKS || '0'),
              shows: parseInt(urlData.indicators?.TOTAL_SHOWS || '0'),
              ctr: 0,
              position: 0,
            };

            if (record.shows > 0) {
              record.ctr = record.clicks / record.shows;
            }

            searchData.push(record);
          }
        }

        // Batch insert data
        if (searchData.length > 0) {
          const chunkSize = 1000;
          for (let i = 0; i < searchData.length; i += chunkSize) {
            const chunk = searchData.slice(i, i + chunkSize);

            const { error: insertError } = await supabase
              .from('yandex_webmaster_search_data')
              .upsert(chunk, {
                onConflict: 'site_id,date,query,page_url,device',
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
          .from('yandex_webmaster_sites')
          .update({
            sync_status: 'completed',
            last_synced_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', site.id);

      } catch (syncError) {
        console.error(`Error syncing site ${site.host_id}:`, syncError);
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';

        await supabase
          .from('yandex_webmaster_sites')
          .update({
            sync_status: 'failed',
            sync_error: errorMessage,
          })
          .eq('id', site.id);
      }
    }

    console.log(`Yandex Webmaster sync completed. Total records synced: ${totalRecordsSynced}`);

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
    console.error('Error in Yandex Webmaster sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
