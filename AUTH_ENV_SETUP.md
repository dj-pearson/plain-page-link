# Authentication Environment Variables Setup
## AgentBio Platform - Self-Hosted Supabase Configuration

**Last Updated:** January 7, 2026  
**Based on:** AUTH_SETUP_DOCUMENTATION.md (EatPal working implementation)

---

## Overview

AgentBio uses a self-hosted Supabase instance with separate edge functions service. This document outlines the required environment variables for proper authentication setup.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                  (https://agentbio.net)                         │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE PAGES                             │
│              (Vite React App + Static Assets)                   │
│                                                                 │
│  Environment Variables:                                         │
│  - VITE_SUPABASE_URL                                           │
│  - VITE_SUPABASE_ANON_KEY                                      │
│  - VITE_FUNCTIONS_URL                                          │
└───────────┬──────────────────────────┬──────────────────────────┘
            │                          │
            │                          │
            ▼                          ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  SELF-HOSTED         │    │  SELF-HOSTED             │
│  SUPABASE            │    │  EDGE FUNCTIONS          │
│  (Docker/Coolify)    │    │  (Separate Service)      │
│                      │    │                          │
│  https://api.        │    │  https://functions.      │
│  agentbio.net        │    │  agentbio.net            │
│                      │    │                          │
│  - Auth Service      │    │  - Deno Functions        │
│  - PostgreSQL DB     │    │  - AI Services           │
│  - Storage           │    │  - Email Services        │
│  - Realtime          │    │  - Webhooks              │
└───────────┬──────────┘    └──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│   PostgreSQL Database    │
│   <your-db-ip>:<port>    │
│                          │
│  - User Auth Data        │
│  - Profiles              │
│  - Application Data      │
└──────────────────────────┘
```

---

## Required Environment Variables

### 1. Frontend (Cloudflare Pages)

Set these in your Cloudflare Pages dashboard under:
`Settings → Environment variables`

```bash
# Core Supabase Configuration
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=<your-anon-jwt-token>
VITE_FUNCTIONS_URL=https://functions.agentbio.net

# Application Metadata
VITE_APP_NAME=AgentBio Intelligence
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://agentbio.net

# Optional: Analytics & Payments
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GA_MEASUREMENT_ID=G-...

# Optional: Error Tracking (Sentry)
VITE_SENTRY_DSN=https://...
VITE_SENTRY_ENABLED=true
```

### 2. Local Development (.env.local)

Create a `.env.local` file in your project root:

```bash
# Self-Hosted Supabase
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=<your-anon-jwt-token>
VITE_FUNCTIONS_URL=https://functions.agentbio.net

# Application Info
VITE_APP_NAME=AgentBio Intelligence
VITE_APP_VERSION=1.0.0
VITE_APP_URL=http://localhost:8080

# Development-only (use test keys)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_GA_MEASUREMENT_ID=G-...
```

### 3. Self-Hosted Supabase Server (Docker/Coolify)

These should be set in your Supabase deployment environment:

```bash
# PostgreSQL Configuration
POSTGRES_HOST=<your-db-host>
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>

# JWT Configuration (CRITICAL - Must match VITE_SUPABASE_ANON_KEY)
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRY=3600

# Auth Configuration
SITE_URL=https://agentbio.net
ADDITIONAL_REDIRECT_URLS=https://agentbio.net/auth,https://agentbio.net/auth/login,https://agentbio.net/auth/callback
DISABLE_SIGNUP=false
MAILER_AUTOCONFIRM=false

# Email Service (Resend recommended)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=<resend-api-key>
SMTP_SENDER_NAME=AgentBio
SMTP_SENDER_EMAIL=noreply@agentbio.net

# OAuth Providers (Optional but recommended)
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
APPLE_CLIENT_ID=<apple-oauth-client-id>
APPLE_CLIENT_SECRET=<apple-oauth-client-secret>

# Security Keys
API_EXTERNAL_URL=https://api.agentbio.net
ANON_KEY=<your-anon-jwt-token>
SERVICE_ROLE_KEY=<your-service-role-jwt-token>
```

### 4. Edge Functions Service (Separate Docker Container)

```bash
# Supabase Connection
SUPABASE_URL=https://api.agentbio.net
SUPABASE_ANON_KEY=<your-anon-jwt-token>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-jwt-token>

# OpenAI (for AI features)
OPENAI_API_KEY=<openai-api-key>

# Email Service
RESEND_API_KEY=<resend-api-key>

# Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other API Keys
GOOGLE_MAPS_API_KEY=<google-maps-key>
```

---

## Generating JWT Tokens

### ANON Key (Public JWT)

The anon key is used by frontend clients and has limited permissions (enforced by RLS).

**Payload:**
```json
{
  "iss": "supabase",
  "iat": 1765253160,
  "exp": 4920926760,
  "role": "anon"
}
```

**Generate with:**
```bash
# Using jwt.io or a JWT library
# Sign with your JWT_SECRET using HS256 algorithm
```

### SERVICE_ROLE Key (Admin JWT)

The service role key bypasses RLS and should NEVER be exposed to clients.

**Payload:**
```json
{
  "iss": "supabase",
  "iat": 1765253160,
  "exp": 4920926760,
  "role": "service_role"
}
```

⚠️ **CRITICAL:** Never commit JWT secrets or keys to version control!

---

## Client Validation

The Supabase client validates environment variables on initialization:

```typescript:src/integrations/supabase/client.ts
// Validate required environment variables
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing required environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local'
  );
}

