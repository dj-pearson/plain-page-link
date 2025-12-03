import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { encode as base32Encode } from "https://deno.land/std@0.168.0/encoding/base32.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

/**
 * Setup MFA (Multi-Factor Authentication)
 * Generates TOTP secret, QR code URL, and backup codes
 */

// Generate a cryptographically secure random secret
function generateSecret(length = 20): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

// Generate backup codes (10 codes, 8 characters each)
function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars

  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += charset[array[j] % charset.length];
    }
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

// Hash backup codes for secure storage
async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashes: string[] = [];
  for (const code of codes) {
    const encoder = new TextEncoder();
    const data = encoder.encode(code.replace('-', ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    hashes.push(base64Encode(new Uint8Array(hashBuffer)));
  }
  return hashes;
}

// Generate TOTP URI for authenticator apps
function generateTotpUri(secret: string, email: string, issuer = 'AgentBio'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const user = await requireAuth(req, supabase);
    const clientIP = getClientIP(req);

    // Check if MFA is already enabled
    const { data: existingMfa } = await supabase
      .from('user_mfa_settings')
      .select('mfa_enabled, verified_at')
      .eq('user_id', user.id)
      .single();

    if (existingMfa?.mfa_enabled && existingMfa?.verified_at) {
      throw new Error('MFA is already enabled. Please disable it first to set up again.');
    }

    // Generate TOTP secret (20 bytes = 160 bits, recommended for SHA1)
    const secretBytes = generateSecret(20);
    const secret = base32Encode(secretBytes);

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    // Generate TOTP URI for QR code
    const totpUri = generateTotpUri(secret, user.email || 'user');

    // Store secret temporarily (not verified yet)
    const { error: upsertError } = await supabase
      .from('user_mfa_settings')
      .upsert({
        user_id: user.id,
        mfa_enabled: false,
        mfa_method: 'totp',
        totp_secret: secret,
        backup_codes: hashedBackupCodes,
        backup_codes_generated_at: new Date().toISOString(),
        verified_at: null,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (upsertError) {
      console.error('Error storing MFA settings:', upsertError);
      throw new Error('Failed to setup MFA');
    }

    // Log the setup attempt
    await supabase.from('mfa_verification_logs').insert({
      user_id: user.id,
      method: 'totp',
      status: 'success',
      ip_address: clientIP,
      user_agent: req.headers.get('user-agent'),
    });

    return new Response(
      JSON.stringify({
        success: true,
        secret,
        totpUri,
        backupCodes,
        message: 'Scan the QR code with your authenticator app, then verify with a code'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('MFA Setup Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
