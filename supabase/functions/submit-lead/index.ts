import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { sendEmail } from '../_shared/email.ts'
import { encryptSecret } from '../_shared/encryption.ts'
import { readSpamSignals, botReason, emailLookupHash } from '../_shared/spam-guard.ts'
import {
  buildEnrichment,
  generateEnrichToken,
  hashEnrichToken,
  ENRICH_TOKEN_RE,
  ENRICH_TOKEN_TTL_MINUTES,
} from '../_shared/lead-enrichment.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { checkRateLimitDb, RATE_LIMITS } from '../_shared/rate-limiter.ts'
import { validateLeadData, sanitizeString, getClientIP, isValidWebhookUrl } from '../_shared/validation.ts'
import { safeFetch } from '../_shared/ssrf-guard.ts'
import { getAgentContact } from '../_shared/agent-contact.ts'
import { successResponse, validationError, rateLimitResponse, handleUnexpectedError } from '../_shared/response.ts'

interface LeadData {
  user_id: string
  name: string
  email?: string
  phone?: string
  message?: string
  lead_type: string
  source?: string
  listing_id?: string
  /** Set by the open house sign-in kiosk; checked against user_id below. */
  open_house_id?: string
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

/**
 * A single-use token for step two of the form (US-228), valid for
 * ENRICH_TOKEN_TTL_MINUTES. Only its hash is stored. Best effort: a lead
 * without one is still a lead, the visitor just cannot add details to it.
 */
async function issueEnrichToken(leadId: string): Promise<string | null> {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const token = generateEnrichToken()
    const { error } = await supabase
      .from('leads')
      .update({
        update_token_hash: await hashEnrichToken(token),
        update_token_expires_at: new Date(Date.now() + ENRICH_TOKEN_TTL_MINUTES * 60_000).toISOString(),
      })
      .eq('id', leadId)
    if (error) throw error
    return token
  } catch (e) {
    console.error(`[submit-lead] could not issue a step-two token for ${leadId}:`, e)
    return null
  }
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
    //
    // An open house kiosk is one tablet on one connection, so every visitor
    // shares an IP; five a minute would turn away a family signing in one after
    // another. Kiosk sign-ins get their own, wider bucket per open house. A
    // made-up open_house_id buys a fresh bucket but no lead: the ownership
    // check below refuses it before anything is written.
    const kioskOpenHouseId =
      rawData?.lead_type === 'open_house' && typeof rawData?.open_house_id === 'string'
        ? rawData.open_house_id.slice(0, 36)
        : null;
    const rateLimit = kioskOpenHouseId
      ? await checkRateLimitDb(
          supabase,
          `${rateIdentifier}:open-house:${kioskOpenHouseId}`,
          'submit-lead-open-house',
          { ...RATE_LIMITS.submission, maxRequests: 20 }
        )
      : await checkRateLimitDb(supabase, rateIdentifier, 'submit-lead', RATE_LIMITS.submission);

    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for identifier: ${rateIdentifier}`);
      return rateLimitResponse(rateLimit.retryAfterSeconds, req, 'Too many requests. Please try again later.');
    }

    // US-220: invisible bot signals. A trip gets the ordinary success answer
    // and nothing is stored or sent, so the bot learns nothing.
    const spamReason = botReason(readSpamSignals(rawData));
    if (spamReason) {
      console.warn(`[submit-lead] dropped a submission for ${rawData?.user_id ?? '?'}: ${spamReason}`);
      return successResponse({ lead_id: null }, req);
    }

    // US-228: step two of a form — the qualifiers, added to the lead step one
    // created, authorised by the single-use token step one returned.
    if (rawData?.action === 'enrich') {
      const token = rawData.update_token
      if (typeof rawData.lead_id !== 'string' || typeof token !== 'string' || !ENRICH_TOKEN_RE.test(token)) {
        return validationError(['lead_id and update_token are required'], req)
      }
      const enrichment = buildEnrichment(rawData)
      if (enrichment.errors.length > 0) return validationError(enrichment.errors, req)

      const { data: target, error: targetError } = await supabase
        .from('leads')
        .select('id, form_data')
        .eq('id', rawData.lead_id)
        .eq('update_token_hash', await hashEnrichToken(token))
        .gt('update_token_expires_at', new Date().toISOString())
        .maybeSingle()
      if (targetError) throw targetError
      if (!target) return validationError(['This form has expired. Your details were already sent.'], req)

      const { error: enrichError } = await supabase
        .from('leads')
        .update({
          ...enrichment.columns,
          form_data: { ...(target.form_data ?? {}), ...enrichment.formData },
          update_token_hash: null,
          update_token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id)
      if (enrichError) throw enrichError
      return successResponse({ lead_id: target.id }, req)
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
      // US-228: optional when a phone is given.
      email: rawData.email ? String(rawData.email).trim().toLowerCase() : undefined,
      phone: rawData.phone ? sanitizeString(rawData.phone) : undefined,
      message: rawData.message ? sanitizeString(rawData.message) : undefined,
      lead_type: rawData.lead_type,
      source: rawData.source ? sanitizeString(rawData.source) : 'website',
      listing_id: rawData.listing_id,
      open_house_id: rawData.open_house_id,
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

    // An open house sign-in must belong to the agent it is filed under, and it
    // is filed against the open house's listing whatever the request said. The
    // kiosk is a public page, so both ids arrive from a visitor's browser; the
    // service-role insert below would otherwise attach a sign-in to any open
    // house id it was handed.
    if (leadData.open_house_id) {
      const { data: openHouse, error: openHouseError } = await supabase
        .from('open_houses')
        .select('id, user_id, listing_id, status')
        .eq('id', leadData.open_house_id)
        .maybeSingle()

      if (openHouseError) throw openHouseError
      if (!openHouse || openHouse.user_id !== leadData.user_id || openHouse.status === 'cancelled') {
        return validationError(['That open house is not taking sign-ins'], req)
      }
      leadData.listing_id = openHouse.listing_id
      leadData.source = 'open_house'
    }

    // US-086: encrypt the PII before it is stored. This path — the one every
    // public capture form uses — wrote no ciphertext at all, so coverage was
    // inconsistent as well as ineffective: useLeads dual-wrote encrypted_*,
    // submit-lead did not, and the plaintext columns were authoritative
    // either way. The plaintext columns are gone now, so this is the only
    // place the values are stored.
    const [encryptedEmail, encryptedPhone] = await Promise.all([
      encryptSecret(leadData.email),
      encryptSecret(leadData.phone),
    ])

    const { email: _plaintextEmail, phone: _plaintextPhone, ...storedLead } = leadData

    // US-220: the same person enquiring again within a day — a double submit,
    // a refresh, or a bot replaying one address — is folded into the lead they
    // already have: its form answers are merged, and nothing is notified,
    // auto-replied or counted against the agent's allowance a second time.
    const hashSecret = Deno.env.get('PII_ENCRYPTION_KEY') ?? Deno.env.get('ENCRYPTION_KEY')
    const emailHash = hashSecret && leadData.email ? await emailLookupHash(leadData.email, hashSecret) : null
    if (emailHash) {
      const { data: earlier, error: earlierError } = await supabase
        .from('leads')
        .select('id, form_data, message')
        .eq('user_id', leadData.user_id)
        .eq('lead_type', leadData.lead_type)
        .eq('email_hash', emailHash)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (earlierError) throw earlierError
      if (earlier) {
        const { error: mergeError } = await supabase
          .from('leads')
          .update({
            form_data: { ...(earlier.form_data ?? {}), ...(leadData.form_data ?? {}) },
            message: leadData.message ?? earlier.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', earlier.id)
        if (mergeError) throw mergeError
        return successResponse({ lead_id: earlier.id, update_token: await issueEnrichToken(earlier.id) }, req)
      }
    }

    // Insert lead into database
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        ...storedLead,
        encrypted_email: encryptedEmail,
        encrypted_phone: encryptedPhone,
        email_hash: emailHash,
      })
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

    // agentEmail is no longer read here: the agent notification is notify-lead's
    // job now. agentName still signs the visitor's auto-response below.
    const agentName = agentContact?.fullName || 'Your Real Estate Agent'
    const zapierWebhookUrl = agentContact?.zapierWebhookUrl

    // A lead past the agent's monthly allowance is stored but its contact
    // details are not handed on (20260923000003). Zapier would otherwise be a
    // way round the lock — it receives the plaintext.
    const { data: lockedIds } = await supabase.rpc('locked_lead_ids', {
      _user_id: leadData.user_id,
      _lead_ids: [lead.id],
    })
    const leadLocked = Array.isArray(lockedIds) && lockedIds.includes(lead.id)

    // Send lead to Zapier webhook if configured
    if (zapierWebhookUrl && !leadLocked) {
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

        // The agent controls this value, so it is caller-supplied input that
        // happens to be stored. Without a check an agent could aim it at
        // http://postgres-meta:8080 and have the edge runtime fetch it from
        // inside the Docker network on every lead (US-119). The column now has
        // a CHECK constraint too; this is the guard for rows written before it.
        if (!isValidWebhookUrl(zapierWebhookUrl)) {
          console.error(
            `[submit-lead] refusing zapier_webhook_url for ${leadData.user_id}: not an accepted destination`
          )
          throw new Error('Zapier webhook destination is not allowed')
        }

        const zapierResponse = await safeFetch(zapierWebhookUrl, {
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
      contact: 'message',
      open_house: 'visit to the open house',
    }

    // US-220: however many leads arrive, one agent's form sends at most this
    // many auto-replies a day — the cap on how much mail a flood through this
    // endpoint can put in strangers' inboxes. The leads themselves are kept.
    const autoReplyBudget = await checkRateLimitDb(
      supabase,
      `autoreply:${leadData.user_id}`,
      'submit-lead-autoreply',
      { maxRequests: 50, windowSeconds: 86400, failClosed: false }
    )
    if (!leadData.email) {
      // A phone-only lead (US-228) has nowhere to send an auto-reply.
    } else if (!autoReplyBudget.allowed) {
      console.warn(`[submit-lead] auto-reply cap reached for ${leadData.user_id}; lead ${lead.id} stored without one`)
    } else await sendEmail({
      to: leadData.email,
      subject: `Thank you for your ${leadTypeLabels[leadData.lead_type] || 'inquiry'}`,
      body: `Hi ${leadData.name},

${leadData.lead_type === 'open_house'
  ? `Thank you for stopping by the open house today! If you would like a second look, the disclosures, or a list of similar homes, just reply to this email.`
  : `Thank you for reaching out! I have received your ${leadTypeLabels[leadData.lead_type] || 'inquiry'} and will get back to you as soon as possible.`}

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
      <h1 style="margin: 0;">${leadData.lead_type === 'open_house' ? 'Thanks for Visiting!' : 'Thank You for Reaching Out!'}</h1>
    </div>
    <div class="content">
      <p>Hi ${leadData.name},</p>
      ${leadData.lead_type === 'open_house'
        ? `<p>Thank you for stopping by the open house today! If you would like a second look, the disclosures, or a list of similar homes, just reply to this email.</p>`
        : `<p>Thank you for your <strong>${leadTypeLabels[leadData.lead_type] || 'inquiry'}</strong>! I have received your message and will get back to you as soon as possible.</p>`}

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

    // Notify the agent through notify-lead, the one notification path.
    //
    // This block used to compose and send its own agent email, while
    // trg_notify_lead_on_insert called notify-lead for the same row — two
    // emails per lead whenever both worked, and neither honoured the agent's
    // notification_preferences.leads setting from here. It also interpolated
    // the visitor's name and message into HTML unescaped, which the shared
    // template does not. The trigger is dropped in 20260902000003; this is the
    // explicit call that replaces it, so the preference, the decryption and
    // the timeline entry all happen in one place (US-099).
    //
    // Best effort: the lead is already stored, and a notification failure must
    // not tell the visitor their enquiry did not go through.
    try {
      const notifyResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/notify-lead`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ lead_id: lead.id }),
      })
      if (!notifyResponse.ok) {
        console.error(
          `notify-lead returned ${notifyResponse.status} for lead ${lead.id}: ${await notifyResponse.text()}`
        )
      }
    } catch (notifyError) {
      console.error(`Could not reach notify-lead for lead ${lead.id}:`, notifyError)
    }

    return successResponse({ lead_id: lead.id, update_token: await issueEnrichToken(lead.id) }, req)

  } catch (error) {
    console.error('Error in submit-lead function:', error)
    return handleUnexpectedError(error, req)
  }
})
