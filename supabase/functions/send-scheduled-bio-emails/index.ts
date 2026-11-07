import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { isServiceRoleRequest } from '../_shared/service-auth.ts';
import { getSiteUrl } from '../_shared/env.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { sendEmail } from '../_shared/email.ts'
import { maskEmail } from '../_shared/log-redaction.ts'
import { getCorsHeaders } from '../_shared/cors.ts'
import { safeHtmlText } from '../_shared/public-email.ts';
import { BIO_DRIP_DAY, BIO_DRIP_SEQUENCE_NUMBERS, bioDripEmail, type BioDripSequenceNumber } from '../_shared/bio-drip-emails.ts';

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


    // US-078: scheduled job. Only the scheduler, which calls with the
    // service-role key, should be able to drive a batch of email sends.
    if (!isServiceRoleRequest(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
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

      // The earliest email that is due and not yet sent.
      const sequenceToSend: BioDripSequenceNumber | undefined = BIO_DRIP_SEQUENCE_NUMBERS.find(
        (n) => daysSinceCapture >= BIO_DRIP_DAY[n] && !sentNumbers.includes(n)
      )

      if (sequenceToSend !== undefined) {
        try {
          const emailContent = bioDripEmail(sequenceToSend, {
            firstName: safeHtmlText(capture.first_name, 100), // visitor-written (US-219)
            market: safeHtmlText(capture.market, 100),
            score: capture.instagram_bio_analyses?.overall_score || 0,
            siteUrl: getSiteUrl(),
          })

          // US-415: this used to send with `to: ''` ("Will be set by caller" —
          // it never was) and mark the email sent whatever sendEmail reported,
          // so a capture's sequence would be recorded as delivered while
          // nothing left the building.
          const result = await sendEmail({ to: capture.email, ...emailContent })
          if (!result.ok) {
            throw new Error(result.error ?? 'send failed')
          }

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
          console.error(`Failed to send email ${sequenceToSend} to capture ${capture.id} (${maskEmail(capture.email)}):`, error)
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
