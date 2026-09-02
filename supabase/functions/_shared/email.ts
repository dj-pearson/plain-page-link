// Shared email utility for Supabase Edge Functions
// Uses Resend API - you can swap for SendGrid or another provider

import { getSiteUrl } from './env.ts';

interface EmailOptions {
  to: string
  subject: string
  body: string
  html?: string
}

// Escape user-controlled values before interpolating them into HTML email
// bodies. Lead name/message/listing come from public intake forms, so an
// unescaped value could inject markup (phishing links, layout breakout) into
// the email delivered from the agent's own domain.
export function escapeHtml(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * The outcome of a send. Callers used to get `void` from a function that
 * swallowed every failure — a missing RESEND_API_KEY, a 4xx from Resend, a
 * network error — so notify-lead logged 'lead_notification_sent' with status
 * 'success' without knowing whether anything had been sent (US-099).
 */
export interface SendEmailResult {
  ok: boolean
  providerId?: string
  error?: string
}

/**
 * Sends one email through Resend.
 *
 * Never throws — a notification failure must not roll back the lead that
 * triggered it — but it now reports what happened, so a caller can record the
 * truth instead of assuming success.
 *
 * A missing RESEND_API_KEY is a configuration failure, not a quiet skip: in
 * production it is logged at error level and returned as { ok: false }. Outside
 * production it stays a warning, so local development does not need a key.
 */
export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    const message = 'RESEND_API_KEY is not set; no email was sent'
    if ((Deno.env.get('ENVIRONMENT') ?? Deno.env.get('DENO_ENV')) === 'production') {
      console.error(`[email] ${message}`)
      return { ok: false, error: message }
    }
    console.warn(`[email] ${message} (non-production)`)
    return { ok: false, error: message }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: Deno.env.get('FROM_EMAIL') ?? 'noreply@agentbio.net',
        to: options.to,
        subject: options.subject,
        text: options.body,
        // When no explicit HTML is supplied, escape the plaintext body before
        // wrapping it so user-controlled content can't inject markup.
        html: options.html || `<p>${escapeHtml(options.body).replace(/\n/g, '<br>')}</p>`,
      }),
    })

    if (!response.ok) {
      const detail = await response.text()
      const message = `Resend returned ${response.status}: ${detail}`
      console.error(`[email] ${message}`)
      return { ok: false, error: message }
    }

    const body = (await response.json().catch(() => null)) as { id?: string } | null
    console.log(`[email] sent to ${options.to}${body?.id ? ` (${body.id})` : ''}`)
    return { ok: true, providerId: body?.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[email] send failed: ${message}`)
    return { ok: false, error: message }
  }
}

// Branded, responsive HTML template for the agent lead notification.
// Subject: "New Lead: {name} is interested in {listing}"
export function createLeadNotificationEmail(data: {
  agentEmail: string
  name: string
  email: string
  phone?: string
  message?: string
  listing?: string
  sourcePage?: string
  leadScore?: number | null
  dashboardUrl?: string
}): EmailOptions {
  const listing = data.listing || 'your services'
  const dashboardUrl =
    data.dashboardUrl ||
    `${getSiteUrl()}/dashboard/leads`
  const scoreBadge =
    typeof data.leadScore === 'number'
      ? `<span style="display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:600;">Lead score: ${data.leadScore}</span>`
      : ''

  const rows: Array<[string, string | undefined]> = [
    ['Name', data.name],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Interested in', data.listing],
    ['Source page', data.sourcePage],
  ]
  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:120px;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join('')

  return {
    to: data.agentEmail,
    subject: `New Lead: ${data.name} is interested in ${listing}`,
    body: `New lead captured on AgentBio:

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}${data.listing ? `Interested in: ${data.listing}\n` : ''}${data.sourcePage ? `Source page: ${data.sourcePage}\n` : ''}${typeof data.leadScore === 'number' ? `Lead score: ${data.leadScore}\n` : ''}${data.message ? `\nMessage:\n${data.message}\n` : ''}
View this lead: ${dashboardUrl}

