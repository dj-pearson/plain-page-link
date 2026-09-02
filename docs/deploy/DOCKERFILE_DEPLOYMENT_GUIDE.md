# Edge Functions Dockerfile Deployment Guide for Coolify

## Problem Summary

When deploying the Edge Functions service to Coolify, Docker build fails with errors like:

```
ERROR: failed to calculate checksum: "/supabase/functions": not found
ERROR: failed to calculate checksum: "/edge-functions-server.ts": not found
```

This happens because Docker can't find the files during the COPY commands.

## Root Cause

The issue occurs when:

1. The Dockerfile is not in the repository root
2. The build context doesn't include necessary files
3. Coolify's base directory is misconfigured
4. The `.dockerignore` is blocking required files

## Solution

### Step 1: Use the Correct Dockerfile

The repository now has a `Dockerfile` in the root directory (as well as `edge-functions.Dockerfile` as a backup).

### Step 2: Configure Coolify Correctly

In your Coolify service configuration:

#### General Tab:

-   **Name**: `edge-functions-server` (or whatever you prefer)
-   **Base Directory**: `/` (leave as root, or leave blank)
-   **Dockerfile Location**: `Dockerfile` (or blank if in root)

#### Network Tab:

-   **Ports Exposes**: `8000`
-   **Ports Mappings**: Leave blank (Coolify handles this)

#### Environment Variables:

Add these required environment variables:

```
SUPABASE_URL=https://api.agentbio.net
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Verify Build Context

The Dockerfile uses these files (all must be accessible):

-   `supabase/functions/` (directory with all edge functions)
-   `supabase/config.toml` (Supabase config)
-   `edge-functions-server.ts` (main server file)

All these files exist in your repository root.

### Step 4: Test Build Locally (Optional)

Before deploying to Coolify, test locally:

```bash
# Build the image
docker build -t edge-functions-test -f Dockerfile .

# Run it locally
docker run -p 8000:8000 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  edge-functions-test

# Test it
curl http://localhost:8000/health
```

You should see:

```json
{
  "status": "ok",
  "functions": 15,
  "available": ["generate-listing-description", "send-listing-generator-email", ...]
}
```

### Step 5: Deploy to Coolify

1. **Commit changes**:

    ```bash
    git add Dockerfile .dockerignore
    git commit -m "Add Dockerfile and .dockerignore for edge functions"
    git push
    ```

2. **In Coolify**:

    - Go to your edge functions service
    - Click "General" tab
    - Verify "Base Directory" is `/` or empty
    - Make sure no custom "Dockerfile Location" is set (or set to `Dockerfile`)
    - Click "Save"
    - Click "Deploy" or trigger a redeploy

3. **Watch the logs**:
    - The build should now succeed
    - Look for: `🚀 Edge Functions Server starting on port 8000...`

### Step 6: Configure Traefik/Caddy Labels (if needed)

If you're using the Traefik labels shown in your screenshot, make sure they match your domain. The labels should auto-configure based on your Coolify domain settings.

### Step 7: Test the Deployed Service

Once deployed, test your edge functions:

```bash
# Health check
curl https://your-domain.sslip.io/health

# Test a specific function (example)
curl -X POST https://your-domain.sslip.io/check-username \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'
```

## Troubleshooting

### Build Still Fails with "not found" errors

**Check 1: Verify files exist locally**

```bash
ls -la edge-functions-server.ts
ls -la supabase/functions/
ls -la supabase/config.toml
```

**Check 2: Verify Coolify's git sync**

-   In Coolify, check the "Source" tab
-   Make sure the repository is pulling from the correct branch
-   Try clicking "Force Rebuild" to ensure fresh git pull

**Check 3: Check .dockerignore**
Make sure `.dockerignore` doesn't exclude required files. The provided `.dockerignore` is safe.

### Build Succeeds but Container Crashes

**Check 1: Environment Variables**
Make sure all required env vars are set in Coolify:

-   SUPABASE_URL
-   SUPABASE_ANON_KEY
-   SUPABASE_SERVICE_ROLE_KEY

**Check 2: Check Container Logs**
In Coolify, click "Logs" to see runtime errors.

**Common issues:**

-   Missing environment variables
-   Port conflicts (make sure port 8000 is exposed)
-   Function import errors (check individual function files)

### Service Unreachable After Deployment

**Check 1: Port Configuration**

-   Ports Exposes should be: `8000`
-   The service should show as "Running" in Coolify

**Check 2: Domain/DNS**

-   Make sure your domain is correctly configured
-   Check the generated Traefik/Caddy labels
-   Try accessing via the Coolify-generated domain first

**Check 3: Health Check**
The Dockerfile includes a health check. If it fails, the container will be marked unhealthy.

Check with:

```bash
docker ps
# Look for (healthy) or (unhealthy) status
```

## Alternative: Using docker-compose (if preferred)

If you prefer to use docker-compose with Coolify, here's a sample `docker-compose.yml`:

```yaml
version: "3.8"

services:
    edge-functions:
        build:
            context: .
            dockerfile: Dockerfile
        ports:
            - "8000:8000"
        environment:
            - SUPABASE_URL=${SUPABASE_URL}
            - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
            - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
        restart: unless-stopped
        healthcheck:
            test:
                [
                    "CMD",
                    "deno",
                    "eval",
                    "fetch('http://localhost:8000/health').then(r => r.ok ? Deno.exit(0) : Deno.exit(1))",
                ]
            interval: 30s
            timeout: 3s
            retries: 3
            start_period: 5s
```

Then in Coolify, change the service type to "Docker Compose" and point it to this file.

## Summary

The key fixes were:

1. ✅ Created `Dockerfile` in repository root (proper location)
2. ✅ Created `.dockerignore` to exclude unnecessary files
3. ✅ Added health check to Dockerfile
4. ✅ Verified all required files are in the repository
5. ✅ Ensured Base Directory is `/` or empty in Coolify

After following these steps, your Edge Functions should deploy successfully to Coolify!

## Next Steps

After successful deployment:

1. Update your frontend to point to this edge functions URL
2. Test each edge function endpoint
3. Monitor logs for any runtime errors
4. Set up monitoring/alerting for the service

## Need Help?

If issues persist:

1. Check Coolify logs (both build and runtime)
2. Verify all files are in the git repository
3. Test Docker build locally first
4. Check Coolify documentation for service-specific requirements
