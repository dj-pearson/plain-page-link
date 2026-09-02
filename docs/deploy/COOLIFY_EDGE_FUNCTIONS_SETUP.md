# Deploy Edge Functions to Coolify

## Prerequisites
✅ Database migrated to Coolify
✅ Supabase running on Coolify
✅ Files created: edge-functions.Dockerfile, edge-functions-server.ts

## Step-by-Step Deployment

### 1. Push Files to GitHub

Make sure these files are committed and pushed:
```bash
git add edge-functions.Dockerfile edge-functions-server.ts
git commit -m "Add Edge Functions server for Coolify"
git push
```

### 2. Create New Resource in Coolify

1. Go to your Coolify dashboard: https://your-coolify-domain
2. Navigate to your existing project (where Supabase is)
3. Click **"+ New Resource"**
4. Select **"Dockerfile"**

### 3. Configure the Resource

**General Settings:**
- **Name**: `edge-functions-server`
- **Source**: Select your GitHub repository `dj-pearson/plain-page-link`
- **Branch**: `main`
- **Dockerfile**: `edge-functions.Dockerfile`
- **Port**: `8000`

**Environment Variables:**
Add these in Coolify's environment variables section:

```env
SUPABASE_URL=https://supabasekong-rwwccs4k8o8kog4s0w4ggggg.209.145.59.219.sslip.io
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2NTAzOTk4MCwiZXhwIjo0OTIwNzEzNTgwLCJyb2xlIjoiYW5vbiJ9.QhDHf45z3FazBIiYTGKO43KBquCaOjIjqhGmWSJw2Ms
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Network Settings:**
- **Domain**: Add a subdomain like `functions.yourdomain.com` or use the auto-generated one
- **Ports**: 8000:8000

### 4. Deploy

1. Click **"Save"**
2. Click **"Deploy"**
3. Wait for the build to complete (2-3 minutes)
4. Check the logs to ensure it started successfully

You should see:
```
🚀 Edge Functions Server starting on port 8000...
📦 Loaded XX functions
🔗 Supabase URL: https://...
```

### 5. Test the Deployment

Once deployed, test the health endpoint:
```bash
curl https://your-functions-domain/health
```

Should return:
```json
{
  "status": "ok",
  "functions": 13,
  "available": ["generate-listing-description", "submit-lead", ...]
}
```

### 6. Update Your Application

Update your application code to call the new functions URL:

**Before:**
```typescript
const { data } = await supabase.functions.invoke('generate-listing-description', {
  body: { ... }
});
```

**After:**
```typescript
const response = await fetch('https://your-functions-domain/generate-listing-description', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`
  },
  body: JSON.stringify({ ... })
});
const data = await response.json();
```

Or add to your .env:
```env
FUNCTIONS_URL=https://your-functions-domain
```

## Troubleshooting

### Build Fails
- Check Dockerfile path is correct
- Ensure all files are committed to Git
- Check Coolify logs for specific error

### Function Not Found
- Verify function is added to FUNCTIONS_MAP in edge-functions-server.ts
- Check function directory structure matches

### CORS Errors
- CORS headers are already configured in the server
- If issues persist, check your application's request headers

### Environment Variables
- Make sure SUPABASE_SERVICE_ROLE_KEY is set (get from Coolify Supabase settings)
- Verify SUPABASE_URL matches your Kong URL

## Adding More Functions

To add more functions to the server, edit `edge-functions-server.ts`:

```typescript
const FUNCTIONS_MAP: { [key: string]: string } = {
  // ... existing functions
  "your-new-function": "./functions/your-new-function/index.ts",
};
```

Then redeploy in Coolify.

## Monitoring

- **Logs**: View in Coolify dashboard under your edge-functions-server resource
- **Health Check**: `https://your-functions-domain/health`
- **Metrics**: Check Coolify's built-in monitoring

## Security Notes

- Functions use JWT verification based on config.toml settings
- SUPABASE_SERVICE_ROLE_KEY should be kept secret
- Consider adding rate limiting for production use
