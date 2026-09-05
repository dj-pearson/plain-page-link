# Quick Answer: Supabase Keys Regeneration

## TL;DR

**NO, you cannot just use a simple password!**

Your Supabase keys are **JWT (JSON Web Tokens)** with a specific format:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTcwNTAzOTk4MCwiZXhwIjo0OTIwNzEzNTgwLCJyb2xlIjoiYW5vbiJ9.signature
```

## Your Current Keys ARE Valid ✅

The keys you're currently using are **properly formatted and working**:

```env
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**You DON'T need to change them unless they've been compromised.**

---

## How to Generate New Keys (If Needed)

### Method 1: Use the Script (Easiest)

```bash
# Generate completely new keys
node generate-supabase-keys.js

# Or keep your existing JWT_SECRET for compatibility
node generate-supabase-keys.js "your-existing-jwt-secret"
```

**Output will look like:**

```
🔑 JWT_SECRET: XEUmr9t8lRZHCHnVnrFZmZqvP+VleLCZb4fV9jQwqXM=
🌐 SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔒 SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Method 2: Use JWT.io

1. Go to https://jwt.io/
2. Set Algorithm: **HS256**
3. Set Header: `{"alg":"HS256","typ":"JWT"}`
4. Set Payload:
    - For ANON: `{"iss":"supabase","iat":1705039980,"exp":4920713580,"role":"anon"}`
    - For SERVICE_ROLE: `{"iss":"supabase","iat":1705039980,"exp":4920713580,"role":"service_role"}`
5. Enter your JWT_SECRET
6. Copy the generated token

---

## What Each Key Does

### SUPABASE_ANON_KEY (Public)

-   ✅ Safe for frontend/client code
-   ✅ Limited permissions (RLS enforced)
-   ✅ Can be exposed in browser
-   📍 Use in: React app, mobile app, public APIs

### SUPABASE_SERVICE_ROLE_KEY (Secret)

-   ❌ NEVER expose in frontend
-   ❌ Full database access (bypasses RLS)
-   ❌ Never in client-side code
-   📍 Use in: Edge functions, backend APIs, migrations

### JWT_SECRET (Master Secret)

-   🔒 Used to sign/verify all tokens
-   🔒 If changed, all tokens become invalid
-   🔒 Never commit to Git
-   📍 Store in: Coolify env vars, secure vault

---

## When to Regenerate Keys

### YES - Regenerate if:

-   🚨 Keys were exposed publicly
-   🚨 Security breach suspected
-   🚨 Setting up new environment from scratch
-   🚨 Moving from hosted Supabase to self-hosted

### NO - Keep current keys if:

-   ✅ Working fine and never exposed
-   ✅ No security concerns
-   ✅ Don't want to update all services

---

## How to Update Keys Everywhere

If you do regenerate, update in these locations:

### 1. Coolify (Supabase Service)

```env
JWT_SECRET=new-jwt-secret
ANON_KEY=new-anon-key
SERVICE_ROLE_KEY=new-service-role-key
```

### 2. Coolify (Edge Functions Service)

```env
SUPABASE_ANON_KEY=new-anon-key
SUPABASE_SERVICE_ROLE_KEY=new-service-role-key
```

### 3. GitHub Secrets

```env
VITE_SUPABASE_ANON_KEY=new-anon-key
```

### 4. Local .env Files

```env
VITE_SUPABASE_ANON_KEY=new-anon-key
```

### 5. Restart All Services

-   Supabase
-   Edge Functions
-   Frontend

---

## Quick Test

After updating, test with:

```bash
# Test frontend can connect
curl https://api.agentbio.net/rest/v1/ \
  -H "apikey: YOUR_ANON_KEY"

# Test edge functions
curl https://functions.agentbio.net/health
```

---

## Files Created for You

1. **`generate-supabase-keys.js`** - Script to generate new keys
2. **`SUPABASE_KEYS_GUIDE.md`** - Complete documentation

---

## Example Usage

```bash
# Generate new keys with a random JWT_SECRET
$ node generate-supabase-keys.js

# Or use your existing JWT_SECRET
$ node generate-supabase-keys.js "your-current-jwt-secret"

# Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Supabase JWT Keys Generated Successfully! ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 JWT_SECRET: (your secret here)
🌐 SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIs...
🔒 SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIs...
```

---

## Security Reminder

### ⚠️ Never Expose SERVICE_ROLE_KEY:

-   ❌ Frontend code
-   ❌ Client-side JavaScript
-   ❌ Git repositories
-   ❌ Browser console
-   ❌ Error messages

### ✅ Only Use In:

-   Edge functions (server-side)
-   Backend APIs
-   Database migrations
-   Admin scripts

---

**Your current keys are valid and working. Only regenerate if you have a security concern!**

For questions, see `SUPABASE_KEYS_GUIDE.md` for the full documentation.
