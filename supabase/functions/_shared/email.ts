// Shared email utility for Supabase Edge Functions
// Uses Resend API - you can swap for SendGrid or another provider

import { getSiteUrl } from './env.ts';

export interface EmailOptions {
  to: string
  subject: string
  body: string
  html?: string
  /**
   * Where a reply goes (US-229). Mail is sent from noreply@; without this a
   * lead answering the auto-reply wrote to nobody.
   */
  replyTo?: string
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
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
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
  /**
   * The lead is past the plan's monthly allowance (20260923000003): say a lead
   * arrived and who, but not how to reach them. Contact details and message
   * are dropped here, not merely hidden, so the email cannot leak them.
   */
  locked?: boolean
  upgradeUrl?: string
}): EmailOptions {
  if (data.locked) {
    data = { ...data, email: '', phone: undefined, message: undefined }
  }
  const listing = data.listing || 'your services'
  const dashboardUrl =
    data.dashboardUrl ||
    `${getSiteUrl()}/dashboard/leads`
  const scoreBadge =
    typeof data.leadScore === 'number'
      ? `<span style="display:inline-block;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:600;">Lead score: ${data.leadScore}</span>`
      : ''

  const upgradeUrl = data.upgradeUrl || `${getSiteUrl()}/dashboard/subscription`
  const lockedNotice = data.locked
    ? `You've reached this month's lead allowance on your plan. ${data.name}'s enquiry is saved, and their contact details unlock as soon as you upgrade (or when your allowance resets next month).`
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
    subject: data.locked
      ? `New Lead: ${data.name} — upgrade to see their contact details`
      : `New Lead: ${data.name} is interested in ${listing}`,
    body: `New lead captured on AgentBio:
${lockedNotice ? `\n${lockedNotice}\nUpgrade: ${upgradeUrl}\n` : ''}
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}${data.listing ? `Interested in: ${data.listing}\n` : ''}${data.sourcePage ? `Source page: ${data.sourcePage}\n` : ''}${typeof data.leadScore === 'number' ? `Lead score: ${data.leadScore}\n` : ''}${data.message ? `\nMessage:\n${data.message}\n` : ''}
View this lead: ${dashboardUrl}

— AgentBio`,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#764ba2 100%);color:#fff;padding:32px 30px;text-align:center;">
      <h1 style="margin:0;font-size:22px;font-weight:600;">🔔 New Lead Captured</h1>
      <p style="margin:8px 0 0;opacity:.95;font-size:15px;">${escapeHtml(data.name)} is interested in ${escapeHtml(listing)}</p>
    </div>
    <div style="background:#fff;padding:30px;">
      ${scoreBadge ? `<p style="margin:0 0 16px;">${scoreBadge}</p>` : ''}
      ${
        lockedNotice
          ? `<div style="margin:0 0 20px;padding:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;"><p style="margin:0 0 12px;color:#78350f;font-size:14px;">${escapeHtml(lockedNotice)}</p><a href="${upgradeUrl}" style="display:inline-block;background:#1f2937;color:#fff;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">See plans</a></div>`
          : ''
      }
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      ${
        data.message
          ? `<div style="margin:20px 0;padding:16px;background:#f9fafb;border-left:4px solid #4f46e5;border-radius:8px;"><p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">MESSAGE</p><p style="margin:0;color:#1f2937;font-size:14px;white-space:pre-wrap;">${escapeHtml(data.message)}</p></div>`
          : ''
      }
      <div style="text-align:center;margin-top:24px;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">View Lead in Dashboard →</a>
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

export interface LeadAutoReplyData {
  to: string
  leadName: string
  leadType: string
  agent: {
    name: string
    /** Where the lead's reply should land: the agent's display or account email. */
    replyTo?: string | null
    phone?: string | null
    photoUrl?: string | null
    calendlyUrl?: string | null
    profileUrl?: string | null
  }
  listing?: { address: string; url?: string | null } | null
}

const LEAD_TYPE_LABEL: Record<string, string> = {
  buyer: 'home search',
  seller: 'plans to sell',
  valuation: 'home valuation request',
  contact: 'message',
  open_house: 'visit to the open house',
}

/**
 * The auto-reply a lead receives (US-229).
 *
 * The first touch after an enquiry is the warmest one, and it used to be a
 * dead end: sent from noreply@ with no reply-to, saying "feel free to call me"
 * with no number, signed with a name only, in a purple-gradient template. Now
 * a reply reaches the agent, and the email carries their phone, photo, booking
 * link and — for a listing enquiry — the listing.
 *
 * Every interpolated value is either visitor- or agent-supplied, so all of it
 * is escaped; links are only ever http(s).
 */
export function createLeadAutoReply(data: LeadAutoReplyData): EmailOptions {
  const { agent, listing } = data
  const label = LEAD_TYPE_LABEL[data.leadType] ?? 'enquiry'
  const safeUrl = (u?: string | null) => (u && /^https?:\/\//i.test(u) ? u : null)
  const calendly = safeUrl(agent.calendlyUrl)
  const profile = safeUrl(agent.profileUrl)
  const listingUrl = safeUrl(listing?.url)
  const photo = safeUrl(agent.photoUrl)

  const opener =
    data.leadType === 'open_house'
      ? 'Thanks for stopping by the open house today. If you would like a second look, the disclosures, or a list of similar homes, just reply to this email.'
      : listing
        ? `Thanks for asking about ${listing.address}. I have your ${label} and will be in touch shortly.`
        : `Thanks for reaching out — I have your ${label} and will be in touch shortly.`

  const lines = [
    `Hi ${data.leadName},`,
    '',
    opener,
    '',
    'You can reply to this email to reach me directly.',
    agent.phone ? `Or call or text me at ${agent.phone}.` : '',
    calendly ? `Prefer to pick a time? ${calendly}` : '',
    listingUrl ? `The listing: ${listingUrl}` : '',
    '',
    agent.name,
    profile ?? '',
  ].filter((line, i, all) => line !== '' || (all[i - 1] ?? '') !== '')

  const e = escapeHtml
  const html = `<!DOCTYPE html>
<html lang="en"><body style="margin:0;padding:24px;background:#f6f5f2;font-family:Georgia,'Times New Roman',serif;color:#1f2933;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
    <p style="margin:0 0 16px;font-size:16px;">Hi ${e(data.leadName)},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">${e(opener)}</p>
    ${listing ? `<p style="margin:0 0 16px;font-size:15px;"><strong>${e(listing.address)}</strong>${listingUrl ? ` &middot; <a href="${e(listingUrl)}" style="color:#1d4ed8;">View the listing</a>` : ''}</p>` : ''}
    <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">Reply to this email to reach me directly${agent.phone ? `, or call or text <a href="tel:${e(agent.phone.replace(/[^0-9+]/g, ''))}" style="color:#1d4ed8;">${e(agent.phone)}</a>` : ''}.</p>
    ${calendly ? `<p style="margin:16px 0;"><a href="${e(calendly)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#1f2933;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;">Pick a time to talk</a></p>` : ''}
    <table role="presentation" style="margin-top:24px;border-top:1px solid #e5e7eb;padding-top:16px;width:100%;"><tr>
      ${photo ? `<td style="width:56px;vertical-align:top;"><img src="${e(photo)}" alt="" width="48" height="48" style="border-radius:50%;display:block;"></td>` : ''}
      <td style="vertical-align:top;font-family:Arial,sans-serif;font-size:14px;line-height:1.5;">
        <strong>${e(agent.name)}</strong>${agent.phone ? `<br>${e(agent.phone)}` : ''}${profile ? `<br><a href="${e(profile)}" style="color:#1d4ed8;">${e(profile.replace(/^https?:\/\//, ''))}</a>` : ''}
      </td>
    </tr></table>
  </div>
</body></html>`

  return {
    to: data.to,
    subject: data.leadType === 'open_house' ? 'Thanks for visiting today' : `Thanks for your ${label}`,
    body: lines.join('\n'),
    html,
    replyTo: agent.replyTo || undefined,
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
<html lang="en">
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