// Warn if edge functions URL is not configured
if (!EDGE_FUNCTIONS_URL) {
  console.warn(
    'VITE_FUNCTIONS_URL is not set. Edge functions will use default Supabase URL. ' +
    'For self-hosted Supabase, set this to your functions subdomain (e.g., https://functions.agentbio.net)'
  );
}
```

---

## OAuth Configuration

### Google OAuth

1. **Google Cloud Console:**
   - Create project: "AgentBio"
   - Enable "Google+ API"
   - Create OAuth 2.0 credentials

2. **Authorized Redirect URIs:**
   ```
   https://api.agentbio.net/auth/v1/callback
   https://agentbio.net/auth/login
   ```

3. **Scopes Required:**
   - `email`
   - `profile`
   - `openid`

### Apple OAuth

1. **Apple Developer Console:**
   - Create App ID: `com.agentbio.app`
   - Enable "Sign in with Apple"
   - Create Service ID: `com.agentbio.web`

2. **Return URLs:**
   ```
   https://api.agentbio.net/auth/v1/callback
   ```

---

## Security Best Practices

### ✅ DO:

- Use strong, randomly generated JWT secrets (32+ characters)
- Rotate JWT secrets periodically
- Use environment variables for all secrets
- Enable Row Level Security (RLS) on all tables
- Use HTTPS only in production
- Validate redirect URLs to prevent open redirects
- Sanitize all user inputs

### ❌ DON'T:

- Never commit `.env.local` or any file with secrets
- Never expose `SERVICE_ROLE_KEY` to frontend
- Never disable RLS on production tables
- Never use weak JWT secrets
- Never skip input validation
- Never trust user-provided redirect URLs

---

## Testing Configuration

### Local Development

```bash
# 1. Copy example env file
cp .env.example .env.local

# 2. Fill in your self-hosted Supabase credentials
# Edit .env.local with your values

# 3. Start dev server
npm run dev

# 4. Visit http://localhost:8080
# You should see no console errors about missing env vars
```

### Verify Environment Variables

```javascript
// In browser console
console.log({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  functionsUrl: import.meta.env.VITE_FUNCTIONS_URL,
  appUrl: import.meta.env.VITE_APP_URL,
});

// Should show your configured values (anon key will be truncated)
```

### Test Authentication

1. **Sign Up:**
   - Navigate to `/auth/register`
   - Create account with email
   - Check for OTP code in email
   - Verify with 6-digit code
   - Should redirect to onboarding

2. **Sign In:**
   - Navigate to `/auth/login`
   - Enter credentials
   - Should redirect to dashboard

3. **OAuth:**
   - Click "Continue with Google"
   - Authorize app
   - Should redirect back and create session

---

## Troubleshooting

### "Invalid JWT" Errors

**Cause:** JWT secret mismatch between frontend and backend

**Fix:**
1. Ensure `VITE_SUPABASE_ANON_KEY` matches the JWT generated with your `JWT_SECRET`
2. Regenerate JWT tokens if needed
3. Update all environments with new keys

### Email OTP Not Sending

**Check:**
- SMTP credentials correct
- Email service (Resend) API key valid
- Sender email verified
- Check spam folder
- Review Supabase Auth logs

### OAuth Redirect Not Working

**Check:**
- Redirect URLs match exactly in OAuth provider settings
- Using HTTPS (not HTTP)
- Callback URL includes `/auth/v1/callback`
- No trailing slashes in URLs

### CORS Errors

**Check:**
- `ADDITIONAL_REDIRECT_URLS` includes your frontend domain
- `SITE_URL` set correctly
- CORS headers configured in your reverse proxy

---

## Quick Reference

### Essential Variables for Auth

| Variable | Where Used | Example |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | Frontend | `https://api.agentbio.net` |
| `VITE_SUPABASE_ANON_KEY` | Frontend | `eyJhbGc...` (JWT) |
| `VITE_FUNCTIONS_URL` | Frontend | `https://functions.agentbio.net` |
| `JWT_SECRET` | Supabase Server | Random 32+ chars |
| `SITE_URL` | Supabase Server | `https://agentbio.net` |
| `SERVICE_ROLE_KEY` | Backend Only | `eyJhbGc...` (JWT) |

---

## Additional Resources

- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting)
- [JWT.io - Token Inspector](https://jwt.io)
- [OAuth 2.0 Overview](https://oauth.net/2/)

---

**Last Updated:** January 7, 2026  
**Maintainer:** Development Team  
**Questions?** Review this document or consult AUTH_SETUP_DOCUMENTATION.md
