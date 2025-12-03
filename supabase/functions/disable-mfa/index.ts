import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { decode as base32Decode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

/**
 * Disable MFA
 * Requires verification of current MFA code before disabling
 */

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_ALGORITHM = 'SHA-1';

// HMAC-based OTP generation
async function generateHOTP(secret: Uint8Array, counter: bigint): Promise<string> {
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, counter, false);

  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: TOTP_ALGORITHM },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hmac = new Uint8Array(signature);

  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
  return otp;
}

async function generateTOTP(secret: string, timestamp?: number): Promise<string> {
  const secretBytes = base32Decode(secret);
  const time = timestamp || Math.floor(Date.now() / 1000);
  const counter = BigInt(Math.floor(time / TOTP_PERIOD));
  return generateHOTP(secretBytes, counter);
}

async function verifyTOTP(secret: string, code: string, tolerance = 1): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(time / TOTP_PERIOD);

  for (let i = -tolerance; i <= tolerance; i++) {
    const windowTime = (currentWindow + i) * TOTP_PERIOD;
    const validCode = await generateTOTP(secret, windowTime);
    if (validCode === code) {
      return true;
    }
  }

  return false;
}

async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedCode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = base64Encode(new Uint8Array(hashBuffer));

  return hashedCodes.includes(hash);
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

    const { code, password } = await req.json();

    if (!code) {
      throw new Error('Verification code is required to disable MFA');
    }

    // Get MFA settings
    const { data: mfaSettings, error: mfaError } = await supabase
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (mfaError || !mfaSettings || !mfaSettings.mfa_enabled) {
      throw new Error('MFA is not enabled for this account');
    }

    // Check if locked
    if (mfaSettings.locked_until && new Date(mfaSettings.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked due to too many failed attempts');
    }

    const normalizedCode = code.replace(/\s/g, '');
    let isValid = false;

    // Check backup code first
    if (normalizedCode.replace(/-/g, '').length === 8) {
      isValid = await verifyBackupCode(normalizedCode, mfaSettings.backup_codes);
    } else {
      isValid = await verifyTOTP(mfaSettings.totp_secret, normalizedCode);
    }

    // Log verification attempt
    await supabase.from('mfa_verification_logs').insert({
      user_id: user.id,
      method: 'totp',
      status: isValid ? 'success' : 'failed',
      ip_address: clientIP,
      user_agent: req.headers.get('user-agent'),
      failure_reason: isValid ? null : 'Invalid code for MFA disable',
    });

    if (!isValid) {
      await supabase.rpc('increment_mfa_failed_attempts', { p_user_id: user.id });
      throw new Error('Invalid verification code');
    }

    // Disable MFA
    const { error: updateError } = await supabase
      .from('user_mfa_settings')
      .update({
        mfa_enabled: false,
        totp_secret: null,
        backup_codes: [],
        verified_at: null,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to disable MFA');
    }

    // Revoke all trusted devices
    await supabase
      .from('mfa_trusted_devices')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'MFA has been disabled successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('MFA Disable Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
