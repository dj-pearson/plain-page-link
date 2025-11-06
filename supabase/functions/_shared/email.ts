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
