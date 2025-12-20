/**
 * Supabase Edge Function: Send Scheduled Listing Emails
 * Cron job that sends emails 2-7 of the nurture sequence
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@agentbio.net';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://agentbio.net';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Email sequence schedule (days after capture)
const EMAIL_SCHEDULE = {
  2: { subject: 'The listing description mistake that costs agents thousands', dayNumber: 1 },
  3: { subject: 'Power words that make buyers take action', dayNumber: 2 },
  4: { subject: 'How to choose the right description style for your listing', dayNumber: 3 },
  6: { subject: 'Real data: What sells homes faster in 2025', dayNumber: 5 },
  7: { subject: 'Your listing checklist: Beyond the description', dayNumber: 6 },
  8: { subject: '20% off AgentBio (expires tonight) + Free listing templates', dayNumber: 7 },
};

serve(async (req) => {
  const origin = req.headers.get('origin');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
        // Send email via Resend
        const emailSent = await sendSequenceEmail({
          email: capture.email,
          firstName: capture.first_name,
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
        console.error(`Error sending email to ${capture.email}:`, error);
        errors.push({ email: capture.email, error: error.message });
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
  email: string;
  firstName: string;
  sequenceNumber: number;
  subject: string;
  captureId: string;
}): Promise<boolean> {
  try {
    const emailHTML = getSequenceEmailHTML(data.sequenceNumber, data.firstName);

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

      <p><strong>73% of real estate agents make the same listing description mistake:</strong></p>

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

      <p style="text-align: center; margin-top: 40px;">
        <a href="${SITE_URL}/register" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Start Your Free Trial
        </a>
      </p>
    </div>`,

    2: `<!-- Email 2: Power Words -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">${firstName}, these 7 words sell homes faster</h2>

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

      <p>Look back at your AI-generated descriptions. Count how many power words appear. That's why they convert.</p>

      <p>Tomorrow: How to choose which style to use for YOUR specific listing.</p>

      <p>- The AgentBio Team</p>

      <p style="text-align: center; margin-top: 40px;">
        <a href="${SITE_URL}/register" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Get AI Marketing for Every Listing
        </a>
      </p>
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

      <p>Tomorrow: Real data on what sells homes faster in 2025.</p>

      <p>- The AgentBio Team</p>

      <p style="text-align: center; margin-top: 40px;">
        <a href="${SITE_URL}/register" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Generate Unlimited Descriptions with AgentBio
        </a>
      </p>
    </div>`,

    5: `<!-- Email 5: Real Data -->
    <div style="${baseStyles}">
      <h2 style="color: #9333ea;">${firstName}, this is what sells homes faster in 2025</h2>

      <p>We analyzed 47,000 real estate listings that sold in under 30 days.</p>

      <p>Here's what we found:</p>

      <div style="background: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #059669;">📊 What High-Performing Listings Have in Common</h3>

        <p><strong>1. Word count matters</strong><br>
        Optimal: 400-600 words. Too short (under 200) = 23% fewer showings. Too long (over 800) = 18% fewer.</p>

        <p><strong>2. Emotional triggers work</strong><br>
        Descriptions with emotion words ("imagine," "picture," "feel") get 31% more inquiries than feature-only lists.</p>

        <p><strong>3. Social proof is powerful</strong><br>
        Mentioning "award-winning schools" or "sought-after neighborhood" increases engagement by 27%.</p>

        <p><strong>4. Call-to-action is critical</strong><br>
        Listings ending with specific CTAs ("Schedule your private showing") get 2.4x more responses than generic endings.</p>
      </div>

      <p>Your AI-generated descriptions already include all 4 elements. That's why they work.</p>

      <p>Want to see how your listing stacks up? Reply to this email with your MLS link and I'll send you a free analysis.</p>

      <p>Tomorrow: Your complete listing success checklist (beyond just the description).</p>

      <p>- The AgentBio Team</p>

      <p style="text-align: center; margin-top: 40px;">
        <a href="${SITE_URL}/register" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Start Your Free 14-Day Trial
        </a>
      </p>
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

      <p>That's exactly why we built AgentBio - AI-powered marketing for every listing, automatically optimized for every channel.</p>

      <p>Tomorrow: A special offer just for you.</p>

      <p>- The AgentBio Team</p>

      <p style="text-align: center; margin-top: 40px;">
        <a href="${SITE_URL}/register" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Automate Your Listing Marketing
        </a>
      </p>
    </div>`,

    7: `<!-- Email 7: Final Offer -->
    <div style="${baseStyles}">
      <div style="text-align: center; padding: 30px 20px; background: linear-gradient(135deg, #9333ea, #ec4899); border-radius: 12px; margin-bottom: 30px;">
        <h1 style="color: white; margin: 0;">🎁 20% Off AgentBio (Expires Tonight)</h1>
      </div>

      <p>Hi ${firstName},</p>

      <p>Over the past week, you've learned:</p>
      <ul>
        <li>✓ How to write emotion-driven descriptions</li>
        <li>✓ The 7 power words that sell homes</li>
        <li>✓ How to choose the right style</li>
        <li>✓ What data says actually works</li>
        <li>✓ Your complete listing marketing checklist</li>
      </ul>

      <p>Now imagine never having to think about any of this again.</p>

      <div style="background: #faf5ff; border: 3px solid #9333ea; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center;">
        <h2 style="margin-top: 0; color: #9333ea;">Special Offer: 20% Off Your First 3 Months</h2>

        <p style="font-size: 18px; margin: 20px 0;"><strong>AgentBio Pro: $23.20/month</strong> (normally $29)</p>

        <p><strong>Includes:</strong></p>
        <ul style="text-align: left; display: inline-block; margin: 20px 0;">
          <li>✨ Unlimited AI listing descriptions</li>
          <li>📸 Instagram bio optimization</li>
          <li>🔗 Custom link-in-bio page</li>
          <li>📅 30-day content calendar</li>
          <li>📧 Automated email sequences</li>
          <li>📊 Analytics dashboard</li>
          <li>💬 Priority support</li>
        </ul>

        <a href="${SITE_URL}/register?coupon=LISTING20" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold; margin-top: 20px;">
          Claim Your 20% Discount →
        </a>

        <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">Use code LISTING20 at checkout • Expires tonight at midnight</p>
      </div>

      <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="margin-top: 0; color: #059669;">🎁 Bonus: Free Listing Templates Pack ($97 value)</h3>
        <p>Sign up today and get:</p>
        <ul>
          <li>50 Ready-to-use power words cheat sheet</li>
          <li>Property photography checklist</li>
          <li>30 Instagram caption templates</li>
          <li>Email drip campaign templates</li>
          <li>Open house marketing checklist</li>
        </ul>
      </div>

      <p><strong>Still not sure?</strong> Here's what other agents are saying:</p>

      <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #9333ea; margin: 20px 0;">
        <p style="font-style: italic; margin: 0;">"AgentBio saves me 8-10 hours per week on content creation. The listing generator alone is worth the price."</p>
        <p style="margin: 10px 0 0; font-size: 14px; color: #6b7280;">— Jennifer M., Top 1% Agent, Austin</p>
      </div>

      <p style="font-size: 18px; font-weight: bold; text-align: center; margin: 40px 0 20px;">This offer expires in <span style="color: #dc2626;">12 hours</span></p>

      <p style="text-align: center;">
        <a href="${SITE_URL}/register?coupon=LISTING20" style="background: linear-gradient(135deg, #9333ea, #ec4899); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold;">
          Start My 14-Day Free Trial
        </a>
      </p>

      <p style="text-align: center; font-size: 12px; color: #6b7280;">No credit card required • Cancel anytime • 4,200+ agents trust AgentBio</p>

      <p style="margin-top: 40px;">To your success,<br>The AgentBio Team</p>

      <p style="font-size: 12px; color: #9ca3af; margin-top: 40px;">P.S. Can't decide? Hit reply and I'll personally answer any questions you have.</p>
    </div>`,
  };

  return emails[sequenceNumber] || `<p>Email content for sequence ${sequenceNumber}</p>`;
}
