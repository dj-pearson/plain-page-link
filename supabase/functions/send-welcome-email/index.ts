import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

interface WelcomeEmailData {
  user_id: string
  email: string
  full_name?: string
  username: string
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const data: WelcomeEmailData = await req.json()

    // Validate required fields
    if (!data.email || !data.username) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userName = data.full_name || data.username
    const profileUrl = `${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/${data.username}`

    // Send welcome email
    await sendEmail({
      to: data.email,
      subject: '🎉 Welcome to AgentBio! Your Profile is Ready',
      body: `Hi ${userName},

Welcome to AgentBio! Your professional real estate portfolio is now live and ready to share.

Your Profile URL:
${profileUrl}

Here's what you can do next:

1. Add Your Instagram Bio Link
   Share your AgentBio profile on Instagram, Facebook, and all your social media.

2. Upload Your Sold Properties
   Showcase your track record with before/after photos and success stories.

3. Customize Your Theme
   Match your personal brand with custom colors, fonts, and layouts.

4. Add More Listings
   Feature your active listings with photos, prices, and details.

5. Set Up Lead Capture
   Your buyer, seller, and home valuation forms are ready to capture qualified leads.

Need Help?
- Check out our video tutorials
- Join our agent community
- Contact support: support@agentbio.net

Ready to start? Visit your dashboard:
${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard

Best regards,
The AgentBio Team

P.S. Share your first listing today and see how AgentBio helps you convert Instagram followers into clients!`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
    .content { background: #ffffff; padding: 40px 30px; }
    .profile-box { background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .profile-url { font-size: 18px; font-weight: 600; color: #667eea; word-break: break-all; }
    .steps { margin: 30px 0; }
    .step { margin-bottom: 20px; padding-left: 35px; position: relative; }
    .step-number { position: absolute; left: 0; top: 0; width: 24px; height: 24px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; }
    .step h3 { margin: 0 0 5px 0; font-size: 16px; color: #1f2937; }
    .step p { margin: 0; font-size: 14px; color: #6b7280; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .button:hover { background: #5568d3; }
    .help-section { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .footer { background: #f9fafb; padding: 30px; text-align: center; font-size: 14px; color: #6b7280; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to AgentBio!</h1>
      <p>Your professional real estate portfolio is live</p>
    </div>

    <div class="content">
      <p>Hi ${userName},</p>

      <p>Welcome to AgentBio! Your professional real estate portfolio is now <strong>live and ready to share</strong> with potential clients.</p>

      <div class="profile-box">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">YOUR PROFILE URL</p>
        <div class="profile-url">${profileUrl}</div>
      </div>

      <p>Here's what you can do to make the most of your AgentBio profile:</p>

      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <h3>📱 Add to Instagram Bio</h3>
          <p>Replace your current link with your AgentBio URL and start converting followers into clients.</p>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <h3>🏡 Upload Sold Properties</h3>
          <p>Showcase your track record with photos and success stories to build trust with potential clients.</p>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <h3>🎨 Customize Your Theme</h3>
          <p>Match your personal brand with custom colors, fonts, and professional layouts.</p>
        </div>

        <div class="step">
          <div class="step-number">4</div>
          <h3>📋 Add Active Listings</h3>
          <p>Feature your current properties with photos, prices, and all the details buyers need.</p>
        </div>

        <div class="step">
          <div class="step-number">5</div>
          <h3>📊 Monitor Your Analytics</h3>
          <p>Track profile views, link clicks, and lead sources to optimize your marketing.</p>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard" class="button">
          Go to Your Dashboard →
        </a>
      </div>

      <div class="help-section">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">Need Help?</p>
        <p style="margin: 0; font-size: 14px; color: #6b7280;">
          • Check out our <a href="${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/blog" style="color: #667eea;">video tutorials</a><br>
          • Join our agent community<br>
          • Email us: <a href="mailto:support@agentbio.net" style="color: #667eea;">support@agentbio.net</a>
        </p>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        <strong>P.S.</strong> Share your first listing today and see how AgentBio helps you convert Instagram followers into clients!
      </p>

      <p>Best regards,<br><strong>The AgentBio Team</strong></p>
    </div>

    <div class="footer">
      <p><strong>AgentBio</strong> - Link-in-Bio for Real Estate Agents</p>
      <p style="margin: 10px 0 0 0;">
        <a href="${profileUrl}">View Your Profile</a> •
        <a href="${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/dashboard">Dashboard</a> •
        <a href="${Deno.env.get('SITE_URL') || 'https://agentbio.net'}/blog">Blog</a>
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px;">
        This email was sent because you created an account at AgentBio.net
      </p>
    </div>
  </div>
</body>
</html>`
    })

    return new Response(
      JSON.stringify({ success: true, message: 'Welcome email sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
