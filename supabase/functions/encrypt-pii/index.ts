/**
 * PII Encryption Edge Function
 *
 * Provides server-side encryption/decryption for highly sensitive PII data.
 * Uses AES-256-GCM encryption with a master key stored in environment variables.
 *
 * SECURITY NOTES:
 * - The ENCRYPTION_MASTER_KEY must be set in Supabase Edge Function secrets
 * - Keys are never exposed to the client
 * - This function requires authentication
 * - All operations are logged for audit purposes
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

interface EncryptRequest {
  action: 'encrypt' | 'decrypt';
  data: Record<string, string>;
  fields: string[];
  table: string;
  recordId?: string;
}

interface EncryptedValue {
  ciphertext: string;
  iv: string;
  version: number;
}

interface EncryptResponse {
  success: boolean;
  data?: Record<string, string | EncryptedValue>;
  error?: string;
}

const ENCRYPTION_VERSION = 1;

// Get the master key from environment
function getMasterKey(): Uint8Array {
  const keyBase64 = Deno.env.get('ENCRYPTION_MASTER_KEY');
  if (!keyBase64) {
    throw new Error('ENCRYPTION_MASTER_KEY not configured');
  }

  // Decode base64 key
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  if (keyBytes.length !== 32) {
    throw new Error('Invalid ENCRYPTION_MASTER_KEY length. Must be 32 bytes (256 bits).');
  }

  return keyBytes;
}

// Import the master key for use with Web Crypto
async function importKey(keyBytes: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Encrypt a single value
async function encryptValue(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedValue> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv.buffer),
    version: ENCRYPTION_VERSION,
  };
}

// Decrypt a single value
async function decryptValue(
  encryptedValue: EncryptedValue,
  key: CryptoKey
): Promise<string> {
  const iv = base64ToArrayBuffer(encryptedValue.iv);
  const ciphertext = base64ToArrayBuffer(encryptedValue.ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// Log encryption operations for audit
async function logOperation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  action: string,
  table: string,
  recordId?: string,
  success: boolean = true,
  error?: string
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action: `pii_${action}`,
      resource_type: 'encryption',
      resource_id: recordId || null,
      action_details: {
        table,
        success,
        error: error || null,
      },
      status: success ? 'success' : 'failure',
      risk_level: 'high',
    });
  } catch (e) {
    console.error('Failed to log encryption operation:', e);
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  const corsHeaders = getCorsHeaders(origin);

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with user's auth token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: EncryptRequest = await req.json();
    const { action, data, fields, table, recordId } = body;

    // Validate request
    if (!action || !data || !fields || !table) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['encrypt', 'decrypt'].includes(action)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get and import the master key
    const keyBytes = getMasterKey();
    const key = await importKey(keyBytes);

    // Process the data
    const result: Record<string, string | EncryptedValue> = { ...data };

    if (action === 'encrypt') {
      for (const field of fields) {
        const value = data[field];
        if (value && typeof value === 'string') {
          result[field] = await encryptValue(value, key);
        }
      }
    } else {
      for (const field of fields) {
        const value = data[field];
        if (value && typeof value === 'object' && 'ciphertext' in value) {
          try {
            result[field] = await decryptValue(value as EncryptedValue, key);
          } catch {
            // If decryption fails, keep the encrypted value
            console.warn(`Failed to decrypt field: ${field}`);
          }
        }
      }
    }

    // Log the operation
    await logOperation(supabase, user.id, action, table, recordId, true);

    const response: EncryptResponse = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Encryption error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Encryption operation failed',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
