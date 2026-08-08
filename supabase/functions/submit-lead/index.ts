import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { sendEmail } from '../_shared/email.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts'
import { validateLeadData, sanitizeString, getClientIP } from '../_shared/validation.ts'
import { getAgentContact } from '../_shared/agent-contact.ts'
import { successResponse, validationError, rateLimitResponse, handleUnexpectedError } from '../_shared/response.ts'

interface LeadData {
  user_id: string
  name: string
  email: string
  phone?: string
  message?: string
  lead_type: string
  source?: string
  listing_id?: string
  price_range?: string
  timeline?: string
  property_address?: string
  preapproved?: boolean
  referrer_url?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  device?: string
  /**
   * Structured extras the capture form collected that have no dedicated column
   * (bedrooms, condition, year built, …). Persisted to leads.form_data so the
   * richer inquiry and valuation forms do not lose the answers they ask for.
   */
  form_data?: Record<string, unknown>
}

/**
 * Sanitise a flat bag of form answers before it goes into leads.form_data.
 * Values are stringified and length-capped; nested objects are dropped rather
 * than walked, since no caller sends them and unbounded nesting is a DoS shape.
 */
function sanitizeFormData(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= 40) break
    if (value === null || value === undefined || value === '') continue
    if (typeof value === 'boolean' || typeof value === 'number') {
      out[sanitizeString(key).slice(0, 64)] = value
    } else if (typeof value === 'string') {
      out[sanitizeString(key).slice(0, 64)] = sanitizeString(value).slice(0, 1000)
    }
  }
  return Object.keys(out).length > 0 ? out : undefined
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const rawData = await req.json()

    // Database-backed rate limiting - 5 requests per minute per IP. When the
    // source IP is unavailable (getClientIP returns 'unknown'), bucket by the
    // target agent instead, so every no-IP request doesn't collapse into one
    // shared global bucket that unrelated agents' visitors would exhaust.
    const clientIP = getClientIP(req);
    const rateIdentifier =
      clientIP !== 'unknown' ? clientIP : `target:${rawData?.user_id ?? 'anon'}`;
    const rateLimit = await checkRateLimitDb(supabase, rateIdentifier, 'submit-lead', RATE_LIMITS.submission);

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for identifier: ${rateIdentifier}`);
      return rateLimitResponse(rateLimit.retryAfterSeconds, req, 'Too many requests. Please try again later.');
    }

    // Validate input data
    const validation = validateLeadData(rawData);
    if (!validation.valid) {
      console.error('Validation errors:', validation.errors);
      return validationError(validation.errors, req);
    }

    // Sanitize string inputs
    const leadData: LeadData = {
      user_id: rawData.user_id,
      name: sanitizeString(rawData.name),
      email: rawData.email.trim().toLowerCase(),
      phone: rawData.phone ? sanitizeString(rawData.phone) : undefined,
      message: rawData.message ? sanitizeString(rawData.message) : undefined,
      lead_type: rawData.lead_type,
      source: rawData.source ? sanitizeString(rawData.source) : 'website',
      listing_id: rawData.listing_id,
      price_range: rawData.price_range ? sanitizeString(rawData.price_range) : undefined,
      timeline: rawData.timeline ? sanitizeString(rawData.timeline) : undefined,
      property_address: rawData.property_address ? sanitizeString(rawData.property_address) : undefined,
      preapproved: rawData.preapproved,
      referrer_url: rawData.referrer_url,
      utm_source: rawData.utm_source ? sanitizeString(rawData.utm_source) : undefined,
      utm_medium: rawData.utm_medium ? sanitizeString(rawData.utm_medium) : undefined,
      utm_campaign: rawData.utm_campaign ? sanitizeString(rawData.utm_campaign) : undefined,
      device: rawData.device ? sanitizeString(rawData.device) : undefined,
      form_data: sanitizeFormData(rawData.form_data),
    };

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting lead:', insertError)
      throw insertError
    }

    // Get agent contact details for the personalised email and the Zapier
    // webhook. The account address lives in auth.users, not on the profile —
    // see _shared/agent-contact.ts (US-070).
    const agentContact = await getAgentContact(supabase, leadData.user_id)

    if (!agentContact) {
      // The lead is already saved, so this is not fatal to the visitor — but it
      // must be visible rather than silently skipping the notification.
      console.error(`Could not resolve agent contact for ${leadData.user_id}; lead ${lead.id} saved without notification`)
    }

    const agentName = agentContact?.fullName || 'Your Real Estate Agent'
    const agentEmail = agentContact?.email
    const zapierWebhookUrl = agentContact?.zapierWebhookUrl

    // Send lead to Zapier webhook if configured
    if (zapierWebhookUrl) {
      try {
        const zapierPayload = {
          lead_id: lead.id,
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          message: leadData.message,
          lead_type: leadData.lead_type,
          price_range: leadData.price_range,
          timeline: leadData.timeline,
          property_address: leadData.property_address,
          preapproved: leadData.preapproved,
          referrer_url: leadData.referrer_url,
          utm_source: leadData.utm_source,
          utm_medium: leadData.utm_medium,
          utm_campaign: leadData.utm_campaign,
          device: leadData.device,
          created_at: lead.created_at,
        }

        const zapierResponse = await fetch(zapierWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(zapierPayload),
        })

        if (!zapierResponse.ok) {
          console.error('Failed to send to Zapier webhook:', await zapierResponse.text())
        } else {
          console.log('Successfully sent lead to Zapier webhook')
        }
      } catch (zapierError) {
        console.error('Error sending to Zapier webhook:', zapierError)
        // Don't fail the entire request if Zapier webhook fails
      }
    }

    // Send auto-response email to lead
    const leadTypeLabels: Record<string, string> = {
      buyer: 'buying inquiry',
      seller: 'selling inquiry',
      valuation: 'home valuation request',
      contact: 'message'
    }

    await sendEmail({
      to: leadData.email,
      subject: `Thank you for your ${leadTypeLabels[leadData.lead_type] || 'inquiry'}`,
      body: `Hi ${leadData.name},

