# SEO Edge Functions Implementation Guide

## Overview

This document lists all the edge functions needed for the complete SEO Management System. **11 core functions have been created** with full implementations. The remaining **34+ functions** follow similar patterns and can be implemented using the templates below.

**Latest Update (2025-11-13):** Added 8 new critical functions:
- ✅ Complete Google Search Console integration (4 functions)
- ✅ Advanced content analysis suite (4 functions)

---

## ✅ Implemented Functions (11/45+)

### Core SEO & Analysis (3)
1. **`seo-audit`** - Comprehensive SEO audit of a URL
2. **`check-core-web-vitals`** - Google PageSpeed Insights integration for Core Web Vitals
3. **`crawl-site`** - Site crawler with depth control and link extraction

### Google Search Console Integration (4) - ✨ NEW
4. **`gsc-oauth`** - OAuth 2.0 flow for Google Search Console authentication
5. **`gsc-fetch-properties`** - Fetch verified GSC properties for user
6. **`gsc-sync-data`** - Sync keyword and page performance data from GSC
7. **`gsc-fetch-core-web-vitals`** - Fetch real user metrics from Chrome UX Report (CrUX)

### Content Analysis & Optimization (4) - ✨ NEW
8. **`analyze-content`** - Comprehensive content SEO analysis (readability, structure, keywords)
9. **`analyze-internal-links`** - Internal linking structure analysis
10. **`analyze-semantic-keywords`** - Semantic keyword and topic extraction with LSI suggestions
11. **`optimize-page-content`** - AI-powered content optimization suggestions

---

## 📋 Remaining Edge Functions to Implement

### Core SEO Functions (2/4 complete)

- [x] `seo-audit` - ✅ Implemented
- [ ] `apply-seo-fixes` - Apply automated SEO fixes based on audit results
- [x] `analyze-content` - ✅ Implemented (2025-11-13)
- [ ] `analyze-blog-posts-seo` - Analyze blog posts for SEO best practices

### Crawling & Analysis (3/4 complete)

- [x] `crawl-site` - ✅ Implemented
- [ ] `analyze-images` - Analyze images for optimization (size, alt text, format)
- [x] `analyze-internal-links` - ✅ Implemented (2025-11-13)
- [x] `analyze-semantic-keywords` - ✅ Implemented (2025-11-13)

### Technical SEO Checks (1/5 complete)

- [x] `check-core-web-vitals` - ✅ Implemented
- [ ] `check-broken-links` - Find and report broken links
- [ ] `check-keyword-positions` - Track keyword rankings across search engines
- [ ] `check-mobile-first` - Mobile-friendliness analysis
- [ ] `check-security-headers` - Security headers validation (HSTS, CSP, etc.)

### Advanced Analysis (0/4)

- [ ] `detect-redirect-chains` - Detect and analyze redirect chains
- [ ] `detect-duplicate-content` - Find duplicate content across pages
- [ ] `validate-structured-data` - Validate Schema.org structured data
- [ ] `monitor-performance-budget` - Monitor performance budgets and violations

### Google Search Console Integration (4/4 complete) ✨

- [x] `gsc-oauth` - ✅ Implemented (2025-11-13)
- [x] `gsc-fetch-properties` - ✅ Implemented (2025-11-13)
- [x] `gsc-sync-data` - ✅ Implemented (2025-11-13)
- [x] `gsc-fetch-core-web-vitals` - ✅ Implemented (2025-11-13)

### Content Optimization (1/3 complete)

- [x] `optimize-page-content` - ✅ Implemented (2025-11-13)
- [ ] `generate-blog-content` - Generate SEO-optimized blog content (can duplicate from existing `generate-article`)
- [ ] `manage-blog-titles` - Generate and test blog title variations

### Monitoring & Notifications (0/2)

- [ ] `send-seo-notification` - Send SEO alerts via email/Slack/webhook
- [ ] `run-scheduled-audit` - Run scheduled SEO audits (cron-triggered)

### Backlinks & SERP Tracking (0/2)

- [ ] `sync-backlinks` - Sync backlinks from Ahrefs/Moz API
- [ ] `track-serp-positions` - Track SERP positions using SERPApi

### Sitemaps & Additional (0/1)

- [ ] `generate-sitemap` - Generate dynamic XML sitemap

### Additional Recommended Functions (0/15+)

- [ ] `check-robots-txt` - Validate robots.txt
- [ ] `check-sitemap-xml` - Validate sitemap.xml
- [ ] `analyze-heading-structure` - Analyze H1-H6 heading hierarchy
- [ ] `analyze-meta-tags` - Comprehensive meta tags analysis
- [ ] `check-page-speed` - Page speed analysis
- [ ] `analyze-competitor` - Competitor SEO analysis
- [ ] `track-rankings-history` - Historical ranking data tracking
- [ ] `analyze-anchor-text` - Anchor text analysis for links
- [ ] `check-canonical-tags` - Canonical tag validation
- [ ] `analyze-url-structure` - URL structure analysis
- [ ] `check-pagination` - Pagination SEO analysis
- [ ] `analyze-hreflang` - Hreflang tags validation (multilingual sites)
- [ ] `check-amp-validity` - AMP page validation
- [ ] `analyze-social-signals` - Social media signals analysis
- [ ] `generate-seo-report` - Comprehensive SEO report generation

