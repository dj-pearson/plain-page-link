import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  property_id?: string; // Optional: sync specific property, otherwise sync all
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property_id, start_date, end_date }: SyncRequest = await req.json();

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
      .from('ga4_oauth_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No active Google Analytics credentials found. Please connect your account first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = credentials.access_token;
    if (new Date(credentials.expires_at) <= new Date()) {
      console.log('Access token expired, refreshing...');

      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: credentials.refresh_token,
          client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh access token');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      const expiresAt = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();

      // Update stored credentials
      await supabase
        .from('ga4_oauth_credentials')
        .update({
          access_token: accessToken,
          expires_at: expiresAt,
          last_refreshed_at: new Date().toISOString(),
        })
        .eq('id', credentials.id);
    }

    // Get properties to sync
    let propertyQuery = supabase
      .from('ga4_properties')
      .select('*')
      .eq('user_id', userId);

    if (property_id) {
      propertyQuery = propertyQuery.eq('id', property_id);
    }

    const { data: properties, error: propsError } = await propertyQuery;

    if (propsError || !properties || properties.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No properties found to sync' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Default date range: last 30 days
    const endDateObj = end_date ? new Date(end_date) : new Date();
    const startDateObj = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const formattedStartDate = startDateObj.toISOString().split('T')[0];
    const formattedEndDate = endDateObj.toISOString().split('T')[0];

    let totalRecordsSynced = 0;

    // Sync each property
    for (const property of properties) {
      console.log(`Syncing GA4 property: ${property.property_id}`);

      // Update sync status
      await supabase
        .from('ga4_properties')
        .update({ sync_status: 'syncing' })
        .eq('id', property.id);

      try {
        // Fetch GA4 data using Data API
        const reportResponse = await fetch(
          `https://analyticsdata.googleapis.com/v1beta/properties/${property.property_id}:runReport`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dateRanges: [
                {
                  startDate: formattedStartDate,
                  endDate: formattedEndDate,
                }
              ],
              dimensions: [
                { name: 'date' },
                { name: 'pagePath' },
                { name: 'pageTitle' },
                { name: 'sessionDefaultChannelGroup' },
                { name: 'deviceCategory' },
                { name: 'country' },
              ],
              metrics: [
                { name: 'sessions' },
                { name: 'totalUsers' },
                { name: 'newUsers' },
                { name: 'screenPageViews' },
                { name: 'engagedSessions' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
                { name: 'engagementRate' },
                { name: 'eventsPerSession' },
              ],
              limit: 10000, // Max rows per request
            }),
          }
        );

        if (!reportResponse.ok) {
          const errorText = await reportResponse.text();
          throw new Error(`GA4 API error: ${errorText}`);
        }

        const reportData = await reportResponse.json();
        const rows = reportData.rows || [];

        console.log(`Fetched ${rows.length} rows for property ${property.property_id}`);

        // Process and store data
        const trafficData = [];
        for (const row of rows) {
          const dimensions = row.dimensionValues || [];
          const metrics = row.metricValues || [];

          // Parse date from YYYYMMDD format
          const dateStr = dimensions[0]?.value || '';
          const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;

          const record = {
            property_id: property.id,
            date,
            page_path: dimensions[1]?.value || null,
            page_title: dimensions[2]?.value || null,
            source: dimensions[3]?.value || null, // sessionDefaultChannelGroup as source
            medium: null, // Not included in basic report
            campaign: null,
            device_category: dimensions[4]?.value?.toLowerCase() || null,
            country: dimensions[5]?.value || null,
            city: null,
            sessions: parseInt(metrics[0]?.value || '0'),
            users: parseInt(metrics[1]?.value || '0'),
            new_users: parseInt(metrics[2]?.value || '0'),
            pageviews: parseInt(metrics[3]?.value || '0'),
            engaged_sessions: parseInt(metrics[4]?.value || '0'),
            average_session_duration: parseFloat(metrics[5]?.value || '0'),
            bounce_rate: parseFloat(metrics[6]?.value || '0'),
            engagement_rate: parseFloat(metrics[7]?.value || '0'),
            events_per_session: parseFloat(metrics[8]?.value || '0'),
            conversions: 0,
            conversion_rate: 0,
            total_revenue: 0,
          };

          trafficData.push(record);
        }

        // Batch insert data (Supabase handles upserts based on unique constraints)
        if (trafficData.length > 0) {
          // Insert in chunks of 1000 to avoid payload limits
          const chunkSize = 1000;
          for (let i = 0; i < trafficData.length; i += chunkSize) {
            const chunk = trafficData.slice(i, i + chunkSize);

            const { error: insertError } = await supabase
              .from('ga4_traffic_data')
              .upsert(chunk, {
                onConflict: 'property_id,date,page_path,source,medium,device_category,country',
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
          .from('ga4_properties')
          .update({
            sync_status: 'completed',
            last_synced_at: new Date().toISOString(),
            sync_error: null,
          })
          .eq('id', property.id);

      } catch (syncError) {
        console.error(`Error syncing property ${property.property_id}:`, syncError);
        const errorMessage = syncError instanceof Error ? syncError.message : 'Unknown error';

        await supabase
          .from('ga4_properties')
          .update({
            sync_status: 'failed',
            sync_error: errorMessage,
          })
          .eq('id', property.id);
      }
    }

    console.log(`GA4 sync completed. Total records synced: ${totalRecordsSynced}`);

    return new Response(
      JSON.stringify({
        success: true,
        properties_synced: properties.length,
        records_synced: totalRecordsSynced,
        date_range: {
          start: formattedStartDate,
          end: formattedEndDate,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in Google Analytics sync:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
