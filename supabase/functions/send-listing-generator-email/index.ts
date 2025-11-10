/**
 * Supabase Edge Function: Send Listing Generator Email
 * Sends immediate welcome email with all 3 listing description styles
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@agentbio.net';
const SITE_URL = Deno.env.get('SITE_URL') || 'https://agentbio.net';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { email, firstName, propertyDetails, descriptions, listingId } = await req.json();

    if (!email || !firstName) {
      throw new Error('Email and firstName are required');
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Send welcome email with all 3 styles
    const emailSent = await sendWelcomeEmail({
      email,
      firstName,
      propertyDetails,
      descriptions,
      listingId,
    });

    if (!emailSent) {
      throw new Error('Failed to send email via Resend');
    }

    // Mark email sequence as started
    await supabase
      .from('listing_email_captures')
      .update({ email_sequence_started: true })
      .eq('email', email)
      .eq('listing_id', listingId);

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error sending listing generator email:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to send email',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});

async function sendWelcomeEmail(data: {
  email: string;
  firstName: string;
  propertyDetails: any;
  descriptions: any[];
  listingId: string;
}): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `AgentBio <${FROM_EMAIL}>`,
        to: [data.email],
        subject: `${data.firstName}, Your 3 Professional Listing Descriptions Are Ready! 🏡`,
        html: getWelcomeEmailHTML(data),
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

function getWelcomeEmailHTML(data: {
  firstName: string;
  propertyDetails: any;
  descriptions: any[];
  listingId: string;
}): string {
  const { propertyDetails, descriptions } = data;

  const luxuryDesc = descriptions.find((d) => d.style === 'luxury');
  const familyDesc = descriptions.find((d) => d.style === 'family-friendly');
  const investmentDesc = descriptions.find((d) => d.style === 'investment');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Listing Descriptions</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; padding: 30px 0; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); border-radius: 12px; margin-bottom: 30px;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🏡 Your Listing Descriptions Are Ready!</h1>
  </div>

  <!-- Greeting -->
  <p style="font-size: 16px; margin-bottom: 20px;">Hi ${data.firstName},</p>

  <p style="font-size: 16px; margin-bottom: 20px;">
    Thank you for using the AgentBio AI Listing Description Generator! Below are your <strong>3 professionally written listing descriptions</strong>, each optimized for a different buyer persona.
  </p>

  <!-- Property Summary -->
  <div style="background: #f9fafb; border-left: 4px solid #9333ea; padding: 20px; margin: 30px 0; border-radius: 8px;">
    <h3 style="margin-top: 0; color: #9333ea;">Property Summary</h3>
    <p style="margin: 5px 0;"><strong>Location:</strong> ${propertyDetails.city}, ${propertyDetails.state}</p>
    <p style="margin: 5px 0;"><strong>Price:</strong> $${propertyDetails.price.toLocaleString()}</p>
    <p style="margin: 5px 0;"><strong>Bedrooms:</strong> ${propertyDetails.bedrooms} | <strong>Bathrooms:</strong> ${propertyDetails.bathrooms}</p>
    <p style="margin: 5px 0;"><strong>Square Feet:</strong> ${propertyDetails.squareFeet.toLocaleString()}</p>
  </div>

  <!-- Style 1: Luxury -->
  ${luxuryDesc ? `
  <div style="margin: 40px 0;">
    <h2 style="color: #9333ea; border-bottom: 2px solid #9333ea; padding-bottom: 10px;">
      ✨ Style 1: Luxury & Prestige
    </h2>

    <h3 style="margin-top: 25px; font-size: 18px;">MLS Description (${luxuryDesc.wordCount} words)</h3>
    <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0; white-space: pre-line;">${luxuryDesc.mlsDescription}</p>
    </div>

    <h3 style="margin-top: 25px; font-size: 18px;">Social Media Posts</h3>
    <div style="background: #fef3f9; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <strong>Instagram:</strong> ${luxuryDesc.instagramCaption}
    </div>
    <div style="background: #fef3f9; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <strong>Facebook:</strong> ${luxuryDesc.facebookPost}
    </div>
  </div>
  ` : ''}

  <!-- Style 2: Family-Friendly -->
  ${familyDesc ? `
  <div style="margin: 40px 0;">
    <h2 style="color: #ec4899; border-bottom: 2px solid #ec4899; padding-bottom: 10px;">
      🏡 Style 2: Warm & Welcoming
    </h2>

    <h3 style="margin-top: 25px; font-size: 18px;">MLS Description (${familyDesc.wordCount} words)</h3>
    <div style="background: #fef3f9; padding: 20px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0; white-space: pre-line;">${familyDesc.mlsDescription}</p>
    </div>

    <h3 style="margin-top: 25px; font-size: 18px;">Social Media Posts</h3>
    <div style="background: #faf5ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <strong>Instagram:</strong> ${familyDesc.instagramCaption}
    </div>
    <div style="background: #faf5ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <strong>Facebook:</strong> ${familyDesc.facebookPost}
    </div>
  </div>
  ` : ''}

  <!-- Style 3: Investment -->
  ${investmentDesc ? `
  <div style="margin: 40px 0;">
    <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
      📈 Style 3: Smart Investment
    </h2>

    <h3 style="margin-top: 25px; font-size: 18px;">MLS Description (${investmentDesc.wordCount} words)</h3>
    <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 15px 0;">
      <p style="margin: 0; white-space: pre-line;">${investmentDesc.mlsDescription}</p>
    </div>

    <h3 style="margin-top: 25px; font-size: 18px;">Social Media Posts</h3>
    <div style="background: #ede9fe; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <strong>Instagram:</strong> ${investmentDesc.instagramCaption}
    </div>
    <div style="background: #ede9fe; padding: 15px; border-radius: 8px; margin: 10px 0;">
      <strong>Facebook:</strong> ${investmentDesc.facebookPost}
    </div>
  </div>
  ` : ''}

  <!-- Implementation Tips -->
  <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
    <h3 style="margin-top: 0; color: #059669;">📝 Quick Implementation Checklist</h3>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Copy your preferred style to your MLS listing</li>
      <li>Post Instagram caption to your feed</li>
      <li>Share Facebook post to your business page</li>
      <li>Send to your buyer leads via email</li>
      <li>Test different styles for different channels</li>
    </ul>
  </div>

  <!-- CTA -->
  <div style="text-align: center; padding: 40px 20px; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); border-radius: 12px; margin: 30px 0;">
    <h2 style="color: white; margin-top: 0;">Want AI-Powered Marketing for EVERY Listing?</h2>
    <p style="color: white; margin-bottom: 25px;">
      AgentBio creates your entire marketing presence - Instagram optimization, link-in-bio pages, content calendars, and automated follow-up.
    </p>
    <a href="${SITE_URL}/register?utm_source=listing-generator&utm_medium=email&utm_campaign=welcome"
       style="display: inline-block; background: white; color: #9333ea; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
      Start Your Free 14-Day Trial →
    </a>
    <p style="color: white; font-size: 12px; margin-top: 15px; margin-bottom: 0;">
      No credit card required • Cancel anytime • 4,200+ agents trust AgentBio
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; margin-top: 40px;">
    <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
      Over the next 7 days, we'll send you advanced listing marketing strategies to help you sell faster.
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 15px 0 5px;">
      You're receiving this because you generated a listing description at AgentBio.net
    </p>
    <p style="font-size: 12px; color: #9ca3af; margin: 0;">
      <a href="${SITE_URL}" style="color: #9333ea; text-decoration: none;">AgentBio</a> •
      <a href="${SITE_URL}/unsubscribe" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a>
    </p>
  </div>

</body>
</html>`;
}
