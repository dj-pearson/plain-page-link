// Supabase Edge Function: Submit Contact Form
// Deploy with: supabase functions deploy submit-contact

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getCorsHeaders } from '../_shared/cors.ts';
import { sendEmail } from '../_shared/email.ts';
import { checkRateLimit, getRateLimitHeaders } from '../_shared/rateLimit.ts';
import { validateContactData, sanitizeString, getClientIP } from '../_shared/validation.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Rate limiting - 5 requests per minute per IP
    const clientIP = getClientIP(req);
    const rateLimit = checkRateLimit(clientIP, { maxRequests: 5, windowMs: 60000 });
    
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            ...getRateLimitHeaders(rateLimit),
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Create Supabase client (public access for contact forms)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const rawData = await req.json()
    
    // Validate input
    const validation = validateContactData(rawData);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input data', details: validation.errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const name = sanitizeString(rawData.name);
    const email = rawData.email.trim().toLowerCase();
    const phone = rawData.phone ? sanitizeString(rawData.phone) : undefined;
    const message = rawData.message ? sanitizeString(rawData.message) : undefined;
    const { listingId, agentId, leadId, type, data } = rawData;

    // If leadId is provided, fetch the lead; otherwise it was already created by the client
    let leadData = null
    if (leadId) {
      const { data: lead } = await supabaseClient
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()
      leadData = lead
    }

    // Get agent info for personalized emails
    const { data: agentProfile } = await supabaseClient
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', agentId)
      .single()

    const agentName = agentProfile?.full_name || 'Your Agent'
    const agentEmail = agentProfile?.email

    // Send email notification to agent
    if (agentEmail) {
      try {
        const leadTypeLabel = type === 'buyer' ? 'Buyer Inquiry' :
                            type === 'seller' ? 'Seller Inquiry' :
                            type === 'valuation' ? 'Home Valuation Request' :
                            'Contact Form Submission'

        let emailBody = `You have received a new ${leadTypeLabel}:\n\n`
        emailBody += `Name: ${name}\n`
        emailBody += `Email: ${email}\n`
        if (phone) emailBody += `Phone: ${phone}\n`

        // Add type-specific details
        if (data) {
          emailBody += '\n--- Details ---\n'
          Object.entries(data).forEach(([key, value]) => {
            if (value) {
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
              emailBody += `${label}: ${value}\n`
            }
          })
        }

        emailBody += `\n---\nSubmitted via AgentBio.net\n`

        await sendEmail({
          to: agentEmail,
          subject: `🎯 New ${leadTypeLabel} from ${name}`,
          body: emailBody,
        })
      } catch (error) {
        console.error('Failed to send agent notification:', error)
        // Don't fail the whole request if email fails
      }
    }

    // Send auto-response email to lead
    try {
      const responseSubject = type === 'valuation' ?
        'Your Home Valuation Request' :
        type === 'seller' ?
        'Your Listing Inquiry' :
        `Thank you for contacting ${agentName}`

      let responseBody = `Hi ${name},\n\n`
      responseBody += `Thank you for reaching out! I have received your ${
        type === 'buyer' ? 'home buying inquiry' :
        type === 'seller' ? 'listing inquiry' :
        type === 'valuation' ? 'home valuation request' :
        'message'
      } and will get back to you within 24 hours.\n\n`

      if (type === 'valuation') {
        responseBody += `I'll prepare a detailed market analysis for your property and send it to you shortly.\n\n`
      }

      responseBody += `Best regards,\n${agentName}`

      await sendEmail({
        to: email,
        subject: responseSubject,
        body: responseBody,
      })
    } catch (error) {
      console.error('Failed to send auto-response:', error)
      // Don't fail the whole request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Lead submitted and notifications sent successfully',
        leadId: leadData?.id || leadId,
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