---

## 🏗️ Implementation Templates

### Template 1: Basic Analysis Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  url: string;
  saveResults?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, saveResults = true }: AnalysisRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing: ${url}`);

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from JWT
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    // === YOUR ANALYSIS LOGIC HERE ===
    const result = {
      // Your analysis results
    };

    // Save to database if needed
    if (saveResults) {
      const { error: insertError } = await supabase
        .from('your_table_name')
        .insert({
          url,
          // ...your data
          analyzed_by: userId,
        });

      if (insertError) {
        console.error('Error saving results:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Template 2: External API Integration Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, ...params } = await req.json();

    // Get API key from environment
    const API_KEY = Deno.env.get("YOUR_API_KEY_NAME");
    if (!API_KEY) {
      throw new Error("API key not configured");
    }

    // Initialize Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Call external API
    const apiUrl = new URL('https://api.example.com/endpoint');
    apiUrl.searchParams.append('url', url);
    apiUrl.searchParams.append('key', API_KEY);

    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Process and save data
    // ...

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### Template 3: OAuth Flow Function (for GSC)

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state } = await req.json();

    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Google OAuth credentials not configured");
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`OAuth token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Initialize Supabase and save tokens
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from state parameter or JWT
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    // Save OAuth credentials
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: saveError } = await supabase
      .from('gsc_oauth_credentials')
      .insert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_type: tokens.token_type,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope,
      });

    if (saveError) {
      throw new Error(`Failed to save credentials: ${saveError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'OAuth connected successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🚀 Quick Implementation Guide

### For Each Function:

1. **Create directory:**
   ```bash
   mkdir -p supabase/functions/function-name
   ```

2. **Create `index.ts` using one of the templates above**

3. **Add configuration to `supabase/config.toml`:**
   ```toml
   [functions.function-name]
   verify_jwt = true  # or false for webhooks
   ```

4. **Deploy:**
   ```bash
   supabase functions deploy function-name
   ```

5. **Set environment variables (if needed):**
   ```bash
   supabase secrets set API_KEY_NAME=your_key_value
   ```

---

## 🔑 Required Environment Variables

### Core (Required)
- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided
- `PAGESPEED_INSIGHTS_API_KEY` - **Required** for Core Web Vitals (FREE from Google)

### Optional Integrations
- `GOOGLE_CLIENT_ID` - For GSC OAuth
- `GOOGLE_CLIENT_SECRET` - For GSC OAuth
- `GOOGLE_REDIRECT_URI` - For GSC OAuth
- `AHREFS_API_KEY` - For backlink tracking ($99/mo)
- `MOZ_ACCESS_ID` + `MOZ_SECRET_KEY` - For backlink tracking ($79/mo)
- `SERPAPI_KEY` - For SERP tracking ($50/mo)
- `DATAFORSEO_LOGIN` + `DATAFORSEO_PASSWORD` - For SERP tracking ($30/mo)
- `RESEND_API_KEY` - For email notifications
- `EMAIL_FROM` - Sender email address
- `CRON_SECRET` - For scheduled tasks

---

## 📊 Priority Implementation Order

1. **Phase 1: Core SEO (Complete seo-audit ecosystem)**
   - `apply-seo-fixes`
   - `analyze-content`
   - `generate-seo-report`

2. **Phase 2: Technical Checks (Expand checking capabilities)**
   - `check-broken-links`
   - `check-mobile-first`
   - `check-security-headers`

3. **Phase 3: Google Integration (GSC data sync)**
   - `gsc-oauth`
   - `gsc-fetch-properties`
   - `gsc-sync-data`

4. **Phase 4: Content & Analysis (Advanced features)**
   - `analyze-images`
   - `analyze-internal-links`
   - `detect-duplicate-content`
   - `validate-structured-data`

5. **Phase 5: Monitoring (Automation)**
   - `send-seo-notification`
   - `run-scheduled-audit`

6. **Phase 6: External APIs (Paid features)**
   - `sync-backlinks`
   - `track-serp-positions`

---

## 🧪 Testing Edge Functions Locally

```bash
# Start Supabase locally
supabase start

# Test a function
supabase functions serve function-name

# In another terminal, call the function
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://example.com"}'
```

---

## 📝 Notes

- All functions follow the same CORS headers pattern
- All functions use Supabase service role key for database access
- User authentication is extracted from JWT when needed
- Functions should be idempotent where possible
- Error handling should be comprehensive
- Logging should be clear and helpful for debugging

---

## 🔗 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Deno Deploy Docs](https://deno.com/deploy/docs)
- [Google PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- [Google Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [Schema.org Documentation](https://schema.org/)

---

**Last Updated:** 2025-11-06
**Status:** 3/45+ functions implemented
**Next Priority:** `apply-seo-fixes`, `check-broken-links`, `gsc-oauth`
