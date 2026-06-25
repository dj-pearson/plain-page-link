// Shared email utility for Supabase Edge Functions
// Uses Resend API - you can swap for SendGrid or another provider

interface EmailOptions {
  to: string
  subject: string
  body: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set, skipping email')
    return
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
        html: options.html || `<p>${options.body.replace(/\n/g, '<br>')}</p>`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to send email:', error)
      throw new Error('Email sending failed')
    }

    console.log('Email sent successfully to:', options.to)
  } catch (error) {
    console.error('Error sending email:', error)
    // Don't throw - email is nice to have but shouldn't break the main flow
  }
}

// Template for agent notification email
export function createAgentNotificationEmail(data: {
  name: string
  email: string
  phone?: string
  message?: string
  type: string
}): EmailOptions {
  return {
    to: Deno.env.get('AGENT_EMAIL') ?? '',
    subject: `New ${data.type} from ${data.name}`,
    body: `
You have received a new ${data.type} submission:

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.message ? `\nMessage:\n${data.message}` : ''}

---
Sent from AgentBio.net
    `.trim(),
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
    `${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard/leads`
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
        `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;width:120px;">${label}</td><td style="padding:6px 0;color:#1f2937;font-size:14px;font-weight:600;">${value}</td></tr>`
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
      <p style="margin:8px 0 0;opacity:.95;font-size:15px;">${data.name} is interested in ${listing}</p>
    </div>
    <div style="background:#fff;padding:30px;">
      ${scoreBadge ? `<p style="margin:0 0 16px;">${scoreBadge}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
      ${
        data.message
          ? `<div style="margin:20px 0;padding:16px;background:#f9fafb;border-left:4px solid #667eea;border-radius:8px;"><p style="margin:0 0 6px;color:#6b7280;font-size:13px;font-weight:600;">MESSAGE</p><p style="margin:0;color:#1f2937;font-size:14px;white-space:pre-wrap;">${data.message}</p></div>`
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
