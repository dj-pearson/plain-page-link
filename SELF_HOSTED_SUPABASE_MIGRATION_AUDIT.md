# Self-Hosted Supabase Migration Audit

**Generated:** 2025-12-18
**Updated:** 2025-12-18 (Migration Complete)
**Purpose:** Document all references to Supabase cloud (supabase.co) and environment variables for self-hosted migration

## Migration Status: COMPLETE

All critical code and documentation files have been updated to use self-hosted Supabase URLs:
- **API/Auth/Storage:** `https://api.agentbio.net`
- **Edge Functions:** `https://functions.agentbio.net`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Code Files Requiring Updates](#code-files-requiring-updates)
3. [Environment Variables Reference](#environment-variables-reference)
4. [Edge Functions Analysis](#edge-functions-analysis)
5. [Frontend Configuration](#frontend-configuration)
6. [Mobile Native App Configuration](#mobile-native-app-configuration)
7. [Documentation Updates Needed](#documentation-updates-needed)
8. [Action Items](#action-items)

---

## Executive Summary

### Current State
- **Total Edge Functions:** 76 functions
- **Files with supabase.co references (code):** 2 files requiring updates
- **Files with supabase.co references (docs):** 15+ documentation files (examples/placeholders)
- **Total unique environment variables:** 48

### Self-Hosted Configuration Already in Place
The main frontend Supabase client (`src/integrations/supabase/client.ts`) is **already configured** for self-hosted deployment with:
- `VITE_SUPABASE_URL` for API subdomain (Kong gateway)
- `VITE_FUNCTIONS_URL` for Edge Functions subdomain
- Proper fallback handling

### Key Routing for Self-Hosted Supabase
| Service | Cloud URL Pattern | Self-Hosted URL |
|---------|-------------------|-----------------|
| REST API, Auth, Storage | `*.supabase.co` | `https://api.agentbio.net` |
| Edge Functions | `*.supabase.co/functions/v1` | `https://functions.agentbio.net` |
| Database (Postgres) | `db.*.supabase.co:5432` | Configure in server |

---

## Code Files Requiring Updates

### 1. `src/lib/image-seo.ts` - **REQUIRES FIX**

**Lines 155 and 174** contain hardcoded supabase.co checks:

```typescript
// Line 155
if (url.includes('.supabase.co/storage')) return true;

// Line 174
if (url.includes('.supabase.co/storage')) {
```

**Fix Required:**
```typescript
// Line 155 - Update to detect self-hosted storage URLs
if (url.includes('.supabase.co/storage') || url.includes('api.agentbio.net/storage')) return true;

// Line 174 - Update to detect self-hosted storage URLs
if (url.includes('.supabase.co/storage') || url.includes('api.agentbio.net/storage')) {
```

**Alternative (Recommended):** Use environment variable for detection:
```typescript
const STORAGE_DOMAIN = import.meta.env.VITE_SUPABASE_URL;
if (url.includes('/storage')) return true;
```

### 2. `src/components/ui/OptimizedImage.tsx` - **DOCUMENTATION ONLY**

**Line 278** contains a comment with example URL:
```typescript
// https://your-project.supabase.co/storage/v1/render/image/public/bucket/path?width=400&format=webp
```

**Status:** This is just a comment/documentation. No functional code change required, but should be updated for clarity.

---

## Environment Variables Reference

### Frontend Variables (VITE_*)

| Variable | Required | Description | File Location |
|----------|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | **Yes** | Self-hosted API URL (Kong) | `src/integrations/supabase/client.ts` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous/public key | `src/integrations/supabase/client.ts` |
| `VITE_FUNCTIONS_URL` | **Yes** | Edge Functions URL | `src/integrations/supabase/client.ts` |
| `VITE_APP_URL` | Recommended | Application URL | `src/lib/constants.ts` |
| `VITE_API_URL` | Optional | Backend API URL | `src/lib/constants.ts` |

#### Firebase (Optional - Push Notifications)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | If using FCM | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | If using FCM | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | If using FCM | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | If using FCM | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | If using FCM | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | If using FCM | Firebase app ID |
| `VITE_FIREBASE_VAPID_KEY` | If using FCM | VAPID key for web push |

#### Search Analytics OAuth (Optional)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | If using GSC | Google OAuth client ID |
| `VITE_MICROSOFT_CLIENT_ID` | If using Bing | Microsoft OAuth client ID |
| `VITE_YANDEX_CLIENT_ID` | If using Yandex | Yandex OAuth client ID |

---

### Edge Function Variables (Deno.env.get)

#### Core Supabase (Required for ALL functions)
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | **Yes** | Self-hosted Supabase URL | All 76 functions |
| `SUPABASE_ANON_KEY` | Some functions | Public/anon key | 9 functions |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Admin service role key | 60+ functions |

#### AI/Content Generation APIs
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `LOVABLE_API_KEY` | **Yes** | Lovable AI for content generation | 7 functions |
| `OPENAI_API_KEY` | Some features | OpenAI GPT models | 3 functions |
| `CLAUDE_API_KEY` | Optional | Anthropic Claude API | 1 function |
| `AI_MODEL` | Optional | Default AI model ID | 1 function |

**Functions using LOVABLE_API_KEY:**
- `generate-article`
- `generate-blog-content`
- `generate-content-suggestions`
- `generate-social-post`
- `manage-blog-titles`
- `publish-article-to-social`
- `test-ai-model`

**Functions using OPENAI_API_KEY:**
- `apply-seo-autofix`
- `generate-listing-description`
- `optimize-page-content`

**Functions using CLAUDE_API_KEY:**
- `generate-marketing-post`

#### Payment Processing
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | If using payments | Stripe API secret | `create-checkout-session`, `stripe-webhook` |
| `STRIPE_WEBHOOK_SECRET` | If using payments | Webhook signing secret | `stripe-webhook` |

#### Email Services
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `RESEND_API_KEY` | For emails | Resend email service | 5 functions |
| `FROM_EMAIL` | For emails | Sender email address | Multiple (default: `noreply@agentbio.net`) |
| `AGENT_EMAIL` | For notifications | Admin notification email | `_shared/email.ts` |

**Functions using RESEND_API_KEY:**
- `send-welcome-email`
- `send-scheduled-listing-emails`
- `send-scheduled-bio-emails`
- `send-listing-generator-email`
- `send-bio-analyzer-email`

#### Google Services
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | For GSC/GA | Google OAuth client ID | 4 functions |
| `GOOGLE_CLIENT_SECRET` | For GSC/GA | Google OAuth secret | 4 functions |
| `GOOGLE_REDIRECT_URI` | For GSC | GSC OAuth redirect | `gsc-oauth` |
| `GOOGLE_ANALYTICS_REDIRECT_URI` | For GA | GA OAuth redirect | `google-analytics-oauth-callback` |
| `PAGESPEED_INSIGHTS_API_KEY` | For SEO | PageSpeed API key | 2 functions |
| `PAGESPEED_API_KEY` | For SEO | Alternative name | 2 functions |
| `CHROME_UX_API_KEY` | For CWV | Chrome UX Report API | 1 function |

**Functions using Google OAuth:**
- `gsc-oauth`
- `gsc-sync-data`
- `gsc-fetch-properties`
- `gsc-fetch-core-web-vitals`
- `google-analytics-oauth-callback`
- `google-analytics-sync`

#### Microsoft/Bing Services
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `MICROSOFT_CLIENT_ID` | For Bing | Microsoft OAuth client ID | 2 functions |
| `MICROSOFT_CLIENT_SECRET` | For Bing | Microsoft OAuth secret | 2 functions |
| `BING_WEBMASTER_REDIRECT_URI` | For Bing | Bing OAuth redirect | `bing-webmaster-oauth-callback` |

**Functions using Microsoft:**
- `bing-webmaster-oauth-callback`
- `bing-webmaster-sync`

#### Yandex Services
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `YANDEX_CLIENT_ID` | For Yandex | Yandex OAuth client ID | 2 functions |
| `YANDEX_CLIENT_SECRET` | For Yandex | Yandex OAuth secret | 2 functions |
| `YANDEX_WEBMASTER_REDIRECT_URI` | For Yandex | Yandex OAuth redirect | `yandex-webmaster-oauth-callback` |

**Functions using Yandex:**
- `yandex-webmaster-oauth-callback`
- `yandex-webmaster-sync`

#### Caching & Rate Limiting
| Variable | Required | Description | Used In |
|----------|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | For rate limiting | Upstash Redis URL | `rate-limit` |
| `UPSTASH_REDIS_REST_TOKEN` | For rate limiting | Upstash Redis token | `rate-limit` |

#### URL Configuration
| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SITE_URL` | Recommended | Primary site URL | `https://agentbio.net` |
| `APP_URL` | For SSO | Application URL | `https://agentbio.net` |
| `PUBLIC_SITE_URL` | For SEO | Public site URL | `https://example.com` |
| `ENVIRONMENT` | For CORS | Deployment environment | (none - production assumed) |

---

## Edge Functions Analysis

### Function Patterns

All 76 edge functions follow a consistent pattern for Supabase initialization:

```typescript
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
```

**This is correct** - functions use environment variables, not hardcoded URLs.

### CORS Configuration (`_shared/cors.ts`)

The CORS configuration is **already properly configured**:

```typescript
const ALLOWED_ORIGINS = [
  'https://agentbio.net',
  'https://www.agentbio.net',
  // Add development origins only in non-production
  ...(Deno.env.get('ENVIRONMENT') === 'development'
    ? ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173']
    : [])
];
```

**No changes needed** for production self-hosted deployment.

### Edge Function Dependencies

All functions import from:
- `https://deno.land/std@0.168.0/http/server.ts`
- `https://esm.sh/@supabase/supabase-js@2.39.3`

These are external CDNs, which is correct for Deno edge functions.

---

## Frontend Configuration

### Current Configuration Status

| Component | Status | Location |
|-----------|--------|----------|
| Supabase Client | Configured | `src/integrations/supabase/client.ts` |
| CORS Headers | N/A (backend) | `supabase/functions/_shared/cors.ts` |
| Firebase Push | Configured | `src/lib/push-notifications.ts` |
| Image SEO | **NEEDS UPDATE** | `src/lib/image-seo.ts` |

### Frontend Supabase Client Configuration

```typescript
// Already correctly configured for self-hosted
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL;

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_PUBLISHABLE_KEY,
  functionsUrl: EDGE_FUNCTIONS_URL || `${SUPABASE_URL}/functions/v1`,
};
```

---

## Mobile Native App Configuration

### File: `mobile-native-js/src/services/supabase.js`

**Status:** Uses environment variables (no hardcoding):

```javascript
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
```

**Required .env for mobile app:**
```env
SUPABASE_URL=https://api.agentbio.net
SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Documentation Updates Needed

The following documentation files contain example `supabase.co` URLs that should be updated to reflect self-hosted configuration:

| File | Type | Priority |
|------|------|----------|
| `COOLIFY_MIGRATION_GUIDE.md` | Guide | High |
| `COOLIFY_QUICK_FIX.md` | Guide | High |
| `DOCKERFILE_DEPLOYMENT_GUIDE.md` | Guide | High |
| `EXECUTION_ROADMAP.md` | Roadmap | Medium |
| `IMPLEMENTATION_ROADMAP.md` | Roadmap | Medium |
| `INSTAGRAM_BIO_ANALYZER_RESEND_INTEGRATION.md` | Integration | Medium |
| `LISTING_DESCRIPTION_GENERATOR_SETUP.md` | Setup | Medium |
| `PRODUCTION_READINESS_AUDIT.md` | Audit | Medium |
| `SECURITY_AUDIT_COMPREHENSIVE.md` | Security | High |
| `SECURITY_AUDIT_REMEDIATION.md` | Security | High |
| `SEO_DUPLICATION_GUIDE.md` | Guide | Low |
| `supabase/functions/README.md` | API Docs | Medium |
| `supabase/functions/INSTAGRAM_BIO_ANALYZER_SETUP.md` | Setup | Medium |
| `mobile-native-js/README.md` | Mobile Setup | Medium |

---

## Action Items

### Priority 1: Code Fixes Required - COMPLETED

1. **`src/lib/image-seo.ts`** (Lines 155, 174) - **FIXED**
   - Updated to detect both `.supabase.co/storage` and `/storage/v1/` patterns
   - Works with both cloud and self-hosted Supabase storage

2. **`index.html` and `public/_headers`** - **FIXED**
   - Updated CSP headers to use self-hosted domains
   - Removed generic `*.supabase.co` wildcards

3. **Documentation files updated:**
   - COOLIFY_MIGRATION_GUIDE.md
   - COOLIFY_QUICK_FIX.md
   - DOCKERFILE_DEPLOYMENT_GUIDE.md
   - EXECUTION_ROADMAP.md
   - SECURITY_AUDIT_COMPREHENSIVE.md
   - SECURITY_AUDIT_REMEDIATION.md
   - INSTAGRAM_BIO_ANALYZER_RESEND_INTEGRATION.md
   - LISTING_DESCRIPTION_GENERATOR_SETUP.md
   - IMPLEMENTATION_ROADMAP.md
   - SEO_DUPLICATION_GUIDE.md
   - PRODUCTION_READINESS_AUDIT.md
   - supabase/functions/README.md
   - supabase/functions/INSTAGRAM_BIO_ANALYZER_SETUP.md
   - mobile-native-js/README.md

### Priority 2: Environment Variable Configuration

Create/update `.env.local` with all required variables:

```env
# =============================================================================
# REQUIRED - Self-Hosted Supabase
# =============================================================================
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_FUNCTIONS_URL=https://functions.agentbio.net
VITE_APP_URL=https://agentbio.net

# =============================================================================
# EDGE FUNCTION SECRETS (Set in Supabase/Coolify dashboard)
# =============================================================================
# SUPABASE_URL=https://api.agentbio.net
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI APIs
# LOVABLE_API_KEY=your-lovable-key
# OPENAI_API_KEY=your-openai-key
# CLAUDE_API_KEY=your-claude-key

# Email
# RESEND_API_KEY=your-resend-key
# FROM_EMAIL=noreply@agentbio.net
# AGENT_EMAIL=admin@agentbio.net

# Payments
# STRIPE_SECRET_KEY=your-stripe-secret
# STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Google Services
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_REDIRECT_URI=https://agentbio.net/auth/google/callback
# PAGESPEED_INSIGHTS_API_KEY=your-pagespeed-key

# Microsoft/Bing
# MICROSOFT_CLIENT_ID=your-microsoft-client-id
# MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
# BING_WEBMASTER_REDIRECT_URI=https://agentbio.net/auth/bing/callback

# Yandex
# YANDEX_CLIENT_ID=your-yandex-client-id
# YANDEX_CLIENT_SECRET=your-yandex-client-secret

# Rate Limiting (Optional)
# UPSTASH_REDIS_REST_URL=your-upstash-url
# UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Environment
# ENVIRONMENT=production
# SITE_URL=https://agentbio.net
# APP_URL=https://agentbio.net
```

### Priority 3: Documentation Updates

Update all documentation files listed above to use self-hosted URLs:
- Replace `your-project.supabase.co` with `api.agentbio.net`
- Replace `your-project.supabase.co/functions/v1` with `functions.agentbio.net`

### Priority 4: Verification Checklist

After migration, verify:
- [ ] Frontend connects to `api.agentbio.net` for REST/Auth/Storage
- [ ] Edge functions accessible via `functions.agentbio.net`
- [ ] Image uploads work with self-hosted storage
- [ ] WebP transformation detection works
- [ ] OAuth redirects work for Google/Bing/Yandex
- [ ] Email sending works via Resend
- [ ] Stripe webhooks receive events
- [ ] AI content generation works

---

## Summary

### What's Already Correct
- Frontend Supabase client uses environment variables
- All 76 edge functions use `Deno.env.get()` for URLs
- CORS configuration whitelists `agentbio.net`
- Mobile app uses environment variables

### What Needs Fixing
1. **`src/lib/image-seo.ts`** - 2 lines with hardcoded `.supabase.co` checks
2. **Documentation** - 15+ files with example URLs

### Environment Variables Summary
- **Frontend (VITE_*):** 15 variables (4 required, 11 optional)
- **Edge Functions:** 33 variables (3 required, 30 optional per feature)
- **Total unique:** 48 variables

This audit provides a complete picture of the migration requirements for self-hosted Supabase deployment.
