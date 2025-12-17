# ✅ Cloudflare Environment Variables - Final Fix

**Date:** December 17, 2025  
**Status:** Code updated to match your Cloudflare configuration

---

## ✅ What I Fixed

1. ✅ Updated code to use `VITE_FUNCTIONS_URL` (matching your Cloudflare config)
2. ✅ Updated local `.env.local` to match
3. ✅ Committed and pushed changes (commit: 7ce5a2f)
4. ⏳ Cloudflare Pages build will trigger automatically

---

## 🎯 What You Need to Do Now

### 1. Update Cloudflare Variables to "Text" Type

Your current variables are all marked as **"Secret"**, but Vite build variables need to be **"Text"** so the build process can read them!

In Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment variables:

Click **"Edit"** and change these from "Secret" to "Text":

| Current Name | Type | Correct Value | Notes |
|--------------|------|---------------|-------|
| `VITE_SUPABASE_URL` | Change to **Text** | `https://api.agentbio.net` | ✅ Keep this name |
| `VITE_SUPABASE_ANON_KEY` | Change to **Text** | `<YOUR_NEW_KEY>` | ⚠️ Need new key! |
| `VITE_FUNCTIONS_URL` | Change to **Text** | `https://functions.agentbio.net` | ✅ Keep this name |
| `VITE_API_BASE_URL` | Change to **Text** | `https://api.agentbio.net` | Optional |
| `RESEND_API` | Keep as **Secret** | (keep current value) | ✅ Correct as Secret |

### Why "Text" not "Secret"?

- Vite embeds `VITE_*` variables into the frontend JavaScript during build
- If they're "Secret", the build process can't read them
- These values end up in the compiled JavaScript anyway (visible in browser)
- Only truly sensitive backend keys should be "Secret" (like `RESEND_API`)

---

## 🔑 CRITICAL: Get Correct ANON_KEY

Your current `VITE_SUPABASE_ANON_KEY` won't work because it was generated for the old Supabase. You need to generate a new one with your self-hosted Supabase JWT_SECRET.

### Steps:

1. **Get JWT_SECRET from your Coolify/Docker Supabase:**

```bash
# Method 1: Coolify Dashboard
Go to: Coolify → Supabase Service → Environment Variables
Find: JWT_SECRET
Copy the value

# Method 2: Docker command
docker exec $(docker ps -q -f name=gotrue) env | grep JWT_SECRET
```

2. **Generate new keys:**

```bash
# Edit generate-supabase-keys.js
# Replace 'YOUR_JWT_SECRET_HERE' with your actual JWT_SECRET

# Run the generator
node generate-supabase-keys.js

# Copy the output VITE_SUPABASE_ANON_KEY
```

3. **Update Cloudflare with the new key**

---

## 📝 Step-by-Step Cloudflare Update

### Step 1: Edit Variables

1. Go to Cloudflare Dashboard
2. Workers & Pages → plain-page-link → Settings
3. Scroll to "Environment variables" section
4. Click **"Edit"** button

### Step 2: Change Each Variable

For **each** `VITE_*` variable:

1. Click the **pencil icon** (edit)
2. Change **Type** dropdown from "Secret" to **"Text"**
3. Update **Value** to correct URL:
   - `VITE_SUPABASE_URL` = `https://api.agentbio.net`
   - `VITE_SUPABASE_ANON_KEY` = `<paste-new-key-from-generator>`
   - `VITE_FUNCTIONS_URL` = `https://functions.agentbio.net`
4. Click **Save**

### Step 3: Save All Changes

Click **"Save"** at the bottom after editing all variables

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Find the latest successful deployment
3. Click **"Retry deployment"**
4. Wait for build to complete

---

## 🧪 Verify After Deployment

### 1. Check Build Logs

Should see environment variables being used during build:
```
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_FUNCTIONS_URL=https://functions.agentbio.net
```

### 2. Check Browser Console

Open `https://agentbio.net` and press F12:

**Should see:**
- ✅ API calls to `api.agentbio.net`
- ✅ No `axoqjwvqxgtzsdmlmnbv.supabase.co` references
- ✅ No `ERR_NAME_NOT_RESOLVED` errors

**Should NOT see:**
- ❌ Requests to old Supabase URL
- ❌ 401 Unauthorized errors
- ❌ Failed to fetch errors

### 3. Test Login

Try logging in - should work without errors!

---

## 📊 Summary of Changes

### What Changed in Code:
```diff
- const EDGE_FUNCTIONS_URL = import.meta.env.VITE_EDGE_FUNCTIONS_URL
+ const EDGE_FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL
```

### What You Need to Change in Cloudflare:

| Variable | Current | New Setting | New Value |
|----------|---------|-------------|-----------|
| `VITE_SUPABASE_URL` | Secret | **Text** | `https://api.agentbio.net` |
| `VITE_SUPABASE_ANON_KEY` | Secret | **Text** | `<new-key-from-generator>` |
| `VITE_FUNCTIONS_URL` | Secret | **Text** | `https://functions.agentbio.net` |

---

## ⚠️ Important Notes

1. **Don't skip the ANON_KEY generation** - the current key won't work
2. **Must change from Secret to Text** - or build won't have access
3. **Must redeploy after changing** - environment variables only apply to new builds
4. **Clear browser cache** after deployment - or you might see old JavaScript

---

## 🔄 Quick Reference

**To generate ANON_KEY:**
```bash
# 1. Get JWT_SECRET from Coolify/Docker
# 2. Edit generate-supabase-keys.js
# 3. Run: node generate-supabase-keys.js
# 4. Copy the VITE_SUPABASE_ANON_KEY output
```

**Cloudflare Settings Path:**
```
Dashboard → Workers & Pages → plain-page-link → Settings → Environment variables → Edit
```

---

**Status:** 
- ✅ Code fixed and pushed
- ⏳ Waiting for you to update Cloudflare env vars
- ⏳ Waiting for you to generate correct ANON_KEY
- ⏳ Waiting for redeploy

