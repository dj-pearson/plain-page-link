# Make.com Integration Guide

## Problem Solved

**Issue**: Make.com was getting a `502 Bad Gateway` error when calling `https://functions.agentbio.net/generate-article`.

**Root Causes**:
1. **CORS blocking** - Make.com webhook origins weren't in the CORS whitelist
2. **No Origin header** - Make.com doesn't send an `Origin` header (server-to-server calls)
3. **Authentication** - Make.com can't use JWT tokens, needs API key authentication

**Solution**: Implemented flexible authentication supporting both JWT (for web app) and API keys (for webhooks).

---

## Setup Steps

### 1. Apply Database Migration

Run the API keys table migration:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Studio
# File: supabase/migrations/20260129_add_api_keys_table.sql
```

### 2. Generate an API Key

Create the key in the dashboard: **Dashboard → API Keys** (`/dashboard/api-keys`),
name it "Make.com Webhook", and copy it. The page calls the `api-keys` edge
function, which stores only a SHA-256 hash and an 8-character prefix.

**IMPORTANT**: Save the API key securely - it won't be shown again!

Example key format: `ab_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890-_abcde`

Do not insert keys into `api_keys` by hand. `key_hash` must hold the SHA-256 of
the key, not the key itself, and the validator (`_shared/api-auth.ts`) accepts
only keys that start with `ab_`. Older instructions here generated `mk_` keys
by SQL; those never authenticated and should be deleted.

### 3. Deploy Updated Edge Functions

Redeploy your edge functions with the updated code:

```bash
# If using Supabase CLI
supabase functions deploy generate-article

# If using Docker/self-hosted
docker compose restart edge-functions

# If using manual deployment
# Re-run your deployment script
```

### 4. Configure Make.com Scenario

#### HTTP Module Settings:

**URL:**
```
https://functions.agentbio.net/generate-article
```

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
x-api-key: YOUR_API_KEY_HERE
```

**Body (JSON):**
```json
{
  "topic": "10 Instagram Marketing Tips for Real Estate Agents",
  "category": "Agent Marketing",
  "keywords": ["instagram marketing", "real estate social media", "agent branding"],
  "customInstructions": "Focus on mobile-first strategies",
  "autoSelectKeyword": true
}
```

#### Screenshot Configuration:

```
┌─────────────────────────────────────────┐
│  HTTP Module (Make an API Key Request)  │
├─────────────────────────────────────────┤
│  URL: https://functions.agentbio.net/generate-article
│  Method: POST                            │
│                                          │
│  Headers:                                │
│  ├─ Content-Type: application/json      │
│  └─ x-api-key: ab_YOUR_KEY_HERE         │
│                                          │
│  Body type: Raw                          │
│  Content type: JSON (application/json)  │
│                                          │
│  Request content:                        │
│  {                                       │
│    "topic": "{{1.topic}}",              │
│    "category": "{{1.category}}",        │
│    "keywords": {{1.keywords}},          │
│    "customInstructions": "{{1.instructions}}"
│  }                                       │
└─────────────────────────────────────────┘
```

---

## Request Parameters

### Required
- None (function will auto-select content)

### Optional
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `topic` | string | Article topic | "Instagram Marketing for Agents" |
| `category` | string | Content category | "Agent Marketing" |
| `keywords` | array | SEO keywords | `["instagram", "marketing"]` |
| `customInstructions` | string | Additional guidance | "Focus on mobile strategies" |
| `autoSelectKeyword` | boolean | Auto-pick unused keywords | `true` |

---

## Response Format

### Success (200)

```json
{
  "success": true,
  "article": {
    "id": "uuid",
    "title": "10 Instagram Marketing Tips for Real Estate Agents",
    "slug": "10-instagram-marketing-tips-for-real-estate-agents",
    "content": "# Article content in Markdown...",
    "excerpt": "Brief summary...",
    "seo_title": "10 Instagram Marketing Tips | AgentBio",
    "seo_description": "Learn powerful Instagram marketing...",
    "seo_keywords": ["instagram marketing", "real estate social media"],
    "category": "Agent Marketing",
    "status": "published",
    "published_at": "2026-01-29T12:00:00Z",
    "created_at": "2026-01-29T12:00:00Z"
  }
}
```

### Error (400/401/500)

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Common Error Codes

| Status | Error | Solution |
|--------|-------|----------|
| **401** | Invalid API key | Check your API key is correct and active |
| **401** | API key expired | Generate a new API key |
| **500** | Missing environment variables | Check SUPABASE_URL, LOVABLE_API_KEY are set |
| **502** | AI service timeout | Retry request, AI took too long to respond |
| **400** | Invalid JSON | Check request body is valid JSON |

---

## Testing

### Test with cURL:

```bash
curl -X POST https://functions.agentbio.net/generate-article \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_KEY_HERE" \
  -d '{
    "topic": "Test Article",
    "category": "Agent Marketing",
    "keywords": ["test", "marketing"]
  }'
```

