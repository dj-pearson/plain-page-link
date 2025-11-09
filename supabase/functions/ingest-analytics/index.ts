// Supabase Edge Function: Ingest Analytics Events
// Deploy with: supabase functions deploy ingest-analytics

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { events } = await req.json()

    if (!events || !Array.isArray(events) || events.length === 0) {
      throw new Error('Invalid events data')
    }

    // Batch insert analytics events
    const analyticsRecords = events.map((event: any) => ({
      event_type: event.event,
      page_slug: event.pageSlug,
      session_id: event.sessionId,
      visitor_id: event.visitorId,
      event_data: event.data || {},
      user_agent: event.userAgent,
      referrer: event.referrer,
      screen_size: event.screenSize,
      device_type: event.deviceType,
      timestamp: new Date(event.timestamp).toISOString(),
    }))

    const { error } = await supabaseClient
      .from('analytics_events')
      .insert(analyticsRecords)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to insert analytics events')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully ingested ${events.length} analytics events`,
        count: events.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
