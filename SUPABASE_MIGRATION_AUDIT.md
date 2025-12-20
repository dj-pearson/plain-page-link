# Supabase Migration Audit Report

**Date:** 2025-12-20
**Purpose:** Comprehensive audit to ensure all connections route to self-hosted Supabase (api.agentbio.net / functions.agentbio.net) and identify hardcoded/mock data that needs to be replaced with real database data.

---

## Executive Summary

This audit identified **4 categories of issues** that need to be addressed to ensure the platform is fully operational with the self-hosted Supabase instance:

| Category | Issues Found | Severity |
|----------|--------------|----------|
| Old Cloud Supabase References | 8 files | CRITICAL |
| Hardcoded Mock/Demo Data | 12+ components | HIGH |
| Edge Function Configuration Issues | 10+ functions | MEDIUM-HIGH |
| Stubbed/Placeholder Functionality | 6 features | MEDIUM |

---

## 1. Supabase Client Configuration (VERIFIED ✅)

### Status: **CORRECTLY CONFIGURED**

The main Supabase client is properly configured to use environment variables:

**File:** `src/integrations/supabase/client.ts`
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL;
```

**Environment Files:**
- `.env.local` - ✅ Correctly set to `https://api.agentbio.net`
- `.env.example` - ✅ Updated with self-hosted configuration

---

## 2. Old Cloud Supabase References (NEEDS FIXING 🔴)

### Files Still Referencing Old Cloud Supabase (`axoqjwvqxgtzsdmlmnbv.supabase.co`)

| File | Line | Issue | Priority |
|------|------|-------|----------|
| `supabase/config.toml` | 1 | `project_id = "axoqjwvqxgtzsdmlmnbv"` | **CRITICAL** |
| `public/sitemap.xml` | 3 | Old regeneration URL reference | HIGH |
| `dist/sitemap.xml` | 3 | Old regeneration URL reference (rebuild will fix) | MEDIUM |
| `import-articles.sql` | 16 | Old dashboard URL in comment | LOW |
| `SECURITY_AUDIT_REMEDIATION.md` | 31 | Documentation with old fallback URL | LOW |
| `SECURITY_AUDIT_COMPREHENSIVE.md` | 296, 434 | Documentation examples | LOW |
| `COOLIFY_QUICK_FIX.md` | 34 | References different old URL | LOW |

### Remediation Tasks

- [ ] **Task 2.1:** Update `supabase/config.toml` - Change project_id to self-hosted identifier or remove
- [ ] **Task 2.2:** Update `public/sitemap.xml` - Change regeneration comment URL to `https://functions.agentbio.net/sitemap`
- [ ] **Task 2.3:** Update documentation files with correct self-hosted URLs

---

## 3. Hardcoded Mock/Demo Data (NEEDS FIXING 🔴)

### CRITICAL - Landing Page Components

#### 3.1 DemoProfilesShowcase Component
**File:** `src/components/landing/DemoProfilesShowcase.tsx` (Lines 9-52)

**Issue:** 3 hardcoded fake agent profiles displayed as "demo profiles"
```typescript
const demoProfiles = [
    { name: 'Sarah Johnson', username: 'sarahjohnson', ... },
    { name: 'Michael Chen', username: 'michaelchen', ... },
    { name: 'Jessica Martinez', username: 'jessicamartinez', ... },
];
```

**Impact:** Links to `/p/{username}` that don't exist, breaking user experience

**Remediation:**
- [ ] **Task 3.1:** Create `featured_profiles` database table
- [ ] **Task 3.2:** Fetch real featured profiles from database OR remove this section
- [ ] **Task 3.3:** Alternatively, link to actual demo accounts if they exist

---

#### 3.2 AgentTestimonials Component
**File:** `src/components/landing/AgentTestimonials.tsx` (Lines 8-81)

**Issue:** 6 hardcoded fake testimonials with fabricated success metrics
```typescript
const testimonials = [
    { name: 'Jennifer Rodriguez', metrics: { leadIncrease: '5x', timeFrame: '2 months' } },
    // ... 5 more fake testimonials
];
```

**Impact:** Misleading marketing claims with fabricated ROI metrics

**Remediation:**
- [ ] **Task 3.4:** Create `platform_testimonials` database table
- [ ] **Task 3.5:** Collect real testimonials from users OR use generic, non-specific testimonials
- [ ] **Task 3.6:** Remove specific fabricated metrics (5x leads, 47:1 ROI, etc.)

---

### CRITICAL - Dashboard Pages

#### 3.3 AnalyticsDashboard Page
**File:** `src/pages/AnalyticsDashboard.tsx` (Lines 31-186)

**Issue:** Multiple mock data generator functions returning static fake data
- `generateMockData()` - Returns hardcoded metrics (3542 page views, 156 leads, etc.)
- `generateMockTimeSeriesData()` - Generates fake daily lead data
- `generateMockLeadSources()` - Returns 6 fake lead sources (Zillow, Realtor, etc.)
- Report generation returns 50 fake leads with `lead${i}@example.com`

