import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAuth, getClientIP } from '../_shared/auth.ts';
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { decode as base32Decode } from "https://deno.land/std@0.168.0/encoding/base32.ts";
import { successResponse, errorResponse, handleUnexpectedError } from '../_shared/response.ts';
import { decryptSecret } from '../_shared/encryption.ts';

/**
 * Regenerate MFA backup codes.
 *
 * Requires a valid current TOTP (or existing backup) code, then replaces
 * the stored set with a fresh batch and returns the new plaintext codes
 * ONCE. The old codes are invalidated immediately.
 */

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;
const TOTP_ALGORITHM = 'SHA-1';

async function generateHOTP(secret: Uint8Array, counter: bigint): Promise<string> {
  const counterBuffer = new ArrayBuffer(8);
  new DataView(counterBuffer).setBigUint64(0, counter, false);
  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: TOTP_ALGORITHM }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % Math.pow(10, TOTP_DIGITS)).toString().padStart(TOTP_DIGITS, '0');
}

async function verifyTOTP(secret: string, code: string, tolerance = 1): Promise<boolean> {
  const secretBytes = base32Decode(secret);
  const currentWindow = Math.floor(Math.floor(Date.now() / 1000) / TOTP_PERIOD);
  for (let i = -tolerance; i <= tolerance; i++) {
    const counter = BigInt(currentWindow + i);
    if ((await generateHOTP(secretBytes, counter)) === code) return true;
  }
  return false;
}

async function verifyBackupCode(code: string, hashedCodes: string[]): Promise<boolean> {
  const normalized = code.replace(/-/g, '').toUpperCase();
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return hashedCodes.includes(base64Encode(new Uint8Array(hashBuffer)));
}

function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    let code = '';
    for (let j = 0; j < 8; j++) code += charset[array[j] % charset.length];
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

async function hashBackupCodes(codes: string[]): Promise<string[]> {
  const hashes: string[] = [];
  for (const code of codes) {
    const data = new TextEncoder().encode(code.replace('-', ''));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    hashes.push(base64Encode(new Uint8Array(hashBuffer)));
  }
  return hashes;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const user = await requireAuth(req, supabase);
    const clientIP = getClientIP(req);

    const { code } = await req.json();
    if (!code) {
      return errorResponse('Verification code is required to regenerate backup codes', 'REQUEST_VALIDATION_FAILED', req);
    }

    const { data: mfaSettings, error: mfaError } = await supabase
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (mfaError || !mfaSettings || !mfaSettings.mfa_enabled) {
      return errorResponse('MFA is not enabled for this account', 'AUTH_MFA_INVALID', req);
    }

    if (mfaSettings.locked_until && new Date(mfaSettings.locked_until) > new Date()) {
      return errorResponse('Account is temporarily locked due to too many failed attempts', 'AUTH_LOGIN_RATE_LIMITED', req, 429);
    }

    const normalizedCode = code.replace(/\s/g, '');
    let isValid = false;
    if (normalizedCode.replace(/-/g, '').length === 8) {
      isValid = await verifyBackupCode(normalizedCode, mfaSettings.backup_codes);
    } else {
      const totpSecret = (await decryptSecret(mfaSettings.totp_secret)) as string;
      isValid = await verifyTOTP(totpSecret, normalizedCode);
    }

    if (!isValid) {
      await supabase.rpc('increment_mfa_failed_attempts', { p_user_id: user.id });
      await supabase
        .rpc('log_audit_event', {
          p_user_id: user.id,
          p_action: 'mfa_backup_codes_regenerate',
          p_status: 'failure',
          p_resource_type: 'mfa',
          p_ip_address: clientIP,
          p_user_agent: req.headers.get('user-agent'),
          p_details: JSON.stringify({ reason: 'invalid_code' }),
        })
        .catch(() => undefined);
      return errorResponse('Invalid verification code', 'AUTH_MFA_INVALID', req);
    }

    await supabase.rpc('reset_mfa_failed_attempts', { p_user_id: user.id });

    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    const { error: updateError } = await supabase
      .from('user_mfa_settings')
      .update({
        backup_codes: hashedBackupCodes,
        backup_codes_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateError) {
      return errorResponse('Failed to regenerate backup codes', 'AUTH_MFA_INVALID', req, 500);
    }

    await supabase
      .rpc('log_audit_event', {
        p_user_id: user.id,
        p_action: 'mfa_backup_codes_regenerate',
        p_status: 'success',
        p_resource_type: 'mfa',
        p_ip_address: clientIP,
        p_user_agent: req.headers.get('user-agent'),
        p_details: JSON.stringify({ count: backupCodes.length }),
      })
      .catch(() => undefined);

    return successResponse(
      {
        backupCodes,
        message: 'New backup codes generated. Your previous codes are no longer valid.',
      },
      req
    );
  } catch (error) {
    console.error('Regenerate Backup Codes Error:', error instanceof Error ? error.message : error);
    return handleUnexpectedError(error, req);
  }
});
