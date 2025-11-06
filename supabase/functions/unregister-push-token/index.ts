// Supabase Edge Function: Unregister Push Notification Token
// Deploy with: supabase functions deploy unregister-push-token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user is authenticated
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Parse request body
    const { token } = await req.json()

    if (!token) {
      throw new Error('Missing required field: token')
    }

    // Mark token as inactive (or delete it)
    // Option 1: Mark as inactive (recommended - keeps history)
    const { error } = await supabaseClient
      .from('push_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('token', token)
      .eq('user_id', user.id)

    // Option 2: Delete token completely (uncomment if preferred)
    // const { error } = await supabaseClient
    //   .from('push_tokens')
    //   .delete()
    //   .eq('token', token)
    //   .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to unregister token')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push token unregistered successfully',
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