**Remediation:**
- [ ] **Task 3.7:** Replace `generateMockData()` with actual API call to analytics endpoint
- [ ] **Task 3.8:** Replace `generateMockTimeSeriesData()` with real time-series data from `page_views` or `analytics_events` table
- [ ] **Task 3.9:** Replace `generateMockLeadSources()` with actual lead source aggregation from `leads` table
- [ ] **Task 3.10:** Replace report generation with real lead data export

---

#### 3.4 QuickActionsDashboard Page
**File:** `src/pages/QuickActionsDashboard.tsx` (Lines 21-83)

**Issue:** `mockListings` array with 6 hardcoded fake listings
```typescript
// Mock data (replace with actual API calls)
const mockListings = [
    { id: "1", title: "Modern 3BR House in Downtown", price: 450000, ... },
    // ... 5 more fake listings
];
```

**Remediation:**
- [ ] **Task 3.11:** Replace `mockListings` with `useListings()` hook to fetch real data
- [ ] **Task 3.12:** Handle empty state when user has no listings

---

#### 3.5 SearchAnalyticsDashboard Component
**File:** `src/components/admin/SearchAnalyticsDashboard.tsx` (Lines 50-80)

**Issue:** `mockQueries` arrays used for CSV/PDF export functions

**Remediation:**
- [ ] **Task 3.13:** Replace mock queries with actual search analytics data from state/props

---

### MEDIUM - Feature Pages

#### 3.6 BeforeAfterComparison Component
**File:** `src/components/landing/BeforeAfterComparison.tsx` (Lines 32, 86)

**Issue:** Hardcoded `@sarahrealtor` demo Instagram handle

**Remediation:**
- [ ] **Task 3.14:** Use generic placeholder or make consistent with DemoProfilesShowcase

---

#### 3.7 Overview Dashboard Features
**File:** `src/pages/dashboard/Overview.tsx` (Lines 55-81)

**Issue:** Hardcoded feature lists for subscription tiers

**Remediation:**
- [ ] **Task 3.15:** Move feature lists to database or config file that syncs with actual subscription system

---

## 4. Edge Function Configuration Issues (NEEDS FIXING 🔴)

### CRITICAL - Missing Export (Compilation Error)

**File:** `supabase/functions/_shared/cors.ts`

**Issue:** 6 functions import `corsHeaders` but the file only exports functions, not the constant

**Affected Functions:**
1. `get-sessions/index.ts:8`
2. `audit-log/index.ts:8`
3. `gdpr-deletion/index.ts:8`
4. `gdpr-export/index.ts:8`
5. `login-security/index.ts:8`
6. `revoke-session/index.ts:8`

**Remediation:**
- [ ] **Task 4.1:** Add `export const corsHeaders` to `_shared/cors.ts` OR update functions to use `getCorsHeaders()`

---

### HIGH - Insecure CORS Headers

**Issue:** Several functions use `'Access-Control-Allow-Origin': '*'` instead of secure domain restrictions

**Affected Functions:**
| File | Lines with `'*'` CORS |
|------|----------------------|
| `generate-listing-description/index.ts` | 92, 130, 144 |
| `send-scheduled-listing-emails/index.ts` | 30, 49, 117, 129 |
| `send-listing-generator-email/index.ts` | 20, 60, 74 |

**Remediation:**
- [ ] **Task 4.2:** Replace all `'Access-Control-Allow-Origin': '*'` with `getCorsHeaders(req.headers.get('origin'))`

---

### MEDIUM - Hardcoded Domain URLs

**Issue:** Some functions have hardcoded `agentbio.net` without environment variable fallback

| File | Issue |
|------|-------|
| `sitemap/index.ts:4` | `const BASE_URL = 'https://agentbio.net'` (hardcoded) |
| `publish-article-to-social/index.ts:15` | Hardcoded article URL |
| `schedule-seo-audit/index.ts:83` | Uses `example.com` as fallback |

**Remediation:**
- [ ] **Task 4.3:** Update `sitemap/index.ts` to use `Deno.env.get('SITE_URL')`
- [ ] **Task 4.4:** Update `publish-article-to-social/index.ts` to use environment variable
- [ ] **Task 4.5:** Fix `schedule-seo-audit/index.ts` fallback from `example.com` to proper domain

---

### Environment Variables Required for Edge Functions

Ensure these are set in your self-hosted Supabase edge functions environment:

```bash
SUPABASE_URL=https://api.agentbio.net
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SITE_URL=https://agentbio.net
APP_URL=https://agentbio.net
PUBLIC_SITE_URL=https://agentbio.net
FROM_EMAIL=noreply@agentbio.net
```

---

## 5. Stubbed/Placeholder Functionality (NEEDS COMPLETION 🟡)

### Features Marked "Coming Soon" or Using Mock Data

