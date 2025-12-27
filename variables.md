# Environment Variables Reference

**Last Updated:** 2025-12-27
**Platform:** AgentBio Intelligence

This document provides a comprehensive reference of all environment variables used across the AgentBio platform, including frontend (Vite), Supabase Edge Functions, and build configurations.

---

## Table of Contents

1. [Frontend Variables (Vite)](#frontend-variables-vite)
2. [Supabase Edge Function Secrets](#supabase-edge-function-secrets)
3. [Variable Quick Reference](#variable-quick-reference)
4. [Setup Instructions](#setup-instructions)

---

## Frontend Variables (Vite)

These variables are used in the client-side React application. They must be prefixed with `VITE_` to be exposed to the browser. Set these in `.env.local` for local development or in your deployment platform (Cloudflare Pages).

### Core Supabase Configuration

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `VITE_SUPABASE_URL` | **Yes** | URL | Supabase project API URL (e.g., `https://api.agentbio.net`) | `src/integrations/supabase/client.ts` |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | String | Supabase anonymous/public key | `src/integrations/supabase/client.ts` |
| `VITE_FUNCTIONS_URL` | No | URL | Custom Edge Functions URL. If not set, uses `VITE_SUPABASE_URL/functions/v1` | `src/integrations/supabase/client.ts` |

### Application Configuration

| Variable | Required | Type | Description | Default | Used In |
|----------|----------|------|-------------|---------|---------|
| `VITE_APP_URL` | No | URL | Main application URL | `https://agentbio.net` | `src/lib/utils.ts`, `src/lib/constants.ts`, `src/lib/url-validation.ts` |
| `VITE_API_URL` | No | URL | Backend API URL | `http://localhost:8000/api` | `src/lib/constants.ts` |
| `VITE_ANALYTICS_ENABLED` | No | Boolean String | Enable/disable analytics | - | `src/vite-env.d.ts` |

### Stripe Configuration

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | String | Stripe publishable key (`pk_live_...` or `pk_test_...`) | `.env.example` |
| `VITE_STRIPE_PUBLIC_KEY` | No | String | Alternative name for Stripe public key | `src/vite-env.d.ts` |

### Firebase Configuration (Push Notifications)

These are required only if using push notifications via Firebase Cloud Messaging (FCM).

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Conditional | String | Firebase API key | `src/lib/push-notifications.ts` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Conditional | String | Firebase auth domain | `src/lib/push-notifications.ts` |
| `VITE_FIREBASE_PROJECT_ID` | Conditional | String | Firebase project ID | `src/lib/push-notifications.ts` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Conditional | String | Firebase storage bucket | `src/lib/push-notifications.ts` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Conditional | String | Firebase messaging sender ID | `src/lib/push-notifications.ts` |
| `VITE_FIREBASE_APP_ID` | Conditional | String | Firebase app ID | `src/lib/push-notifications.ts` |
| `VITE_FIREBASE_VAPID_KEY` | Conditional | String | Firebase VAPID key for web push | `src/lib/push-notifications.ts` |

### Search Engine Integration (OAuth)

Used for connecting to search engine webmaster tools in the analytics features.

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `VITE_GOOGLE_CLIENT_ID` | No | String | Google OAuth client ID | `src/hooks/useSearchAnalytics.ts` |
| `VITE_MICROSOFT_CLIENT_ID` | No | String | Microsoft OAuth client ID | `src/hooks/useSearchAnalytics.ts` |
| `VITE_YANDEX_CLIENT_ID` | No | String | Yandex OAuth client ID | `src/hooks/useSearchAnalytics.ts` |

### Other Frontend Variables

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `VITE_GOOGLE_MAPS_API_KEY` | No | String | Google Maps API key | `src/vite-env.d.ts` |

---

## Supabase Edge Function Secrets

These variables must be set as **Supabase Edge Function Secrets** via the Supabase Dashboard:
`Dashboard → Settings → Edge Functions → Secrets`

### Core Supabase (Auto-Injected)

These are automatically available in all Edge Functions - you don't need to set them manually.

| Variable | Type | Description |
|----------|------|-------------|
| `SUPABASE_URL` | URL | Supabase project URL (auto-injected) |
| `SUPABASE_ANON_KEY` | String | Supabase anonymous key (auto-injected) |
| `SUPABASE_SERVICE_ROLE_KEY` | String | Supabase service role key (auto-injected) |

### Stripe Integration

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `STRIPE_SECRET_KEY` | **Yes** | String | Stripe secret key (`sk_live_...` or `sk_test_...`) | `stripe-webhook`, `create-checkout-session`, `create-portal-session`, `create-stripe-customer` |
| `STRIPE_WEBHOOK_SECRET` | **Yes** | String | Stripe webhook signing secret (`whsec_...`) | `stripe-webhook` |
| `STRIPE_PRICE_STARTER_MONTHLY` | No | String | Stripe price ID for Starter monthly plan | `stripe-webhook` |
| `STRIPE_PRICE_STARTER_YEARLY` | No | String | Stripe price ID for Starter yearly plan | `stripe-webhook` |
| `STRIPE_PRICE_PROFESSIONAL_MONTHLY` | No | String | Stripe price ID for Professional monthly plan | `stripe-webhook` |
| `STRIPE_PRICE_PROFESSIONAL_YEARLY` | No | String | Stripe price ID for Professional yearly plan | `stripe-webhook` |
| `STRIPE_PRICE_TEAM_MONTHLY` | No | String | Stripe price ID for Team monthly plan | `stripe-webhook` |
| `STRIPE_PRICE_TEAM_YEARLY` | No | String | Stripe price ID for Team yearly plan | `stripe-webhook` |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | No | String | Stripe price ID for Enterprise monthly plan | `stripe-webhook` |
| `STRIPE_PRICE_ENTERPRISE_YEARLY` | No | String | Stripe price ID for Enterprise yearly plan | `stripe-webhook` |

### Email (Resend)

| Variable | Required | Type | Description | Default | Used In |
|----------|----------|------|-------------|---------|---------|
| `RESEND_API_KEY` | **Yes** | String | Resend API key for transactional emails | - | `_shared/email.ts`, `send-bio-analyzer-email`, `send-listing-generator-email`, `send-scheduled-listing-emails` |
| `FROM_EMAIL` | No | String | From email address for outgoing emails | `noreply@agentbio.net` | `_shared/email.ts`, email functions |
| `AGENT_EMAIL` | No | String | Agent notification email recipient | - | `_shared/email.ts` |

### Site/App Configuration

| Variable | Required | Type | Description | Default | Used In |
|----------|----------|------|-------------|---------|---------|
| `SITE_URL` | No | URL | Public site URL | `https://agentbio.net` | Email templates, `sitemap`, `submit-lead`, `publish-article-to-social` |
| `APP_URL` | No | URL | Application URL | `https://agentbio.net` | `sso-initiate`, `sso-callback`, `sitemap` |
| `PUBLIC_SITE_URL` | No | URL | Public-facing site URL | Falls back to `SITE_URL` | `schedule-seo-audit` |
| `ENVIRONMENT` | No | String | Environment mode (`development` or `production`) | - | `_shared/cors.ts` |

### Google OAuth & APIs

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Conditional | String | Google OAuth client ID | `gsc-oauth`, `google-analytics-oauth-callback`, `google-analytics-sync` |
| `GOOGLE_CLIENT_SECRET` | Conditional | String | Google OAuth client secret | `gsc-oauth`, `google-analytics-oauth-callback`, `google-analytics-sync` |
| `GOOGLE_REDIRECT_URI` | Conditional | URL | Google OAuth redirect URI | `gsc-oauth` |
| `GOOGLE_ANALYTICS_REDIRECT_URI` | Conditional | URL | Google Analytics OAuth redirect URI | `google-analytics-oauth-callback` |

### Microsoft/Bing OAuth

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `MICROSOFT_CLIENT_ID` | Conditional | String | Microsoft OAuth client ID | `bing-webmaster-sync` |
| `MICROSOFT_CLIENT_SECRET` | Conditional | String | Microsoft OAuth client secret | `bing-webmaster-sync` |

### Yandex OAuth

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `YANDEX_CLIENT_ID` | Conditional | String | Yandex OAuth client ID | `yandex-webmaster-sync`, `yandex-webmaster-oauth-callback` |
| `YANDEX_CLIENT_SECRET` | Conditional | String | Yandex OAuth client secret | `yandex-webmaster-sync`, `yandex-webmaster-oauth-callback` |
| `YANDEX_WEBMASTER_REDIRECT_URI` | Conditional | URL | Yandex Webmaster OAuth redirect URI | `yandex-webmaster-oauth-callback` |

### AI/ML API Keys

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `LOVABLE_API_KEY` | Conditional | String | Lovable AI API key for content generation | `generate-blog-content`, `generate-social-post`, `manage-blog-titles`, `publish-article-to-social`, `generate-content-suggestions`, `test-ai-model` |
| `OPENAI_API_KEY` | Conditional | String | OpenAI API key | `generate-listing-description`, `optimize-page-content` |
| `CLAUDE_API_KEY` | Conditional | String | Anthropic Claude API key | `generate-marketing-post` |

### SEO & Performance APIs

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `PAGESPEED_INSIGHTS_API_KEY` | Conditional | String | Google PageSpeed Insights API key | `check-core-web-vitals`, `gsc-fetch-core-web-vitals` |
| `PAGESPEED_API_KEY` | Conditional | String | Alternative name for PageSpeed API key | `monitor-performance-budget` |
| `CHROME_UX_API_KEY` | Conditional | String | Chrome UX Report API key (falls back to PageSpeed key) | `gsc-fetch-core-web-vitals` |

### Rate Limiting (Upstash Redis)

| Variable | Required | Type | Description | Used In |
|----------|----------|------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | Conditional | URL | Upstash Redis REST API URL | `rate-limit` |
| `UPSTASH_REDIS_REST_TOKEN` | Conditional | String | Upstash Redis REST API token | `rate-limit` |

---

## Variable Quick Reference

### Minimum Required Variables

For a basic installation, you need at minimum:

**Frontend (.env.local):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://your-domain.com
```

**Supabase Edge Function Secrets:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SITE_URL=https://your-domain.com
```

### Feature-Specific Requirements

| Feature | Required Variables |
|---------|-------------------|
| **Push Notifications** | All `VITE_FIREBASE_*` variables |
| **Google Search Console** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` |
| **Bing Webmaster** | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` |
| **Yandex Webmaster** | `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`, `YANDEX_WEBMASTER_REDIRECT_URI` |
| **AI Content Generation** | `LOVABLE_API_KEY` or `OPENAI_API_KEY` |
| **Core Web Vitals** | `PAGESPEED_INSIGHTS_API_KEY` |
| **Rate Limiting** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **SSO/SAML** | `APP_URL` (already defaults to https://agentbio.net) |

---

## Setup Instructions

### 1. Frontend Environment Variables

Create a `.env.local` file in the project root (this file is gitignored):

```env
# =============================================================================
# Required - Supabase Configuration
# =============================================================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - Custom Edge Functions URL (if self-hosting)
# VITE_FUNCTIONS_URL=https://functions.your-domain.com

# =============================================================================
# Required - App Configuration
# =============================================================================
VITE_APP_URL=https://your-domain.com

# =============================================================================
# Optional - Stripe (Client-side)
# =============================================================================
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# =============================================================================
# Optional - Firebase (Push Notifications)
# =============================================================================
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=

# =============================================================================
# Optional - Search Engine OAuth (Client IDs only)
# =============================================================================
VITE_GOOGLE_CLIENT_ID=
VITE_MICROSOFT_CLIENT_ID=
VITE_YANDEX_CLIENT_ID=
```

### 2. Supabase Edge Function Secrets

Set these via the Supabase Dashboard:

1. Go to your project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Click **Secrets** tab
4. Add each secret with its name and value

**Critical Secrets (Required for core functionality):**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `SITE_URL`

**Optional Secrets (Based on features used):**
- AI Keys: `LOVABLE_API_KEY`, `OPENAI_API_KEY`, `CLAUDE_API_KEY`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, etc.
- SEO: `PAGESPEED_INSIGHTS_API_KEY`
- Rate Limiting: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### 3. Cloudflare Pages (Production)

For production deployment on Cloudflare Pages:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add all `VITE_*` variables with their production values
4. Set variables for both **Production** and **Preview** environments as needed

### 4. Stripe Webhook Configuration

1. In Stripe Dashboard, create a webhook endpoint pointing to:
   `https://your-supabase-project.supabase.co/functions/v1/stripe-webhook`
2. Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
3. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## Security Notes

1. **Never commit** `.env.local` or any file containing secrets
2. **Rotate secrets** regularly, especially API keys
3. **Use test keys** for development (`sk_test_*`, `pk_test_*`)
4. **Limit permissions** - use scoped API keys where possible
5. **Monitor usage** - track API key usage for unusual activity

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Missing required environment variables" error | Ensure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set |
| Edge functions not working | Check that secrets are set in Supabase Dashboard |
| Stripe webhooks failing | Verify `STRIPE_WEBHOOK_SECRET` matches your endpoint |
| Email not sending | Confirm `RESEND_API_KEY` is valid and domain is verified |
| OAuth login failing | Check client ID/secret match and redirect URIs are configured |

### Checking Variable Values

**Frontend (browser console):**
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
```

**Edge Functions (logs):**
```typescript
console.log('SITE_URL:', Deno.env.get('SITE_URL'));
```

---

## Edge Functions Using Each Secret

<details>
<summary>Click to expand full function mapping</summary>

### SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
Used in nearly all edge functions for database operations.

### STRIPE_SECRET_KEY
- `stripe-webhook/index.ts`
- `create-checkout-session/index.ts`
- `create-portal-session/index.ts`
- `create-stripe-customer/index.ts`

### STRIPE_WEBHOOK_SECRET
- `stripe-webhook/index.ts`

### RESEND_API_KEY
- `_shared/email.ts`
- `send-bio-analyzer-email/index.ts`
- `send-listing-generator-email/index.ts`
- `send-scheduled-listing-emails/index.ts`

### SITE_URL
- `send-bio-analyzer-email/index.ts`
- `send-scheduled-bio-emails/index.ts`
- `send-scheduled-listing-emails/index.ts`
- `send-listing-generator-email/index.ts`
- `send-welcome-email/index.ts`
- `submit-lead/index.ts`
- `publish-article-to-social/index.ts`
- `schedule-seo-audit/index.ts`
- `sitemap/index.ts`

### LOVABLE_API_KEY
- `generate-blog-content/index.ts`
- `generate-social-post/index.ts`
- `manage-blog-titles/index.ts`
- `publish-article-to-social/index.ts`
- `generate-content-suggestions/index.ts`
- `test-ai-model/index.ts`

### OPENAI_API_KEY
- `generate-listing-description/index.ts`
- `optimize-page-content/index.ts`

### GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
- `gsc-oauth/index.ts`
- `google-analytics-oauth-callback/index.ts`
- `google-analytics-sync/index.ts`

### PAGESPEED_INSIGHTS_API_KEY
- `check-core-web-vitals/index.ts`
- `gsc-fetch-core-web-vitals/index.ts`
- `monitor-performance-budget/index.ts`

</details>

---

*This document was auto-generated by analyzing the codebase. Keep it updated when adding new environment variables.*
