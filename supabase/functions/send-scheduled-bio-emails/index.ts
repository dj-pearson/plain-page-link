import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail } from '../_shared/email.ts'
import { getCorsHeaders } from '../_shared/cors.ts'

/**
 * Cron job to send scheduled Instagram Bio Analyzer emails
 * Run daily to check for emails that need to be sent
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get email captures from last 7 days that need sequences sent
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { data: captures, error: capturesError } = await supabase
      .from('instagram_bio_email_captures')
      .select(`
        *,
        instagram_bio_analyses(
          result_data,
          overall_score
        )
      `)
      .gte('created_at', sevenDaysAgo.toISOString())
      .eq('email_sequence_started', true)
      .eq('email_sequence_completed', false)

    if (capturesError) throw capturesError

    let emailsSent = 0

    for (const capture of captures || []) {
      // Check which emails need to be sent
      const daysSinceCapture = Math.floor(
        (Date.now() - new Date(capture.created_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Get already sent emails
      const { data: sentEmails } = await supabase
        .from('instagram_bio_email_sequences')
        .select('sequence_number')
        .eq('email_capture_id', capture.id)
        .not('sent_at', 'is', null)

      const sentNumbers = sentEmails?.map(e => e.sequence_number) || []

      // Determine which email to send based on days since capture
      let sequenceToSend = 0
      if (daysSinceCapture >= 1 && !sentNumbers.includes(2)) sequenceToSend = 2
      else if (daysSinceCapture >= 2 && !sentNumbers.includes(3)) sequenceToSend = 3
      else if (daysSinceCapture >= 3 && !sentNumbers.includes(4)) sequenceToSend = 4
      else if (daysSinceCapture >= 5 && !sentNumbers.includes(5)) sequenceToSend = 5
      else if (daysSinceCapture >= 6 && !sentNumbers.includes(6)) sequenceToSend = 6
      else if (daysSinceCapture >= 7 && !sentNumbers.includes(7)) sequenceToSend = 7

      if (sequenceToSend > 0) {
        try {
          const emailContent = getEmailTemplate(
            sequenceToSend,
            capture.first_name,
            capture.market,
            capture.instagram_bio_analyses?.overall_score || 0
          )

          await sendEmail(emailContent)

          // Mark as sent
          await supabase
            .from('instagram_bio_email_sequences')
            .update({ sent_at: new Date().toISOString() })
            .eq('email_capture_id', capture.id)
            .eq('sequence_number', sequenceToSend)

          emailsSent++

          // If email 7 sent, mark sequence as complete
          if (sequenceToSend === 7) {
            await supabase
              .from('instagram_bio_email_captures')
              .update({ email_sequence_completed: true })
              .eq('id', capture.id)
          }
        } catch (error) {
          console.error(`Failed to send email ${sequenceToSend} to ${capture.email}:`, error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${emailsSent} scheduled emails`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-scheduled-bio-emails function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function getEmailTemplate(
  sequenceNumber: number,
  firstName: string,
  market: string,
  score: number
): { to: string; subject: string; body: string; html: string } {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://agentbio.net'

  const templates: Record<number, any> = {
    2: {
      subject: "The Instagram bio mistake 73% of agents make",
      body: `Hey ${firstName},

Yesterday you analyzed your Instagram bio and discovered it scored ${score}/100.

Here's something interesting: 73% of the ${market} agents I've analyzed make the SAME critical mistake.

They're using generic phrases like:
→ "Helping you find your dream home"
→ "Making dreams come true"
→ "Your local real estate expert"

The problem? These phrases are invisible. Your brain skips right over them.

What top performers do instead:
→ Use specific numbers: "Sold 200+ homes in ${market}"
→ Highlight unique expertise: "Former architect turned realtor"
→ Show proof: "Avg. 18 days to close"

How AgentBio Fixes This:
Your link-in-bio can show dynamic proof:
→ Live listing count
→ Recent sales
→ Client testimonials that update automatically

See How AgentBio Works: ${siteUrl}/pricing

P.S. Your competitors in ${market} are already optimizing. Don't get left behind.`,
      html: `<p>Hey ${firstName},</p><p>Yesterday you analyzed your bio (${score}/100)...</p><p><a href="${siteUrl}/pricing">See How AgentBio Works</a></p>`
    },
    3: {
      subject: "Your Instagram profile as a 24/7 showing scheduler",
      body: `${firstName},

Quick question: How many Instagram followers have actually become paying clients?

Most ${market} agents treat Instagram as brand-building, not lead generation.

But here's what's possible:
Agents get 12-15 qualified leads per month from Instagram with the right strategy.

The secret? A strategic link-in-bio that converts.

Build Your High-Converting Profile: ${siteUrl}/auth/register

Best,
The AgentBio Team`,
      html: `<p>${firstName},</p><p>How many followers became clients?</p><p><a href="${siteUrl}/auth/register">Build Your Profile</a></p>`
    },
    4: {
      subject: `${firstName}, here's your 30-day Instagram content calendar`,
      body: `Hi ${firstName},

"What should I post?" is the #1 question I hear from agents.

I'm sending you a ready-to-use content calendar with 30 days of proven post ideas.

Pro tip: Track which content drives the most link clicks.

AgentBio shows you exactly which posts convert.

Try AgentBio Free for 14 Days: ${siteUrl}/auth/register

To your success,
The AgentBio Team`,
      html: `<p>Hi ${firstName},</p><p>30-day content calendar ready!</p><p><a href="${siteUrl}/auth/register">Try AgentBio Free</a></p>`
    },
    5: {
      subject: "Real data: What converts Instagram followers to clients",
      body: `${firstName},

I analyzed data from 2,847 real estate agents using Instagram.

Average Agent: ~7 leads/month
Top Performer: ~45 leads/month

The difference isn't follower count. It's conversion optimization.

Your current bio scored ${score}/100.

If below 70, you're losing 40-60% of potential leads.

AgentBio optimizes all conversion points.

See How AgentBio Works: ${siteUrl}/pricing

Data-driven success,
The AgentBio Team`,
      html: `<p>${firstName},</p><p>Top performers get 45 leads/month from Instagram.</p><p><a href="${siteUrl}/pricing">See How</a></p>`
    },
    6: {
      subject: "Linktree vs AgentBio for real estate (honest comparison)",
      body: `${firstName},

You asked: "Why use AgentBio instead of Linktree?"

Linktree Pro: $9/month
→ Generic platform
→ No real estate features

AgentBio: $29/month
→ Built for real estate
→ MLS integration
→ Lead capture
→ Advanced analytics

The Real Question:
How much is one extra deal worth?

Average commission: $9,000
AgentBio cost per year: $348
ROI if you close ONE deal: 2,500%

Try AgentBio Free: ${siteUrl}/auth/register

Best,
The AgentBio Team`,
      html: `<p>${firstName},</p><p>Honest comparison: Linktree vs AgentBio</p><p><a href="${siteUrl}/auth/register">Try AgentBio Free</a></p>`
    },
    7: {
      subject: `${firstName}, final call: 20% off + free setup (expires tonight)`,
      body: `${firstName},

A week ago, your Instagram bio scored ${score}/100.

You got your optimized bios. Maybe you implemented one.

The real opportunity is in what happens AFTER the bio click.

SPECIAL OFFER (Expires Tonight):
→ 20% off first 3 months ($23/month instead of $29)
→ Free professional setup call
→ Custom QR code design
→ Priority support

Risk-Free: 14-day free trial, cancel anytime

Claim Your 20% Discount: ${siteUrl}/auth/register?coupon=BIO20

This offer expires tonight at midnight.

Your Instagram has potential. Let's unlock it.

To your success,
The AgentBio Team

P.S. Your competitors in ${market} are already optimizing. Every day you wait is a day of lost leads.`,
      html: `<p>${firstName},</p><h2>Final Call: 20% Off + Free Setup</h2><p>Expires tonight!</p><p><a href="${siteUrl}/auth/register?coupon=BIO20">Claim Your Discount</a></p>`
    }
  }

  return {
    to: '', // Will be set by caller
    ...templates[sequenceNumber]
  }
}
