# Quick Fix for Coolify Edge Functions Deployment

## The Problem
Docker build fails with: `"/supabase/functions": not found`

## The Solution

### 1. Update Your Coolify Service Configuration

**In Coolify Dashboard → Your Edge Functions Service:**

#### General Tab
```
Name: edge-functions-server
Base Directory: /
(leave empty or set to /)

Docker Build Stage Target: 
(leave empty)

Dockerfile Location:
(leave empty - will auto-detect "Dockerfile" in root)
```

#### Network Tab
```
Ports Exposes: 8000
Ports Mappings: (leave empty)
```

#### Environment Variables Tab
Add these variables:
```
SUPABASE_URL=https://z4owkscok0o8c40c00co0k8k.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 2. Commit and Push the New Files

```bash
git add Dockerfile .dockerignore DOCKERFILE_DEPLOYMENT_GUIDE.md
git commit -m "Fix: Add Dockerfile in root for Coolify deployment"
git push origin main
```

### 3. Redeploy in Coolify

1. Go to your service in Coolify
2. Click **"Deploy"** button
3. Watch the logs - it should now build successfully

### 4. Test Your Deployment

After deployment succeeds, test it:

```bash
# Replace with your actual domain
curl https://z4owkscok0o8c40c00co0k8k.209.145.59.219.sslip.io/health
```

Expected response:
```json
{
  "status": "ok",
  "functions": 15,
  "available": ["generate-listing-description", "send-listing-generator-email", ...]
}
```

### 5. Update Your Frontend

Once working, update your frontend `.env` file:

```env
# Edge Functions URL
VITE_EDGE_FUNCTIONS_URL=https://z4owkscok0o8c40c00co0k8k.209.145.59.219.sslip.io
```

Or use the direct domain if you've configured one.

## What Changed?

✅ Created `Dockerfile` in repository root (Docker expects this location)  
✅ Created `.dockerignore` to exclude unnecessary files from build  
✅ Added health check to Dockerfile for monitoring  
✅ Ensured Coolify Base Directory is set to `/`  

## Still Not Working?

### Check 1: Verify Coolify Settings
- Base Directory must be `/` or empty
- Don't specify a custom Dockerfile path (let it auto-detect)

### Check 2: Check Build Logs
In Coolify, click "Show Debug Logs" during deployment to see exactly what's failing.

### Check 3: Verify Git Repository
Make sure Coolify is pulling from the correct branch (probably `main`).

### Check 4: Force Rebuild
In Coolify, try clicking "Force Rebuild" to ensure it pulls latest code.

## Accessing Your Edge Functions

Once deployed, your functions will be available at:

```
https://your-domain/[function-name]
```

Examples:
```bash
# Check username availability
POST https://your-domain/check-username
Body: {"username": "testuser"}

# Generate listing description
POST https://your-domain/generate-listing-description
Body: {listing data}

# Submit a lead
POST https://your-domain/submit-lead
Body: {lead data}
```

## Available Functions

Your server hosts these functions:
- generate-listing-description
- send-listing-generator-email
- send-bio-analyzer-email
- send-scheduled-listing-emails
- send-scheduled-bio-emails
- submit-lead
- submit-contact
- stripe-webhook
- create-checkout-session
- check-username
- seo-audit
- generate-article
- generate-social-post

Visit `/health` endpoint to see the full list.

---

**Need more help?** See `DOCKERFILE_DEPLOYMENT_GUIDE.md` for detailed troubleshooting.