— AgentBio`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:32px 30px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:600;">🔔 New Lead Captured</h1>
      <p style="margin:8px 0 0;opacity:.95;font-size:15px;">${escapeHtml(data.name)} is interested in ${escapeHtml(listing)}</p>
    </div>
    <div style="background:#fff;padding:30px;">
      ${scoreBadge ? `<p style="margin:0 0 16px;">${scoreBadge}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      ${
        data.message
          ? `<div style="margin:20px 0;padding:16px;background:#f9fafb;border-left:4px solid #667eea;border-radius:8px;"><p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">MESSAGE</p><p style="margin:0;color:#1f2937;font-size:14px;white-space:pre-wrap;">${escapeHtml(data.message)}</p></div>`
          : ''
      }
      <div style="text-align:center;margin-top:24px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#667eea;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">View Lead in Dashboard →</a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:24px;text-align:center;color:#6b7280;font-size:13px;">
      <p style="margin:0;"><strong>AgentBio</strong> — respond fast to convert more leads.</p>
    </div>
  </div>
</body>
</html>`,
  }
}

// Template for lead auto-response email
export function createAutoResponseEmail(
  recipientEmail: string,
  name: string
): EmailOptions {
  return {
    to: recipientEmail,
    subject: 'Thank you for contacting us',
    body: `
Hi ${name},

Thank you for reaching out! We have received your message and one of our team members will get back to you shortly.

In the meantime, feel free to browse our website or follow us on social media for the latest updates.

Best regards,
The AgentBio Team
    `.trim(),
  }
}

/**
 * Agent notification for a review submitted from /:username/review (US-113).
 *
 * The review page's success screen has always told the visitor "{agent} will be
 * notified" — nothing sent anything. Reviews arrive unpublished by design
 * (20260808000004 forces is_published = false), so an agent who is never told
 * one exists never approves it, and the review is invisible forever.
 *
 * Every interpolated value is visitor-supplied, so all of it goes through
 * escapeHtml.
 */
export function createTestimonialNotificationEmail(data: {
  agentEmail: string
  clientName: string
  clientTitle?: string | null
  rating: number
  review: string
  transactionType?: string | null
  propertyType?: string | null
  dashboardUrl?: string
}): EmailOptions {
  const dashboardUrl =
    data.dashboardUrl ||
    `${getSiteUrl()}/dashboard/testimonials`

  const transaction =
    data.transactionType === 'both'
      ? 'Buyer & Seller'
      : data.transactionType === 'seller'
        ? 'Seller'
        : data.transactionType === 'buyer'
          ? 'Buyer'
          : undefined

  const stars = `${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}`

  const rows: Array<[string, string | undefined]> = [
    ['From', data.clientName],
    ['Title', data.clientTitle ?? undefined],
    ['Rating', `${data.rating} of 5`],
    ['Transaction', transaction],
    ['Property', data.propertyType ?? undefined],
  ]
  const rowsHtml = rows
    .filter(([, v]) => v)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:120px;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;">${escapeHtml(value)}</td></tr>`
    )
    .join('')

  return {
    to: data.agentEmail,
    subject: `New review from ${data.clientName} — awaiting your approval`,
    body: `${data.clientName} left you a ${data.rating}-star review.

${transaction ? `Transaction: ${transaction}\n` : ''}${data.propertyType ? `Property: ${data.propertyType}\n` : ''}
"${data.review}"

It is not visible on your profile yet. Approve or hide it here:
${dashboardUrl}

— AgentBio`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:#1f2937;color:#fff;padding:32px 30px;">
      <h1 style="margin:0;font-size:22px;font-weight:600;">New review from ${escapeHtml(data.clientName)}</h1>
      <p style="margin:8px 0 0;color:#fbbf24;font-size:18px;letter-spacing:2px;">${stars}</p>
    </div>
    <div style="background:#fff;padding:30px;">
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      <blockquote style="margin:20px 0;padding:16px;background:#f9fafb;border-radius:12px;color:#1f2937;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(data.review)}</blockquote>
      <p style="margin:0 0 20px;color:#4b5563;font-size:14px;">This review is waiting for you. It stays hidden from your public profile until you approve it.</p>
      <a href="${dashboardUrl}" style="display:inline-block;background:#1f2937;color:#fff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:600;">Review and publish →</a>
    </div>
    <div style="background:#f9fafb;padding:24px;text-align:center;color:#6b7280;font-size:13px;">
      <p style="margin:0;"><strong>AgentBio</strong></p>
    </div>
  </div>
</body>
</html>`,
  }
}
