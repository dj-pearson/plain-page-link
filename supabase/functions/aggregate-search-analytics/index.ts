import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

interface AggregateRequest {
  start_date?: string; // Format: YYYY-MM-DD
  end_date?: string; // Format: YYYY-MM-DD
  force_refresh?: boolean; // Force re-aggregation even if data exists
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { start_date, end_date, force_refresh = false }: AggregateRequest = await req.json();

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

    // Default date range: last 30 days
    const endDateObj = end_date ? new Date(end_date) : new Date();
    const startDateObj = start_date ? new Date(start_date) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const formattedStartDate = startDateObj.toISOString().split('T')[0];
    const formattedEndDate = endDateObj.toISOString().split('T')[0];

    console.log(`Aggregating search analytics for user ${userId} from ${formattedStartDate} to ${formattedEndDate}`);

    // Use the database function to refresh unified analytics
    const { data, error } = await supabase.rpc('refresh_unified_analytics', {
      p_user_id: userId,
      p_start_date: formattedStartDate,
      p_end_date: formattedEndDate,
    });

    if (error) {
      console.error('Error calling refresh_unified_analytics:', error);
      throw error;
    }

    const recordsAggregated = data || 0;

    console.log(`Successfully aggregated ${recordsAggregated} records`);

    // Get summary statistics
    const { data: summary, error: summaryError } = await supabase
      .from('unified_search_analytics')
      .select('source_platform, clicks, impressions, sessions, users')
      .eq('user_id', userId)
      .gte('date', formattedStartDate)
      .lte('date', formattedEndDate);

    if (summaryError) {
      console.warn('Error fetching summary:', summaryError);
    }

    // Calculate totals by platform
    const platformSummary: Record<string, any> = {};
    if (summary) {
      for (const row of summary) {
        const platform = row.source_platform;
        if (!platformSummary[platform]) {
          platformSummary[platform] = {
            total_clicks: 0,
            total_impressions: 0,
            total_sessions: 0,
            total_users: 0,
          };
        }

        platformSummary[platform].total_clicks += row.clicks || 0;
        platformSummary[platform].total_impressions += row.impressions || 0;
        platformSummary[platform].total_sessions += row.sessions || 0;
        platformSummary[platform].total_users += row.users || 0;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        records_aggregated: recordsAggregated,
        date_range: {
          start: formattedStartDate,
          end: formattedEndDate,
        },
        platform_summary: platformSummary,
        message: 'Search analytics aggregation completed successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aggregate search analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