Thank you for reaching out! I have received your ${leadTypeLabels[leadData.lead_type] || 'inquiry'} and will get back to you as soon as possible.

${leadData.lead_type === 'buyer' ? `I'm excited to help you find your perfect home!` : ''}
${leadData.lead_type === 'seller' ? `I look forward to discussing how I can help you sell your property.` : ''}
${leadData.lead_type === 'valuation' ? `I'll prepare a comprehensive market analysis for your property.` : ''}

In the meantime, feel free to call me if you have any urgent questions.

Best regards,
${agentName}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .footer { text-center; margin-top: 20px; font-size: 12px; color: #666; }
    .highlight { background: #eef2ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Thank You for Reaching Out!</h1>
    </div>
    <div class="content">
      <p>Hi ${leadData.name},</p>
      <p>Thank you for your <strong>${leadTypeLabels[leadData.lead_type] || 'inquiry'}</strong>! I have received your message and will get back to you as soon as possible.</p>

      ${leadData.lead_type === 'buyer' ? `<div class="highlight"><p><strong>🏡 Looking for your dream home?</strong><br>I'm excited to help you find the perfect property that meets your needs!</p></div>` : ''}
      ${leadData.lead_type === 'seller' ? `<div class="highlight"><p><strong>🏠 Ready to sell?</strong><br>I look forward to discussing how I can help you get the best value for your property!</p></div>` : ''}
      ${leadData.lead_type === 'valuation' ? `<div class="highlight"><p><strong>📊 Home valuation request received!</strong><br>I'll prepare a comprehensive market analysis for your property.</p></div>` : ''}

      <p>In the meantime, feel free to reach out if you have any urgent questions.</p>

      <p>Best regards,<br><strong>${agentName}</strong></p>
    </div>
    <div class="footer">
      <p>This email was sent from AgentBio.net</p>
    </div>
  </div>
</body>
</html>`
    })

    // Send notification email to agent (if email is available)
    if (agentEmail) {
      await sendEmail({
        to: agentEmail,
        subject: `🔔 New ${leadTypeLabels[leadData.lead_type] || 'Lead'} from ${leadData.name}`,
        body: `You have a new ${leadTypeLabels[leadData.lead_type] || 'lead'}!

Name: ${leadData.name}
Email: ${leadData.email}
${leadData.phone ? `Phone: ${leadData.phone}` : ''}

${leadData.message ? `Message:\n${leadData.message}` : ''}

${leadData.price_range ? `Price Range: ${leadData.price_range}` : ''}
${leadData.timeline ? `Timeline: ${leadData.timeline}` : ''}
${leadData.property_address ? `Property Address: ${leadData.property_address}` : ''}

View lead in your dashboard: ${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard/leads

---
Sent from AgentBio.net`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #10b981; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
    .info-row { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
    .label { font-weight: bold; color: #6b7280; }
    .value { color: #111827; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🔔 New ${leadTypeLabels[leadData.lead_type] || 'Lead'}!</h2>
    </div>
    <div class="content">
      <div class="info-row">
        <span class="label">Name:</span> <span class="value">${leadData.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Email:</span> <span class="value">${leadData.email}</span>
      </div>
      ${leadData.phone ? `<div class="info-row"><span class="label">Phone:</span> <span class="value">${leadData.phone}</span></div>` : ''}
      ${leadData.message ? `<div class="info-row"><span class="label">Message:</span><br><span class="value">${leadData.message}</span></div>` : ''}
      ${leadData.price_range ? `<div class="info-row"><span class="label">Price Range:</span> <span class="value">${leadData.price_range}</span></div>` : ''}
      ${leadData.timeline ? `<div class="info-row"><span class="label">Timeline:</span> <span class="value">${leadData.timeline}</span></div>` : ''}
      ${leadData.property_address ? `<div class="info-row"><span class="label">Property Address:</span> <span class="value">${leadData.property_address}</span></div>` : ''}

      <a href="${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard/leads" class="button">View in Dashboard</a>
    </div>
  </div>
</body>
</html>`
      })
    }

    return successResponse({ lead_id: lead.id }, req)

  } catch (error) {
    console.error('Error in submit-lead function:', error)
    return handleUnexpectedError(error, req)
  }
})
