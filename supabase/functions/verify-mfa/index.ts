import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { decode as base32Decode } from "https://deno.land/std@0.168.0/encoding/base32.ts";

/**
 * Verify MFA Code
 * Handles both setup verification and login verification
 * Supports TOTP codes and backup codes
 */

// TOTP Configuration
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_ALGORITHM = 'SHA-1';

// HMAC-based OTP generation
async function generateHOTP(secret: Uint8Array, counter: bigint): Promise<string> {
  // Convert counter to 8-byte big-endian array
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setBigUint64(0, counter, false);

  // Import the secret as a CryptoKey
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: TOTP_ALGORITHM },
    false,
    ['sign']
  );

  // Generate HMAC
  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  // Generate the OTP
  const otp = (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
  return otp;
}

// Generate TOTP for the current time window
async function generateTOTP(secret: string, timestamp?: number): Promise<string> {
  const secretBytes = base32Decode(secret);
  const time = timestamp || Math.floor(Date.now() / 1000);
  const counter = BigInt(Math.floor(time / TOTP_PERIOD));
  return generateHOTP(secretBytes, counter);
}

// Verify TOTP with time drift tolerance (±1 window)
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

// Verify backup code
async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<{ valid: boolean; index: number }> {
  const normalizedCode = code.replace(/-/g, '').toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalizedCode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = base64Encode(new Uint8Array(hashBuffer));

  const index = hashedCodes.indexOf(hash);
  return { valid: index !== -1, index };
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

    const body = await req.json();
    const { code, isSetupVerification, trustDevice, deviceFingerprint } = body;

    if (!code) {
      throw new Error('Verification code is required');
    }

    // Get MFA settings
    const { data: mfaSettings, error: mfaError } = await supabase
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (mfaError || !mfaSettings) {
      throw new Error('MFA is not set up for this account');
    }

    // Check if locked due to too many failed attempts
    if (mfaSettings.locked_until && new Date(mfaSettings.locked_until) > new Date()) {
      const unlockTime = new Date(mfaSettings.locked_until).toLocaleTimeString();
      throw new Error(`Too many failed attempts. Try again after ${unlockTime}`);
    }

    const normalizedCode = code.replace(/\s/g, '');
    let isValid = false;
    let method = 'totp';
    let backupCodeIndex = -1;

    // Check if it's a backup code (format: XXXX-XXXX or XXXXXXXX, 8 chars)
    if (normalizedCode.replace(/-/g, '').length === 8) {
      const result = await verifyBackupCode(normalizedCode, mfaSettings.backup_codes);
      isValid = result.valid;
      method = 'backup_code';
      backupCodeIndex = result.index;
    } else {
      // Verify TOTP code
      isValid = await verifyTOTP(mfaSettings.totp_secret, normalizedCode);
    }

    // Log verification attempt
    await supabase.from('mfa_verification_logs').insert({
      user_id: user.id,
      method,
      status: isValid ? 'success' : 'failed',
      ip_address: clientIP,
      user_agent: req.headers.get('user-agent'),
      device_fingerprint: deviceFingerprint,
      failure_reason: isValid ? null : 'Invalid code',
    });

    if (!isValid) {
      // Increment failed attempts
      await supabase.rpc('increment_mfa_failed_attempts', { p_user_id: user.id });

      throw new Error('Invalid verification code');
    }

    // Reset failed attempts on success
    await supabase.rpc('reset_mfa_failed_attempts', { p_user_id: user.id });

    // If this was a setup verification, enable MFA
    if (isSetupVerification && !mfaSettings.mfa_enabled) {
      const { error: updateError } = await supabase
        .from('user_mfa_settings')
        .update({
          mfa_enabled: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        throw new Error('Failed to enable MFA');
      }
    }

    // If backup code was used, remove it
    if (method === 'backup_code' && backupCodeIndex !== -1) {
      const updatedBackupCodes = [...mfaSettings.backup_codes];
      updatedBackupCodes.splice(backupCodeIndex, 1);

      await supabase
        .from('user_mfa_settings')
        .update({
          backup_codes: updatedBackupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    // Trust device if requested
    if (trustDevice && deviceFingerprint) {
      const trustDuration = 30; // days

      await supabase.from('mfa_trusted_devices').upsert({
        user_id: user.id,
        device_fingerprint: deviceFingerprint,
        device_name: body.deviceName || 'Unknown Device',
        browser: body.browser,
        os: body.os,
        ip_address: clientIP,
        last_used_at: new Date().toISOString(),
        trusted_until: new Date(Date.now() + trustDuration * 24 * 60 * 60 * 1000).toISOString(),
        revoked: false,
      }, {
        onConflict: 'user_id,device_fingerprint',
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        mfaEnabled: isSetupVerification || mfaSettings.mfa_enabled,
        remainingBackupCodes: method === 'backup_code'
          ? mfaSettings.backup_codes.length - 1
          : mfaSettings.backup_codes.length,
        message: isSetupVerification
          ? 'MFA has been successfully enabled'
          : 'Verification successful',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred';
    console.error('MFA Verification Error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
