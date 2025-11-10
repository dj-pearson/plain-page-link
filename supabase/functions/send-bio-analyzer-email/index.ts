import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

interface BioAnalyzerEmailData {
  analysisId: string
  email: string
  firstName: string
  market: string
  brokerage?: string
  score: number
  bioRewrites: string[]
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data: BioAnalyzerEmailData = await req.json()

    // Validate required fields
    if (!data.email || !data.firstName || !data.analysisId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Send Email #1 - Immediate delivery with bio rewrites
    await sendEmail({
      to: data.email,
      subject: `${data.firstName}, Your 3 Optimized Instagram Bios + Action Plan Inside`,
      body: getEmail1PlainText(data),
      html: getEmail1HTML(data)
    })

    // Record email sent
    await supabase
      .from('instagram_bio_email_sequences')
      .insert({
        email_capture_id: data.analysisId,
        sequence_number: 1,
        email_subject: `${data.firstName}, Your 3 Optimized Instagram Bios + Action Plan Inside`,
        sent_at: new Date().toISOString()
      })

    // Schedule remaining emails (will be picked up by cron job)
    await scheduleEmailSequence(supabase, data.analysisId, data.email, data.firstName, data.market, data.score)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Initial email sent and sequence scheduled'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-bio-analyzer-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function scheduleEmailSequence(
  supabase: any,
  captureId: string,
  email: string,
  firstName: string,
  market: string,
  score: number
) {
  const now = new Date()

  // Schedule emails 2-7 (will be sent by cron job)
  const schedules = [
    { day: 1, subject: "The Instagram bio mistake 73% of agents make" },
    { day: 2, subject: "Your Instagram profile as a 24/7 showing scheduler" },
    { day: 3, subject: `${firstName}, here's your 30-day Instagram content calendar` },
    { day: 5, subject: "Real data: What converts Instagram followers to clients" },
    { day: 6, subject: "Linktree vs AgentBio for real estate (honest comparison)" },
    { day: 7, subject: `${firstName}, final call: 20% off + free setup (expires tonight)` }
  ]

  for (const schedule of schedules) {
    await supabase
      .from('instagram_bio_email_sequences')
      .insert({
        email_capture_id: captureId,
        sequence_number: schedule.day + 1,
        email_subject: schedule.subject,
        sent_at: null // Will be set when sent by cron
      })
  }
}

function getEmail1PlainText(data: BioAnalyzerEmailData): string {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://agentbio.net'

  return `
Hi ${data.firstName},

Thanks for using the Instagram Bio Analyzer!

Your bio scored ${data.score}/100, and I've got your 3 professionally optimized versions ready.

YOUR OPTIMIZED BIOS:

Option 1 - Professional Authority:
${data.bioRewrites[0] || 'Your first optimized bio'}

Option 2 - Friendly Local Expert:
${data.bioRewrites[1] || 'Your second optimized bio'}

Option 3 - Problem-Solving Specialist:
${data.bioRewrites[2] || 'Your third optimized bio'}

QUICK IMPLEMENTATION CHECKLIST:
☐ Choose your favorite bio (or mix elements from each)
☐ Update your Instagram bio today
☐ Update your link to ${siteUrl}/${data.firstName.toLowerCase()}
☐ Post an announcement about your new optimized profile
☐ Track your results for 1-2 weeks

YOUR QUICK WIN:
Update your bio TODAY. Agents who implement within 24 hours see results within the first week.

WANT TO MAXIMIZE EVERY INSTAGRAM CLICK?
AgentBio gives you a professional link-in-bio built specifically for real estate agents:
→ Auto-updated listings from your MLS
→ Built-in lead capture forms (home valuations, buyer consultations)
→ Analytics to track what's working
→ QR codes for your business cards and flyers

Start Your Free 14-Day Trial: ${siteUrl}/auth/register

To your Instagram success,
The AgentBio Team

P.S. Reply to this email if you have questions about implementing your new bio!
  `.trim()
}

function getEmail1HTML(data: BioAnalyzerEmailData): string {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://agentbio.net'

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
    .content { padding: 40px 30px; }
    .score-badge { background: linear-gradient(135deg, #eef2ff 0%, #fce7f3 100%); border-left: 4px solid #9333ea; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center; }
    .score-number { font-size: 48px; font-weight: bold; color: #9333ea; margin: 0; }
    .bio-box { background: #f9fafb; border: 2px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .bio-label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 10px; }
    .bio-text { font-family: monospace; font-size: 14px; line-height: 1.8; color: #1f2937; white-space: pre-wrap; }
    .checklist { margin: 25px 0; }
    .checklist-item { padding: 12px; background: #f0fdf4; border-left: 3px solid #10b981; margin-bottom: 10px; border-radius: 4px; }
    .cta-box { background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; }
    .cta-box h3 { margin: 0 0 15px 0; font-size: 22px; }
    .cta-box ul { text-align: left; max-width: 400px; margin: 20px auto; }
    .cta-box li { margin-bottom: 8px; }
    .button { display: inline-block; background: white; color: #9333ea !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: 600; }
    .button:hover { background: #f3f4f6; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Your Optimized Instagram Bios Are Ready!</h1>
      <p>3 professionally rewritten versions + action plan</p>
    </div>

    <div class="content">
      <p>Hi ${data.firstName},</p>

      <p>Thanks for using the Instagram Bio Analyzer!</p>

      <div class="score-badge">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280; font-weight: 600;">YOUR EFFECTIVENESS SCORE</p>
        <div class="score-number">${data.score}/100</div>
      </div>

      <p>I've got your <strong>3 professionally optimized bio versions</strong> ready. Each is tailored to your market (${data.market}) and optimized for maximum lead conversion.</p>

      <h2 style="color: #9333ea; margin-top: 30px;">Your Optimized Bios:</h2>

      <div class="bio-box">
        <div class="bio-label">Option 1 - Professional Authority</div>
        <div class="bio-text">${data.bioRewrites[0] || 'Your first optimized bio'}</div>
      </div>

      <div class="bio-box">
        <div class="bio-label">Option 2 - Friendly Local Expert</div>
        <div class="bio-text">${data.bioRewrites[1] || 'Your second optimized bio'}</div>
      </div>

      <div class="bio-box">
        <div class="bio-label">Option 3 - Problem-Solving Specialist</div>
        <div class="bio-text">${data.bioRewrites[2] || 'Your third optimized bio'}</div>
      </div>

      <h3 style="color: #1f2937; margin-top: 35px;">Quick Implementation Checklist:</h3>

      <div class="checklist">
        <div class="checklist-item">✓ Choose your favorite bio (or mix elements from each)</div>
        <div class="checklist-item">✓ Update your Instagram bio today</div>
        <div class="checklist-item">✓ Update your link to ${siteUrl}/${data.firstName.toLowerCase()}</div>
        <div class="checklist-item">✓ Post an announcement about your new optimized profile</div>
        <div class="checklist-item">✓ Track your results for 1-2 weeks</div>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: 600; color: #92400e;">⚡ Your Quick Win:</p>
        <p style="margin: 8px 0 0 0; color: #78350f;">Update your bio TODAY. Agents who implement within 24 hours see results within the first week.</p>
      </div>

      <div class="cta-box">
        <h3>Want to Maximize Every Instagram Click?</h3>
        <p>AgentBio gives you a professional link-in-bio built specifically for real estate agents:</p>
        <ul>
          <li>→ Auto-updated listings from your MLS</li>
          <li>→ Built-in lead capture forms</li>
          <li>→ Analytics to track what's working</li>
          <li>→ QR codes for offline marketing</li>
        </ul>
        <a href="${siteUrl}/auth/register" class="button">
          Start Your Free 14-Day Trial
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        <strong>P.S.</strong> Reply to this email if you have questions about implementing your new bio!
      </p>

      <p style="margin-top: 25px;">To your Instagram success,<br><strong>The AgentBio Team</strong></p>
    </div>

    <div class="footer">
      <p><strong>AgentBio</strong> - Link-in-Bio for Real Estate Agents</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${siteUrl}" style="color: #9333ea; text-decoration: none;">Visit AgentBio</a> •
        <a href="${siteUrl}/tools/instagram-bio-analyzer" style="color: #9333ea; text-decoration: none;">Bio Analyzer</a> •
        <a href="${siteUrl}/blog" style="color: #9333ea; text-decoration: none;">Blog</a>
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px;">
        You received this email because you used our Instagram Bio Analyzer tool.
      </p>
    </div>
  </div>
</body>
</html>
  `
}