### Test in Make.com:

1. Create a simple scenario with one HTTP module
2. Configure as shown above
3. Run once
4. Check the output - should see `success: true` and article data

---

## Security Best Practices

### API Key Management

✅ **DO:**
- Store API keys in Make.com "Variables" or "Data Store"
- Use different API keys for different automations
- Set expiration dates on API keys
- Rotate keys regularly (every 90 days)
- Revoke unused keys immediately

❌ **DON'T:**
- Hardcode API keys in scenario descriptions
- Share API keys between users
- Use the same key for dev and production
- Store keys in plain text files

### Rate Limiting (Future Enhancement)

Consider implementing rate limiting in the future:
- Max 100 requests per API key per hour
- Track usage in `api_keys.last_used_at`
- Monitor for suspicious activity

---

## Troubleshooting

### "Invalid API key" Error

**Check:**
1. API key is copied correctly (no extra spaces)
2. API key exists in database: `SELECT * FROM api_keys WHERE key_hash = 'YOUR_KEY';`
3. API key is active: `is_active = true`
4. API key hasn't expired: `expires_at IS NULL OR expires_at > NOW()`

### "CORS Error" in Browser (not Make.com)

If testing in browser/Postman and seeing CORS errors:
- CORS is configured for webhooks (no Origin header)
- Browser requests need proper CORS - use the web app instead
- Make.com should NOT get CORS errors (server-to-server)

### "502 Bad Gateway"

**Possible causes:**
1. Edge function container not running
2. AI service (LOVABLE_API_KEY) timeout
3. Missing environment variables
4. Network connectivity issue

**Check:**
```bash
# Test if function is reachable
curl https://functions.agentbio.net/health

# Check edge function logs
docker logs edge-functions-container
# OR
supabase functions logs generate-article
```

### Articles Not Appearing in Dashboard

**Check:**
1. `author_id` in response matches a real user
2. Article status is `published`
3. RLS policies allow viewing: `SELECT * FROM articles WHERE id = 'article_id';`

---

## Advanced: Multiple API Keys

Create API keys for different purposes:

```sql
-- Make.com Article Generation
INSERT INTO api_keys (user_id, name, key_hash, description, scopes)
VALUES (
  'user-id',
  'Make.com Articles',
  'mk_articles_...',
  'Automated article generation',
  ARRAY['generate-article']::text[]
);

-- Zapier Social Posts
INSERT INTO api_keys (user_id, name, key_hash, description, scopes)
VALUES (
  'user-id',
  'Zapier Social',
  'mk_social_...',
  'Social media automation',
  ARRAY['generate-social-post', 'publish-article-to-social']::text[]
);

-- n8n SEO Audits
INSERT INTO api_keys (user_id, name, key_hash, description, scopes)
VALUES (
  'user-id',
  'n8n SEO',
  'mk_seo_...',
  'SEO monitoring automation',
  ARRAY['seo-audit', 'run-scheduled-audit']::text[]
);
```

---

## What Changed?

### Files Modified:

1. **`supabase/functions/_shared/cors.ts`**
   - Added Make.com webhook origins
   - Handle requests without `Origin` header (webhooks)

2. **`supabase/functions/_shared/webhook-auth.ts`** *(NEW)*
   - API key validation logic
   - Flexible auth (JWT or API key)

3. **`supabase/functions/generate-article/index.ts`**
   - Import `flexibleAuth` helper
   - Replace `requireAuth` with `flexibleAuth`

4. **`supabase/migrations/20260129_add_api_keys_table.sql`** *(NEW)*
   - API keys table schema
   - RLS policies

---

## Next Steps

### For Admin Panel Enhancement:

Create a UI for managing API keys:

**File: `src/components/admin/APIKeysManager.tsx`**

Features:
- ✅ List all API keys
- ✅ Generate new API key
- ✅ Revoke/deactivate key
- ✅ View last used timestamp
- ✅ Set expiration date

### For Other Edge Functions:

Apply the same pattern to other functions that webhooks might call:

```typescript
import { flexibleAuth } from '../_shared/webhook-auth.ts';

// In your function:
const userId = await flexibleAuth(req, supabase);
if (!userId) {
  // Handle unauthenticated request
}
```

---

## Support

**Getting 502 errors?**
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review edge function logs
3. Test with cURL first before Make.com

**Need help?**
- Check [EDGE_FUNCTIONS_TODO.md](./EDGE_FUNCTIONS_TODO.md) for all functions
- Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed specs

---

## Summary

✅ **CORS** - Fixed for webhook/server-to-server requests  
✅ **Authentication** - API keys implemented for Make.com  
✅ **Migration** - Database table for API key storage  
✅ **Documentation** - Complete setup guide  

**You can now call `generate-article` from Make.com using an API key!** 🎉
