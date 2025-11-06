// Supabase Edge Function: Register Push Notification Token
// Deploy with: supabase functions deploy register-push-token

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
    const { token, userId, device } = await req.json()

    if (!token || !userId) {
      throw new Error('Missing required fields: token, userId')
    }

    // Check if user ID matches authenticated user
    if (userId !== user.id) {
      throw new Error('User ID mismatch')
    }

    // Upsert token in database
    // This will update if token exists, insert if not
    const { data, error } = await supabaseClient
      .from('push_tokens')
      .upsert(
        {
          user_id: userId,
          token: token,
          device_info: device,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'token',
        }
      )
      .select()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to register token')
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Push token registered successfully',
        data,
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
