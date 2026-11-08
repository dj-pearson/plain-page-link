/**
 * Supabase Edge Function: Send Scheduled Listing Emails
 * Cron job that sends emails 2-7 of the nurture sequence
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { isServiceRoleRequest } from '../_shared/service-auth.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';
import { getFunctionsUrl, getSiteUrl } from '../_shared/env.ts';
import {
  isSuppressed,
  unsubscribeFooterHtml,
  unsubscribeHeaders,
  unsubscribeLinks,
  unsubscribeSecret,
  type UnsubscribeLinks,
} from '../_shared/marketing-unsubscribe.ts';
import { safeHtmlText } from '../_shared/public-email.ts';
import { maskEmail } from '../_shared/log-redaction.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@agentbio.net';
const SITE_URL = getSiteUrl();
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Email sequence schedule (days after capture).
//
// US-415: the copy below used to include "73% of real estate agents make the
// same listing description mistake", "We analyzed 47,000 real estate listings"
// with "23% fewer showings", "31% more inquiries" and "2.4x more responses", a
// named testimonial ("AgentBio saves me 8-10 hours per week" over "Jennifer M.,
// Top 1% Agent, Austin"), "4,200+ agents trust AgentBio", a "$97 value"
// templates pack that does not exist, "Unlimited AI listing descriptions"
// (plans meter them monthly) and "20% off ... expires tonight" / "in 12 hours"
// with coupon LISTING20, which exists in no Stripe account and which the
// register page never reads. None of it was measured or real. Every CTA also
// pointed at /register, which is a reserved username: it rendered the 404 page.
// src/marketing-claims.test.ts now scans this file.
const EMAIL_SCHEDULE = {
  2: { subject: 'The most common listing description mistake', dayNumber: 1 },
  3: { subject: 'Power words that make buyers take action', dayNumber: 2 },
  4: { subject: 'How to choose the right description style for your listing', dayNumber: 3 },
  6: { subject: 'Four things to check before your listing goes live', dayNumber: 5 },
  7: { subject: 'Your listing checklist: Beyond the description', dayNumber: 6 },
  8: { subject: 'What AgentBio does with the listings you write', dayNumber: 7 },
};

const REGISTER_URL = `${SITE_URL}/auth/register`;

function ctaButton(label: string): string {
  return `<p style="text-align: center; margin-top: 40px;">
        <a href="${REGISTER_URL}" style="background: #6d28d9; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600;">
          ${label}
        </a>
      </p>`;
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // US-078: scheduled job. Only the scheduler, which calls with the
    // service-role key, should be able to drive a batch of email sends.
    if (!isServiceRoleRequest(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // US-425: no marketing email without a working opt-out.
    const secret = unsubscribeSecret();
    if (!secret) {
      throw new Error('PII_ENCRYPTION_KEY is not set; refusing to send drip email without an unsubscribe link');
    }

    // Get pending emails from database function
    const { data: pendingEmails, error: queryError } = await supabase.rpc('get_pending_listing_emails');

    if (queryError) {
      throw new Error(`Database query error: ${queryError.message}`);
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ message: 'No pending emails to send', sent: 0 }), {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      });
    }

    let sentCount = 0;
    const errors = [];

    // Process each pending email
    for (const capture of pendingEmails) {
      const daysSinceCapture = capture.days_since_capture;
      const scheduleInfo = EMAIL_SCHEDULE[daysSinceCapture];

      if (!scheduleInfo) continue;

      try {
        // US-425: an address that opted out (from either tool) gets nothing
        // more, and its sequence is ended so it is not picked up again.
        if (await isSuppressed(supabase, String(capture.email), secret)) {
          await supabase
            .from('listing_email_captures')
            .update({ email_sequence_completed: true })
            .eq('id', capture.id);
          continue;
        }

        const unsubscribe = await unsubscribeLinks('listing', capture.id, secret, {
          siteUrl: SITE_URL,
          functionsUrl: getFunctionsUrl(),
        });

        // Send email via Resend
        const emailSent = await sendSequenceEmail({
          unsubscribe,
          email: capture.email,
          firstName: safeHtmlText(capture.first_name, 100), // visitor-written (US-219)
          sequenceNumber: scheduleInfo.dayNumber,
          subject: scheduleInfo.subject,
          captureId: capture.id,
        });

        if (emailSent) {
          // Mark email as sent in database
          await supabase
            .from('listing_email_sequences')
            .update({
              sent_at: new Date().toISOString(),
            })
            .eq('email_capture_id', capture.id)
            .eq('sequence_number', scheduleInfo.dayNumber);

          // Update last_email_sent_at on capture
          await supabase
            .from('listing_email_captures')
            .update({
              last_email_sent_at: new Date().toISOString(),
            })
            .eq('id', capture.id);

          sentCount++;

          // If this was email 7, mark sequence as complete
          if (scheduleInfo.dayNumber === 7) {
            await supabase
              .from('listing_email_captures')
              .update({
                email_sequence_completed: true,
              })
              .eq('id', capture.id);
          }
        }
      } catch (error) {
        console.error(`Error sending email to capture ${capture.id} (${maskEmail(capture.email)}):`, error);
        errors.push({ captureId: capture.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        total: pendingEmails.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      }
    );
  } catch (error) {
    console.error('Error in scheduled email function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send scheduled emails',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) },
      }
    );
  }
});

async function sendSequenceEmail(data: {
  unsubscribe: UnsubscribeLinks;
  email: string;
  firstName: string;
  sequenceNumber: number;
  subject: string;
  captureId: string;
}): Promise<boolean> {
  try {
    const emailHTML =
      getSequenceEmailHTML(data.sequenceNumber, data.firstName) +
      `<div style="max-width: 600px; margin: 0 auto; padding: 0 20px 20px;">${unsubscribeFooterHtml(
        data.unsubscribe,
        "You're receiving this because you used AgentBio's listing description generator."
      )}</div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AgentBio <${FROM_EMAIL}>`,
        to: [data.email],
        subject: data.subject,
        html: emailHTML,
        headers: unsubscribeHeaders(data.unsubscribe),
      }),
    });

    if (!response.ok) {
      console.error('Resend API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error calling Resend API:', error);
    return false;
  }
}

function getSequenceEmailHTML(sequenceNumber: number, firstName: string): string {
  const baseStyles = `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;`;

  const emails = {
    1: `<!-- Email 1: Common Mistake -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">Hey ${firstName},</h2>

      <p>Yesterday you generated 3 listing descriptions with our AI tool. I wanted to share something important...</p>

      <p><strong>The most common listing description mistake:</strong></p>

      <p style="background: #fef3f9; border-left: 4px solid #ec4899; padding: 20px; margin: 20px 0;">
        They list <em>features</em> instead of painting <em>experiences</em>.
      </p>

      <p>Example:</p>
      <p style="color: #dc2626;">❌ "3 bedroom, 2 bath home with updated kitchen"</p>
      <p style="color: #16a34a;">✅ "Imagine Sunday mornings in your chef's kitchen, sunlight streaming through new windows as your family gathers around the granite island"</p>

      <p>The second version triggers emotion. And emotion drives offers.</p>

      <p><strong>Here's your action item:</strong> Go back to your 3 generated descriptions. Notice how each one creates a <em>feeling</em> before listing features. That's intentional.</p>

      <p>Tomorrow, I'll share the power words that make buyers stop scrolling and start calling.</p>

      <p>Talk soon,<br>The AgentBio Team</p>

      ${ctaButton('Create Your Free Page')}
    </div>`,

    2: `<!-- Email 2: Power Words -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">${firstName}, 7 words worth using in your next listing</h2>

      <p>Quick question: What's the difference between these two descriptions?</p>

      <div style="background: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0;"><strong>Version A:</strong> "Nice home in good neighborhood"</p>
      </div>

      <div style="background: #ecfdf5; padding: 15px; margin: 20px 0; border-radius: 8px; border: 2px solid #10b981;">
        <p style="margin: 0;"><strong>Version B:</strong> "Stunning home in coveted neighborhood"</p>
      </div>

      <p>Same meaning. But Version B triggers <strong>FOMO</strong> (Fear of Missing Out).</p>

      <p><strong>The 7 power words every listing needs:</strong></p>

      <ol style="line-height: 2;">
        <li><strong>Stunning</strong> - Creates instant visual appeal</li>
        <li><strong>Coveted</strong> - Implies scarcity and desirability</li>
        <li><strong>Thoughtfully</strong> - Suggests care and quality</li>
        <li><strong>Seamlessly</strong> - Indicates perfect flow and function</li>
        <li><strong>Meticulously</strong> - Communicates attention to detail</li>
        <li><strong>Bespoke</strong> - For luxury listings (unique, custom)</li>
        <li><strong>Opportunity</strong> - For investment properties</li>
      </ol>

      <p>Look back at your AI-generated descriptions and count how many of these appear. That's deliberate.</p>

      <p>Tomorrow: How to choose which style to use for YOUR specific listing.</p>

      <p>- The AgentBio Team</p>

      ${ctaButton('Create Your Free Page')}
    </div>`,

    3: `<!-- Email 3: Choosing Style -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">${firstName}, here's how to pick the right style</h2>

      <p>You generated 3 description styles: Luxury, Family-Friendly, and Investment.</p>

      <p>But which one should you actually use?</p>

      <p><strong>Here's my simple decision tree:</strong></p>

      <div style="background: #faf5ff; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #9333ea;">
        <h3 style="margin-top: 0; color: #9333ea;">Use LUXURY style when:</h3>
        <ul>
          <li>Price is above neighborhood average by 20%+</li>
          <li>High-end finishes (marble, custom cabinets, smart home)</li>
          <li>Targeting executives, professionals, affluent buyers</li>
          <li>Gated community, golf course, or prestige location</li>
        </ul>
      </div>

      <div style="background: #fef3f9; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ec4899;">
        <h3 style="margin-top: 0; color: #ec4899;">Use FAMILY-FRIENDLY style when:</h3>
        <ul>
          <li>3+ bedrooms, yard, family-oriented neighborhood</li>
          <li>Near good schools, parks, family amenities</li>
          <li>Targeting young families, first-time buyers, parents</li>
          <li>Safe street, cul-de-sac, playground nearby</li>
        </ul>
      </div>

      <div style="background: #f0fdf4; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #059669;">Use INVESTMENT style when:</h3>
        <ul>
          <li>Multi-family, duplex, triplex, or rental property</li>
          <li>Fixer-upper with appreciation potential</li>
          <li>Targeting investors, flippers, landlords</li>
          <li>Strong rental market or cash flow opportunity</li>
        </ul>
      </div>

      <p><strong>Pro tip:</strong> Test different styles on different channels. Use Luxury for your email list, Family-Friendly on Facebook, Investment on LinkedIn.</p>

      <p>Tomorrow: four things to check before your listing goes live.</p>

      <p>- The AgentBio Team</p>

      ${ctaButton('Create Your Free Page')}
    </div>`,

    5: `<!-- Email 5: Pre-launch checks -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">${firstName}, four things to check before your listing goes live</h2>

      <p>Before you paste a description into the MLS, read it once more against this list:</p>

      <ol style="line-height: 1.8;">
        <li><strong>Length.</strong> Long enough to say what makes the home different, short enough that the first two sentences carry it. Many portals cut the preview off early.</li>
        <li><strong>A picture, not a spec sheet.</strong> Beds and baths are already in the listing fields. Use the description for what it feels like to live there.</li>
        <li><strong>Specific, checkable details.</strong> "Walk to the farmers market" beats "great location". Leave out anything you cannot stand behind, and anything fair-housing rules prohibit.</li>
        <li><strong>A clear next step.</strong> End with what you want the reader to do: "Schedule a private showing" or "Ask for the disclosure package".</li>
      </ol>

      <p>Your AI-generated descriptions were written with all four in mind, but you know the home. Edit freely.</p>

      <p>Tomorrow: your complete listing checklist, beyond the description.</p>

      <p>- The AgentBio Team</p>

      ${ctaButton('Create Your Free Page')}
    </div>`,

    6: `<!-- Email 6: Complete Checklist -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">${firstName}, your listing success checklist</h2>

      <p>A great description is just one piece of the puzzle.</p>

      <p>Here's the complete checklist for getting your listing in front of the right buyers:</p>

      <div style="background: #faf5ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">✅ Before You List</h3>
        <ul>
          <li>✓ Professional photos (24-32 images minimum)</li>
          <li>✓ Virtual tour or video walkthrough</li>
          <li>✓ Compelling description (you already have this!)</li>
          <li>✓ Accurate pricing based on comps</li>
          <li>✓ Staging recommendations completed</li>
        </ul>
      </div>

      <div style="background: #fef3f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">📱 Day 1 Marketing Blitz</h3>
        <ul>
          <li>✓ MLS listing with your AI description</li>
          <li>✓ Instagram post + Stories (use your AI caption)</li>
          <li>✓ Facebook post to your business page</li>
          <li>✓ Email to your buyer database</li>
          <li>✓ SMS to qualified leads (use your AI snippet)</li>
          <li>✓ LinkedIn post to professional network</li>
        </ul>
      </div>

      <div style="background: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0;">🎯 Week 1 Follow-Up</h3>
        <ul>
          <li>✓ Schedule open house(s)</li>
          <li>✓ Retarget engaged leads with additional content</li>
          <li>✓ Post client testimonials about the property</li>
          <li>✓ Share neighborhood highlights and local amenities</li>
          <li>✓ Follow up with showing requests within 2 hours</li>
        </ul>
      </div>

      <p><strong>The hardest part?</strong> Staying consistent with content creation across all channels.</p>

      <p>That's what AgentBio is for: every listing gets a place on your link-in-bio page, with a lead form beside it, and paid plans include AI-written descriptions each month.</p>

      <p>Tomorrow: one last email, then this series ends.</p>

      <p>- The AgentBio Team</p>

      ${ctaButton('Put Your Listings on AgentBio')}
    </div>`,

    7: `<!-- Email 7: What AgentBio does -->
    <div style="${baseStyles}">
      <p>Hi ${firstName},</p>

      <p>Over the past week we've covered:</p>
      <ul>
        <li>Writing descriptions that describe an experience, not a spec sheet</li>
        <li>Seven words worth using</li>
        <li>Choosing the right style for the home</li>
        <li>Four checks before a listing goes live</li>
        <li>A listing checklist beyond the description</li>
      </ul>

      <p>A description does its job once a buyer reads it. AgentBio gives you somewhere to put the listing where they can act on it:</p>

      <ul>
        <li>A link-in-bio page with your active and sold listings</li>
        <li>A page for each listing, with a lead form beside it</li>
        <li>An email to you the moment a lead comes in</li>
        <li>Analytics on page views, link clicks and lead sources</li>
        <li>AI listing descriptions each month on paid plans</li>
      </ul>

      <p>You can set it up on the free plan and upgrade only if it earns its keep. The plans, and what each includes, are at <a href="${SITE_URL}/pricing" style="color: #6d28d9;">agentbio.net/pricing</a>.</p>

      ${ctaButton('Create My Free Page')}

      <p style="margin-top: 40px;">This is the last email in this series.</p>

      <p>To your success,<br>The AgentBio Team</p>

      <p style="font-size: 12px; color: #6b7280; margin-top: 40px;">P.S. Questions? Hit reply.</p>
    </div>`,
  };

  return emails[sequenceNumber] || `<p>Email content for sequence ${sequenceNumber}</p>`;
}
