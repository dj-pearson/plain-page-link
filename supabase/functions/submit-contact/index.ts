// Supabase Edge Function: Submit Contact Form
// Deploy with: supabase functions deploy submit-contact

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
    // Create Supabase client (public access for contact forms)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const { name, email, phone, message, listingId, agentId } = await req.json()

    // Validate required fields
    if (!name || !email || !message) {
      throw new Error('Missing required fields: name, email, message')
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Insert lead into database
    const { data, error } = await supabaseClient
      .from('leads')
      .insert({
        agent_id: agentId,
        name,
        email,
        phone: phone || null,
        type: 'contact',
        data: {
          message,
          listingId,
        },
        source: 'website',
        status: 'new',
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to submit contact form')
    }

    // TODO: Send email notification to agent
    // You can use Resend, SendGrid, or any email service here
    // Example:
    // await sendEmailNotification({
    //   to: agentEmail,
    //   subject: `New contact form submission from ${name}`,
    //   body: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`
    // })

    // TODO: Send auto-response email to lead
    // await sendEmailNotification({
    //   to: email,
    //   subject: 'Thank you for contacting us',
    //   body: 'We have received your message and will get back to you soon.'
    // })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contact form submitted successfully',
        leadId: data.id,
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
