#!/usr/bin/env node

/**
 * Supabase JWT Generator
 * Generates valid anon and service_role JWT tokens for self-hosted Supabase
 */

import crypto from 'crypto';

// Helper function to base64url encode
function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate JWT
function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  
  const encodedSignature = base64url(signature);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Main function
function generateSupabaseKeys(jwtSecret) {
  if (!jwtSecret) {
    console.error('❌ Error: JWT_SECRET is required');
    console.log('Usage: node generate-supabase-keys.js YOUR_JWT_SECRET');
    process.exit(1);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expiryTime = currentTime + (100 * 365 * 24 * 60 * 60); // 100 years

  // Generate ANON key
  const anonPayload = {
    iss: 'supabase',
    iat: currentTime,
    exp: expiryTime,
    role: 'anon'
  };

  // Generate SERVICE_ROLE key
  const servicePayload = {
    iss: 'supabase',
    iat: currentTime,
    exp: expiryTime,
    role: 'service_role'
  };

  const anonKey = generateJWT(anonPayload, jwtSecret);
  const serviceRoleKey = generateJWT(servicePayload, jwtSecret);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Supabase JWT Keys Generated Successfully! ✅');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('🔑 JWT_SECRET (keep this secret!):');
  console.log(`   ${jwtSecret}\n`);
  
  console.log('🌐 SUPABASE_ANON_KEY (public - use in frontend):');
  console.log(`   ${anonKey}\n`);
  
  console.log('🔒 SUPABASE_SERVICE_ROLE_KEY (secret - server only!):');
  console.log(`   ${serviceRoleKey}\n`);
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Add to your .env file:\n');
  console.log(`SUPABASE_ANON_KEY=${anonKey}`);
  console.log(`SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
  console.log(`JWT_SECRET=${jwtSecret}`);
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('⚠️  Important Notes:');
  console.log('   1. NEVER expose SERVICE_ROLE_KEY in frontend code');
  console.log('   2. Store JWT_SECRET securely (used to verify tokens)');
  console.log('   3. ANON_KEY is safe for client-side use');
  console.log('   4. Update these in Coolify environment variables');
  console.log('   5. Restart services after updating\n');
}

// Get JWT secret from command line or generate a new one
const jwtSecret = process.argv[2] || crypto.randomBytes(32).toString('base64');

if (!process.argv[2]) {
  console.log('\n⚠️  No JWT_SECRET provided. Generated a new one.\n');
  console.log('If you have existing keys, use your existing JWT_SECRET:');
  console.log('node generate-supabase-keys.js YOUR_EXISTING_JWT_SECRET\n');
}

generateSupabaseKeys(jwtSecret);