| Feature | File | Status |
|---------|------|--------|
| Device Analytics | `SearchAnalyticsDashboard.tsx:249` | "Coming soon..." placeholder |
| Geographic Analytics | `SearchAnalyticsDashboard.tsx:261` | "Coming soon..." placeholder |
| Excel Export | `ReportBuilder.tsx:72` | Disabled, marked "Coming Soon" |
| SEO Manager UI | `SEOManager.tsx:348` | "UI coming soon!" |
| Mortgage Calculator Rates | `mortgageCalculator.ts:307` | "Mock rates - fetch from API" |

**Remediation:**
- [ ] **Task 5.1:** Implement device analytics from analytics_events data
- [ ] **Task 5.2:** Implement geographic analytics from visitor IP data
- [ ] **Task 5.3:** Implement Excel export functionality
- [ ] **Task 5.4:** Complete SEO Manager UI tabs
- [ ] **Task 5.5:** Integrate real mortgage rate API or remove feature

---

## 6. Remediation Priority Matrix

### Phase 1: Critical (Do First)
| Task ID | Description | Effort |
|---------|-------------|--------|
| 2.1 | Update supabase/config.toml | 5 min |
| 4.1 | Fix corsHeaders export | 15 min |
| 4.2 | Fix insecure CORS headers | 30 min |
| 3.7, 3.8, 3.9 | Fix AnalyticsDashboard mock data | 2-3 hrs |
| 3.11 | Fix QuickActionsDashboard mock data | 1 hr |

### Phase 2: High Priority (This Week)
| Task ID | Description | Effort |
|---------|-------------|--------|
| 2.2 | Update sitemap.xml regeneration URL | 10 min |
| 3.1, 3.2, 3.3 | Replace DemoProfilesShowcase | 2 hrs |
| 3.4, 3.5, 3.6 | Replace AgentTestimonials | 2 hrs |
| 4.3, 4.4, 4.5 | Fix edge function URLs | 30 min |

### Phase 3: Medium Priority (Next Sprint)
| Task ID | Description | Effort |
|---------|-------------|--------|
| 3.13 | Fix SearchAnalyticsDashboard exports | 1 hr |
| 3.14, 3.15 | Fix misc hardcoded data | 1 hr |
| 5.1-5.5 | Implement "coming soon" features | 1-2 weeks |

### Phase 4: Low Priority (Cleanup)
| Task ID | Description | Effort |
|---------|-------------|--------|
| 2.3 | Update documentation files | 1-2 hrs |

---

## 7. Testing Checklist

After completing remediation, verify:

### Database Connectivity
- [ ] Dashboard loads real user listings from database
- [ ] Analytics shows real page view data
- [ ] Leads page shows real lead data
- [ ] Profile page loads real user profile

### Edge Functions
- [ ] All edge functions deploy without errors
- [ ] CORS works correctly from agentbio.net
- [ ] Email functions send to correct addresses
- [ ] Sitemap generates with correct URLs

### Landing Page
- [ ] Demo profiles either link to real accounts or are removed
- [ ] Testimonials are real or clearly marked as examples
- [ ] No broken links to non-existent profiles

### Admin Features
- [ ] SEO Manager functions work end-to-end
- [ ] Analytics exports contain real data
- [ ] Search analytics shows actual query data

---

## 8. Files Modified Tracking

Use this section to track which files have been updated:

| File | Status | Updated By | Date |
|------|--------|------------|------|
| `supabase/config.toml` | ✅ Complete | Claude | 2025-12-20 |
| `public/sitemap.xml` | ✅ Complete | Claude | 2025-12-20 |
| `src/components/landing/DemoProfilesShowcase.tsx` | ⬜ Pending | | |
| `src/components/landing/AgentTestimonials.tsx` | ⬜ Pending | | |
| `src/pages/AnalyticsDashboard.tsx` | ✅ Complete | Claude | 2025-12-20 |
| `src/pages/QuickActionsDashboard.tsx` | ✅ Complete | Claude | 2025-12-20 |
| `supabase/functions/_shared/cors.ts` | ✅ Complete | Claude | 2025-12-20 |
| `supabase/functions/generate-listing-description/index.ts` | ✅ Complete | Claude | 2025-12-20 |
| `supabase/functions/send-listing-generator-email/index.ts` | ✅ Complete | Claude | 2025-12-20 |
| `supabase/functions/send-scheduled-listing-emails/index.ts` | ✅ Complete | Claude | 2025-12-20 |
| `supabase/functions/sitemap/index.ts` | ⬜ Pending | | |

---

## Notes

- All edge functions correctly use `Deno.env.get('SUPABASE_URL')` for database connections
- The main Supabase client is correctly configured - no changes needed
- Most hardcoded domain fallbacks default to `agentbio.net` which is correct for production
- 216 console.log statements exist across 88 files - consider cleanup for production

---

*This audit was generated on 2025-12-20. Re-run analysis after completing remediation tasks.*
