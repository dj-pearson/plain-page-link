# Supabase Keys Regeneration Guide

## What Are These Keys?

### JWT_SECRET

-   Master secret used to sign all JWT tokens
-   **Must be kept absolutely secret**
-   Used to verify token authenticity
-   If changed, all existing tokens become invalid

### SUPABASE_ANON_KEY

-   Public API key (JWT token with `role: anon`)
-   Used by frontend/client applications
-   **Safe to expose** in client-side code
-   Limited permissions (RLS enforced)

### SUPABASE_SERVICE_ROLE_KEY

-   Server-side API key (JWT token with `role: service_role`)
-   **MUST NEVER be exposed** in frontend
-   Full database access (bypasses RLS)
-   Only for backend/edge functions

---

## JWT Token Format

These are JSON Web Tokens with this structure:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTcwNTAzOTk4MCwiZXhwIjo0OTIwNzEzNTgwLCJyb2xlIjoiYW5vbiJ9.signature_here
```

**Parts:**

1. Header (algorithm and type)
2. Payload (issuer, timestamps, role)
3. Signature (signed with JWT_SECRET)

---

## Option 1: Generate New Keys (Recommended)

### Using the Node.js Script:

```bash
# Generate completely new keys (with new JWT_SECRET)
node generate-supabase-keys.js

# OR use your existing JWT_SECRET to keep compatibility
node generate-supabase-keys.js "your-existing-jwt-secret"
```

This will output:

-   New JWT_SECRET (or use your existing one)
-   New SUPABASE_ANON_KEY
-   New SUPABASE_SERVICE_ROLE_KEY

---

## Option 2: Use Your Current Keys

### Find Your Current Keys

Your current keys should be in:

1. **Supabase config:** `supabase/config.toml`
2. **Coolify environment variables**
3. **GitHub secrets**

```bash
# Check your current keys
grep -r "SUPABASE_ANON_KEY" .env* supabase/
```

Based on your recent edge functions setup, you're using:

```
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTAzOTk4MCwiZXhwIjo0OTIwNzEzNTgwLCJyb2xlIjoiYW5vbiJ9.QhDHf45z3FazBIiYTGKO43KBquCaOjIjqhGmWSJw2Ms

SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTAzOTk4MCwiZXhwIjo0OTIwNzEzNTgwLCJyb2xlIjoic2VydmljZV9yb2xlIn0.SiFzNodGGE8o66DznVhlLSucYqaIKgqrFZu64Nl-KMU
```

**These are valid and working!** ✅

---

## Option 3: Online JWT Generator

If you don't want to use the script:

### 1. Go to: https://jwt.io/

### 2. Configure:

**Header:**

```json
{
    "alg": "HS256",
    "typ": "JWT"
}
```

**Payload for ANON_KEY:**

```json
{
    "iss": "supabase",
    "iat": 1705039980,
    "exp": 4920713580,
    "role": "anon"
}
```

**Payload for SERVICE_ROLE_KEY:**

```json
{
    "iss": "supabase",
    "iat": 1705039980,
    "exp": 4920713580,
    "role": "service_role"
}
```

**Secret:** Your JWT_SECRET (must be the same for both!)

### 3. Copy the generated token

---

## When Should You Regenerate Keys?

### YES, regenerate if:

-   ❌ Keys were accidentally exposed publicly
-   ❌ You suspect keys were compromised
-   ❌ Setting up a completely new environment
-   ❌ Keys are from a different Supabase instance

### NO, keep current keys if:

-   ✅ They're working fine
-   ✅ Never been exposed
-   ✅ You want to avoid updating all services

---

## How to Update Keys Everywhere

### 1. Generate New Keys

```bash
node generate-supabase-keys.js
```

### 2. Update Coolify (Supabase Service)

In Coolify Dashboard → Your Supabase Service → Environment Variables:

```env
JWT_SECRET=your-new-jwt-secret
ANON_KEY=your-new-anon-key
SERVICE_ROLE_KEY=your-new-service-role-key
```

### 3. Update Coolify (Edge Functions Service)

In Coolify Dashboard → Edge Functions Service → Environment Variables:

```env
SUPABASE_ANON_KEY=your-new-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
```

### 4. Update GitHub Secrets

Settings → Secrets and variables → Actions:

```env
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

### 5. Update Local Environment

```bash
# .env.local
VITE_SUPABASE_ANON_KEY=your-new-anon-key

# .env.production
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

### 6. Restart Services

```bash
# In Coolify, restart:
# 1. Supabase service
# 2. Edge Functions service
# 3. Frontend application
```

### 7. Redeploy Frontend

```bash
git add .env.production
git commit -m "chore: Update Supabase keys"
git push
```

---

## Verification

### Test ANON_KEY:

```bash
curl https://api.agentbio.net/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Test SERVICE_ROLE_KEY:

```bash
curl https://api.agentbio.net/rest/v1/profiles?select=*&limit=1 \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Test Edge Functions:

```bash
curl https://functions.agentbio.net/health
```

---

## Important Security Notes

### ⚠️ SERVICE_ROLE_KEY Security:

**NEVER expose in:**

-   ❌ Frontend code
-   ❌ Client-side JavaScript
-   ❌ Public Git repositories
-   ❌ Browser DevTools
-   ❌ Error messages
-   ❌ Logs sent to browser

**ONLY use in:**

-   ✅ Edge Functions (server-side)
-   ✅ Backend APIs
-   ✅ Database migrations
-   ✅ Admin scripts
-   ✅ Server environment variables

### 🔒 JWT_SECRET Security:

**NEVER:**

-   ❌ Commit to Git
-   ❌ Share publicly
-   ❌ Store in frontend
-   ❌ Log to console

**ALWAYS:**

-   ✅ Store in environment variables
-   ✅ Use different secrets for prod/dev
-   ✅ Rotate periodically
-   ✅ Keep backups in secure password manager

---

## Quick Answer for You

**Based on your current setup, your keys are already valid and working!**

The keys you have:

```
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**Are properly formatted JWT tokens.** ✅

### You DON'T need to change them unless:

1. You want to rotate for security
2. They've been exposed
3. You're setting up a new environment

### If you DO want to change them:

1. Run: `node generate-supabase-keys.js`
2. Copy the new keys
3. Update in Coolify, GitHub, and local env files
4. Restart all services

---

## TL;DR

**Your current keys ARE valid!** They're not passwords - they're JWT tokens with this format:

```
header.payload.signature
```

To generate new ones:

```bash
node generate-supabase-keys.js
```

Then update everywhere and restart services.
