# Edge Functions Deployment for Self-Hosted Supabase

## Current Status
✅ Database migrated to Coolify
✅ SUPABASE_URL and SUPABASE_ANON_KEY updated in .env
⏳ Edge Functions need deployment

## Option 1: Deploy to Deno Deploy (Recommended - Easiest)

Deno Deploy is free for low-medium traffic and works seamlessly with Supabase Edge Functions.

### Steps:

1. **Install Deno** (if not already installed):
   ```powershell
   irm https://deno.land/install.ps1 | iex
   ```

2. **Install Supabase CLI**:
   ```powershell
   npm install -g supabase
   ```

3. **Login to Deno Deploy**:
   ```bash
   deno login
   ```

4. **Deploy each function** (example for one function):
   ```bash
   cd supabase/functions
   deployctl deploy --project=your-project-name ./generate-article/index.ts
   ```

5. **Update your application** to call Deno Deploy URLs instead of Supabase URLs.

## Option 2: Create Express/Fastify Wrapper (Runs on Coolify)

Since you have many functions, we can create a single Node.js/Deno app that hosts all your Edge Functions.

### Steps:

1. Create a `functions-server` directory
2. Set up Express/Fastify to route to your functions
3. Deploy as a Docker container on Coolify
4. Point your app to `http://your-coolify-domain/functions/[function-name]`

Would you like me to create this wrapper?

## Option 3: Use Supabase CLI Locally

Run `supabase start` locally and use ngrok/cloudflare tunnel to expose functions:

```bash
supabase start
supabase functions serve
```

Then use a tunnel service to make it publicly accessible.

## Recommended Approach

For your setup, I recommend **Option 2** - creating a Node.js wrapper that you can deploy on Coolify alongside your Supabase instance. This keeps everything self-hosted and manageable.

### Current Functions Count: 70+ functions

Key functions to prioritize:
1. `generate-listing-description` - Core feature
2. `send-listing-generator-email` - Email capture
3. `send-bio-analyzer-email` - Instagram analyzer
4. `submit-lead` - Lead generation
5. `stripe-webhook` - Payment processing
6. SEO functions - Content optimization

## Next Steps

1. Choose deployment method
2. Set environment variables for functions (SUPABASE_URL, SUPABASE_ANON_KEY, etc.)
3. Update application code to call new function URLs
4. Test critical functions first

Let me know which option you prefer and I'll help implement it!
