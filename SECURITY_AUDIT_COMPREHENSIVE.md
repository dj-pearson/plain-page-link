# COMPREHENSIVE SECURITY AUDIT REPORT
# Plain Page Link - AgentBio.net Real Estate Platform

## EXECUTIVE SUMMARY
This is a React-based frontend application built with TypeScript, Vite, and Supabase backend. The application serves as a professional real estate agent portfolio platform with link management, listings, analytics, and admin features. The codebase demonstrates moderate security practices with some critical areas requiring immediate attention.

**Total Lines of Code:** ~18,136 (TypeScript/TSX)
**Framework:** React 18.2.0 + TypeScript 5.4
**Backend:** Supabase (PostgreSQL + Edge Functions/Deno)
**Authentication:** Supabase Auth (JWT-based)
**Hosting:** Cloudflare Workers (Edge Functions)

---

## 1. PROJECT STRUCTURE & TECHNOLOGY STACK

### Frontend
- **Framework:** React 18.2.0 + React Router v6.22.3
- **Language:** TypeScript 5.4.2
- **Bundler:** Vite 5.1.6 with Rollup
- **State Management:** Zustand 4.5.2
- **Forms & Validation:** React Hook Form + Zod 3.22.4
- **HTTP Client:** Axios 1.6.7, Fetch API
- **Database Client:** @supabase/supabase-js 2.78.0

### Backend & Infrastructure
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth (OIDC, Email/Password)
- **Edge Functions:** Deno (47 total functions)
- **Hosting:** Cloudflare Workers (wrangler.toml config)
- **Storage:** Supabase Storage (images, avatars, listings)
- **Payment Processing:** Stripe (webhook handlers)

### Dependencies with Security Relevance
- Firebase 12.5.0 (Push notifications, optional)
- Framer Motion 11.0.8 (Animation library - low risk)
- React Query 5.28.4 (Data fetching with caching)
- React Helmet Async (SEO meta tags)

---

## 2. AUTHENTICATION & AUTHORIZATION IMPLEMENTATION

### 2.1 Authentication Flow
**Location:** `/src/stores/useAuthStore.ts`

**Implementation Details:**
- Uses Supabase Auth with JWT tokens
- Session persistence in localStorage
- Auto-token refresh enabled via Supabase client config
- Email/password signup with username validation
- Password reset via email link (1-hour expiry)

**Authentication Pages:**
- `/src/pages/auth/Login.tsx` - Email/password login with remember-me
- `/src/pages/auth/Register.tsx` - Registration with username availability check
- `/src/pages/auth/ForgotPassword.tsx` - Password reset email sender
- `/src/pages/auth/ResetPassword.tsx` - Token-based password reset

### 2.2 Authorization & Role-Based Access Control
**Location:** `/src/pages/admin/AdminDashboard.tsx`

**Role System:**
- Uses Supabase user_roles table (enum: 'admin', 'user')
- RLS policies on user_roles table:
  - Users can view their own roles
  - Admins can manage all roles
- Security definer function: `public.has_role(_user_id UUID, _role app_role)`

**Admin Route Protection:**
```typescript
// AdminDashboard checks:
if (!user || role !== 'admin') {
  return <Navigate to="/" replace />;
}
```

**Protected Routes:**
- `/dashboard/*` - Requires authentication (ProtectedRoute wrapper)
- `/admin/*` - Requires authentication + admin role
- All dashboard pages use ProtectedRoute component

### 2.3 Route Protection Component
**Location:** `/src/components/auth/ProtectedRoute.tsx`

- Redirects unauthenticated users to `/auth/login`
- Saves attempted route to localStorage for redirect-after-login
- Shows loading spinner during auth state resolution
- Handles auth state changes via Supabase listener

**Concern:** Route protection is client-side only. An attacker could modify client-side routing. Backend RLS policies provide true protection.

### 2.4 Session Management
- Session stored in Supabase auth module
- localStorage stores auth session with `persistSession: true`
- Auto-refresh enabled: `autoRefreshToken: true`
- Logout clears all session data from store and Supabase

**Concern:** Sessions persisted in localStorage are readable by any script on the domain (XSS risk).

---

## 3. API ENDPOINTS & ROUTE DEFINITIONS

### 3.1 Supabase Edge Functions (47 total)
**Location:** `/supabase/functions/*/index.ts`

**Functions with JWT Verification Required (36):**
- AI & Content: test-ai-model, generate-social-post, generate-article, generate-content-suggestions, generate-blog-content, manage-blog-titles
- SEO Management: seo-audit, apply-seo-fixes, analyze-content, analyze-blog-posts-seo, analyze-images, analyze-internal-links, check-core-web-vitals, check-broken-links, check-keyword-positions, check-mobile-first, check-security-headers, detect-redirect-chains, detect-duplicate-content, validate-structured-data, monitor-performance-budget
- Google Search Console: gsc-oauth, gsc-fetch-properties, gsc-sync-data, gsc-fetch-core-web-vitals
- Content: optimize-page-content
- Monitoring: sync-backlinks, track-serp-positions
- Username: check-username
- Articles: test-article-webhook

**Functions WITHOUT JWT Verification (11):**
- `publish-article-to-social` - Called by external systems
- `sitemap` - Public access for SEO
- `send-seo-notification` - May be called by external systems (SECURITY RISK)
- `run-scheduled-audit` - Called by cron/scheduler
- `generate-sitemap` - Public access
- Stripe webhook handlers
- OAuth callback handlers

### 3.2 CORS Configuration
**Issue:** Overly permissive CORS headers across all functions

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // CRITICAL: Allow all origins
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

**Impact:** Any website can make cross-origin requests to these endpoints
**Recommendation:** Restrict to `https://agentbio.net` and whitelisted origins

### 3.3 Database Interaction Patterns
**Location:** `/src/hooks/use*.ts` (28 custom hooks)

**All database access uses Supabase client with RLS:**
```typescript
// Example from useLeads.ts
const { data: leads } = await supabase
  .from("leads")
  .select("*")
  .eq("user_id", user.id)  // RLS enforces this
  .order("created_at", { ascending: false });
```

**Strengths:**
- Uses parameterized queries (Supabase client handles escaping)
- RLS policies enforce row-level access control
- All queries include authentication context

**Concerns:**
- 236 RLS policies total - complexity increases audit surface
- Some queries select `*` without column specification (information disclosure potential)

---

## 4. DATABASE SCHEMA & RLS POLICIES

### 4.1 Core Tables
**Location:** `/supabase/migrations/20251030155500_*.sql`

**Tables:**
- `auth.users` - Managed by Supabase Auth
- `profiles` - User profile data
- `user_roles` - Role assignments (admin/user)
- `links` - Link-in-bio links
- `listings` - Real estate listings
- `leads` - Lead capture data
- `testimonials` - Client testimonials
- `keywords` - SEO keywords
- `articles` - Blog articles

### 4.2 Row Level Security Policies
**Total RLS Policies:** 236 across all tables

**Key Policy Types:**
1. **Profiles:**
   - Anyone can view public profiles
   - Users can update/insert their own profile only
   
2. **Listings:**
   - Anyone can view active listings
   - Users can only manage their own listings
   
3. **Links:**
   - Anyone can view active links
   - Users can manage their own links
   
4. **User Roles:**
   - Users view their own roles
   - Admins manage all roles
   
5. **Leads:**
   - Users can only view their own leads
   
6. **Testimonials:**
   - Anyone can view published testimonials

### 4.3 Sensitive Data in Database
**PII Stored:**
- Full names, usernames, bios
- Email addresses
- Phone numbers (optional, SMS enabled flag)
- Social media URLs
- License information (for agents)
- Brokerage details
- Service areas (cities, zip codes)

**Sensitive Fields with Proper Controls:**
- Passwords: Managed by Supabase Auth (hashed, salted)
- API Keys: Stored in Supabase secrets (not in tables)
- Tokens: Stored in user_auth_tokens table with RLS
- Access tokens for OAuth: Encrypted in analytics tables

---

## 5. USER DATA & PII HANDLING

### 5.1 Data Collection Points
1. **Registration:**
   - Username, full name, email, password (hashed by Supabase)
   
2. **Profile Setup:**
   - Professional info: license #, brokerage, certifications
   - Contact: phone, email display, website
   - Social media URLs
   - Service areas, years of experience

3. **Analytics:**
   - Visitor ID (generated, stored in localStorage)
   - Page views, clicks, form submissions
   - Referrer information
   - User agent, device info

4. **Leads:**
   - Name, email, phone, message
   - Property interests
   - Lead source tracking

### 5.2 Data Transmission
- All traffic over HTTPS (Supabase enforces)
- Sensitive auth tokens in Authorization header
- Firebase push notification tokens stored server-side

### 5.3 Data Storage & Encryption
**At Rest:**
- Supabase database (PostgreSQL) - encryption available but not explicitly confirmed
- Supabase Storage (images, avatars) - object storage encryption

**In Transit:**
- HTTPS only (Vite dev server should use HTTPS in production)
- Supabase connections use TLS

**LocalStorage (SECURITY RISK):**
```javascript
// Stores:
- auth-storage (empty by design)
- lastVisitedRoute
- visitor_id
- error_logs (up to 10 recent errors)
```

Concern: Any XSS vulnerability exposes localStorage data.

### 5.4 Data Retention & Deletion
- No explicit data retention policies visible
- Soft delete support in `useSoftDelete.ts` hook
- CASCADE deletes on auth.users deletion (orphans removed)

---

## 6. CONFIGURATION FILES & SECRETS MANAGEMENT

### 6.1 Environment Configuration
**File:** `/home/user/plain-page-link/.env.example`

```
# Self-Hosted Supabase Configuration
VITE_SUPABASE_URL=https://api.agentbio.net
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_FUNCTIONS_URL=https://functions.agentbio.net
VITE_FIREBASE_API_KEY=
VITE_API_URL=https://api.agentbio.net
VITE_APP_URL=https://agentbio.net
```

### 6.2 Supabase Configuration (RESOLVED)
**File:** `/src/integrations/supabase/client.ts`

**Status:** FIXED - Now uses environment variables without fallback to hardcoded values:

```typescript
// Self-hosted Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const EDGE_FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL;

// Validates required environment variables at startup
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required environment variables');
}
```

**RESOLVED (December 2024):**
- Hardcoded fallback values have been removed
- Environment variables are now required (app throws error if missing)
- Self-hosted Supabase configuration uses custom domains:
  - API/Auth/Storage: `https://api.agentbio.net`
  - Edge Functions: `https://functions.agentbio.net`
- RLS policies remain critical for security

**Note:** Anon keys are designed to be public; RLS policies provide the security layer.

### 6.3 Supabase Edge Functions Secrets
**File:** `/supabase/config.toml`

Secrets are configured but NOT visible in source (stored in Supabase vault):
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- LOVABLE_API_KEY (for AI models)
- FIREBASE_ADMIN_SDK
- Google OAuth credentials
- Bing Webmaster Tools credentials

**Good Practice:** Secrets in Deno env, never in code.

### 6.4 Vite Configuration
**File:** `/vite.config.ts`

- `drop_console: true` in production builds
- `drop_debugger: true` in production
- Source maps likely generated (check dist/)
- Minification enabled with Terser

**Concern:** React Query Devtools enabled in dev mode (logs state, queries, mutations).

---

## 7. SECURITY MIDDLEWARE & HARDENING

### 7.1 Input Validation

**Username Validation:**
```typescript
// /src/lib/usernameValidation.ts
const usernameSchema = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
  .refine((username) => !containsProfanity(username), "Username contains inappropriate language")
  .refine((username) => !isReservedUsername(username), "This username is reserved");
```

**Strengths:**
- Uses Zod for schema validation
- Profanity filtering (includes 16+ offensive terms)
- Reserved username list (admin, root, blog, dashboard, etc.)
- Regular expressions for format validation

**File Upload Validation:**
```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
```

**Concerns:**
- MIME type validation only (client-side easily spoofed)
- No server-side file type verification in hooks
- File extension extracted from filename (unsafe: `file.name.split('.').pop()`)

**Password Validation:**
- Minimum 6 characters (weak requirement - NIST recommends 8+)
- Password strength indicator component (visual only, no enforcement)

**Link Validation:**
- URL format validation in `useLinkValidation.ts`
- Open Graph tag parsing (frontend only)

### 7.2 CORS Policy
**All Functions:** Overly permissive
```typescript
'Access-Control-Allow-Origin': '*'
```

**Recommendation:** Restrict to origin whitelist:
```typescript
const ALLOWED_ORIGINS = ['https://agentbio.net', 'https://www.agentbio.net'];
const origin = req.headers.get('origin');
const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
'Access-Control-Allow-Origin': corsOrigin
```

### 7.3 Rate Limiting
**Implementation:** In-memory rate limiter in `/supabase/functions/_shared/rateLimit.ts`

```typescript
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
)
```

**Usage:**
- Check username endpoint implements rate limiting
- Default: 10 requests per 60 seconds per identifier
- In-memory storage (NOT distributed)

**Concerns:**
- In-memory store won't work across multiple Deno instances
- No rate limiting on most endpoints
- Should use Redis for distributed deployments

### 7.4 Content Security Policy
**Status:** NOT FOUND in codebase

**Missing:** No CSP headers in:
- HTML (index.html)
- Vite config
- Not set server-side (frontend only app)

**Risk:** XSS attacks can execute arbitrary scripts

**Recommendation:**
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' https://www.googletagmanager.com https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               font-src 'self' https:;
               connect-src 'self' https://api.agentbio.net https://functions.agentbio.net;">
```

### 7.5 XSS Prevention
- React escapes content by default
- No `dangerouslySetInnerHTML` found (searched)
- React Markdown used for blog content (has XSS protections)

**Good:** No major XSS vulnerabilities apparent

### 7.6 CSRF Protection
**Status:** Not explicit in frontend

Since using:
- Supabase Auth (handles session tokens)
- No form-based submissions to external URLs
- API calls via fetch/axios with credentials

**Concern:** If CORS is removed from APIs, CSRF risk is lower.

### 7.7 Error Handling & Information Disclosure
**Error Handler:** `/src/lib/errorHandler.ts`

```typescript
// Stores errors in localStorage
// Logs to console in development
// Future integration with Sentry (commented out)
```

**Information Disclosure Risks:**
- Error messages shown to users (may reveal system details)
- React Query DevTools logs queries in dev mode
- Stack traces visible in browser console during development

---

## 8. IDENTIFIED SECURITY CONCERNS

### CRITICAL (Immediate Action Required)

#### 1. Supabase Anon Key Hardcoded in Source Code
**File:** `/src/integrations/supabase/client.ts`
**Issue:** JWT token exposed in plaintext with 52+ year expiry
**Impact:** Compromised keys can be exploited if any RLS policy is misconfigured
**Fix:** Use environment variables ONLY, never hardcoded fallbacks

#### 2. Overly Permissive CORS Headers
**File:** All edge functions (`*/index.ts`)
**Issue:** `Access-Control-Allow-Origin: '*'`
**Impact:** CSRF attacks possible, token theft via cross-origin requests
**Fix:** Whitelist specific origins

#### 3. Missing Content Security Policy
**File:** `index.html`
**Issue:** No CSP headers defined
**Impact:** XSS attacks can execute arbitrary scripts
**Fix:** Implement strict CSP

#### 4. In-Memory Rate Limiting
**File:** `/supabase/functions/_shared/rateLimit.ts`
**Issue:** Not distributed, won't work with multiple instances
**Impact:** Rate limiting bypassed in production deployments
**Fix:** Use Redis or Supabase-native rate limiting

### HIGH (Should Fix Soon)

#### 5. File Upload Type Validation Only on Client
**File:** `/src/hooks/useAvatarUpload.ts`, `/src/hooks/useListingImageUpload.ts`
**Issue:** MIME type check can be spoofed
**Impact:** Malicious files could bypass checks
**Fix:** Implement server-side validation in Supabase function

#### 6. Weak Password Requirements
**Issue:** Only 6 character minimum (NIST recommends 8+ or 12+)
**Impact:** Password cracking attacks more feasible
**Fix:** Increase to minimum 10-12 characters

#### 7. Authentication Redirect Vulnerability
**File:** `/src/components/auth/ProtectedRoute.tsx`
**Issue:** `lastVisitedRoute` from localStorage used without validation
**Impact:** Open redirect to attacker sites possible
**Fix:** Validate redirect URL against whitelist

#### 8. No Explicit Rate Limiting on Most Endpoints
**Issue:** Only check-username has rate limiting
**Impact:** Brute force, DDoS attacks possible
**Fix:** Add rate limiting to login, register, password reset endpoints

### MEDIUM (Address in Next Sprint)

#### 9. Sensitive Data in LocalStorage
**File:** Various, `/src/lib/errorHandler.ts`, `/src/hooks/useProfileTracking.ts`
**Issue:** Error logs and visitor IDs stored in localStorage
**Impact:** Exposed to XSS, visible in browser forensics
**Fix:** Use sessionStorage or IndexedDB with encryption

#### 10. No HTTP Security Headers
**Issue:** No X-Frame-Options, X-Content-Type-Options, etc.
**Impact:** Clickjacking, MIME sniffing attacks possible
**Fix:** Configure server to send security headers (requires backend/proxy)

#### 11. 236 RLS Policies - High Audit Complexity
**Issue:** Large number of policies increases misconfiguration risk
**Impact:** Potential data leakage through misconfigured policies
**Fix:** Regular security audit of RLS policies, automated testing

#### 12. Admin Role Check Only on Frontend
**File:** `/src/pages/admin/AdminDashboard.tsx`
**Issue:** `if (!user || role !== 'admin') return <Navigate>`
**Impact:** Client-side only check, can be bypassed
**Fix:** Backend validates admin role via RLS

#### 13. No Encryption for Storage Secrets in Database
**Issue:** OAuth tokens stored in plaintext in database
**File:** `20251107000000_search_analytics_dashboard.sql`
**Impact:** If DB compromised, tokens exposed
**Fix:** Encrypt sensitive fields at rest using pgcrypto

### LOW (Nice to Have)

#### 14. No Input Sanitization for Free-Text Fields
**Issue:** Bio, descriptions, custom CSS allowed
**Impact:** Potential for HTML injection (though React escapes)
**Fix:** Implement HTML sanitization (DOMPurify)

#### 15. No Rate Limiting Headers Returned
**Issue:** Rate limit info not in response headers
**Impact:** Clients can't detect rate limiting
**Fix:** Return X-RateLimit-* headers from functions

#### 16. Test Credentials in Code
**File:** Supabase edge functions
**Issue:** Test endpoints exist (`test-ai-model`, `test-article-webhook`)
**Impact:** Unnecessary API surface in production
**Fix:** Remove test endpoints or protect them

---

## 9. SECURITY MIDDLEWARE PRESENT/ABSENT

### Present
- Supabase RLS (Row-Level Security) policies (236 total)
- JWT-based authentication via Supabase Auth
- Input validation with Zod schemas
- File size and type validation (client-side)
- Username profanity/reserved name filtering
- Session auto-refresh
- HTTPS enforcement (Supabase requirement)

### Absent/Inadequate
- Content Security Policy (CSP)
- Rate limiting on most endpoints
- Server-side file validation
- Distributed rate limiting (in-memory only)
- Explicit CORS origin whitelist
- HTTP security headers (X-Frame-Options, etc.)
- Data encryption at rest (except auth.users)
- OWASP security headers
- Automated security scanning (SCA, SAST)
- Regular penetration testing framework

---

## 10. SECURITY CONFIGURATION MATRIX

| Control | Status | Location | Risk Level |
|---------|--------|----------|-----------|
| Authentication (JWT) | Implemented | Supabase Auth | LOW |
| Authorization (RLS) | Implemented | 236 policies | MEDIUM* |
| Input Validation | Partial | Zod schemas | MEDIUM |
| Rate Limiting | Minimal | check-username only | HIGH |
| CORS | Insecure | All functions | CRITICAL |
| CSP Headers | Missing | N/A | HIGH |
| HTTPS | Enforced | Supabase | LOW |
| Session Management | Secure | Auth module | MEDIUM** |
| File Uploads | Weak | Client-side checks | MEDIUM |
| Secrets Management | Good | Env vars in Deno | LOW |
| Error Handling | Basic | Error handler | LOW |
| Encryption (transit) | Enforced | TLS/HTTPS | LOW |
| Encryption (rest) | Partial | DB/Storage | MEDIUM |
| Admin Access Control | Frontend only | Client-side check | MEDIUM |
| Password Policy | Weak | 6 chars minimum | HIGH |
| Data Retention | Unclear | No policy | MEDIUM |

*High complexity increases misconfiguration risk
**LocalStorage persistence creates XSS exposure

---

## 11. COMPLIANCE & STANDARDS

### Applicable Standards
- OWASP Top 10 (2021)
- GDPR (EU user data)
- CCPA (California user data)
- PCI DSS (if processing payments directly)

### GDPR Considerations
**Personal Data Collected:**
- Names, emails (requires consent)
- License numbers, professional info
- Visitor IDs, analytics
- Social media profiles

**Missing Controls:**
- Privacy Policy (exists but may be incomplete)
- Data processing agreements with Supabase
- Right to erasure implementation
- Data portability implementation
- Consent management UI

### Assessment
- **GDPR Readiness:** ~60% (missing explicit consent, DPA unclear)
- **CCPA Readiness:** ~50% (no opt-out mechanism visible)
- **OWASP ASVS Level 1:** ~65% (missing security headers, CSP, rate limiting)

---

## 12. DEPENDENCY VULNERABILITIES

### Dependencies to Monitor
```json
{
  "@supabase/supabase-js": "^2.78.0",
  "react": "^18.2.0",
  "firebase": "^12.5.0",
  "axios": "^1.6.7",
  "zod": "^3.22.4",
  "zustand": "^4.5.2"
}
```

**Known Issues:**
- Axios 1.6.7: Check for known CVEs (older version)
- React: Check for known vulnerabilities
- Firebase: Monitor for auth-related issues

**Recommendation:** Regular `npm audit` and update dependencies

---

## 13. INCIDENT RESPONSE & MONITORING

### Monitoring Present
- Basic error logging to localStorage
- React Query DevTools (dev mode)
- No centralized error tracking (Sentry commented out)

### Missing
- Centralized logging (ELK, Datadog, etc.)
- Security event monitoring
- Anomaly detection
- Intrusion detection
- API request logging
- Failed login attempt tracking

**Recommendation:** Implement Sentry for error tracking and uptime monitoring

---

## 14. RECOMMENDATIONS PRIORITY LIST

### Phase 1 (Immediate - Week 1)
1. Remove hardcoded Supabase keys from source
2. Implement strict CORS origin whitelist
3. Add Content Security Policy headers
4. Increase password requirements to 12 characters
5. Enable Sentry for error monitoring

### Phase 2 (High Priority - Week 2-3)
1. Implement distributed rate limiting (Redis)
2. Add server-side file validation
3. Validate redirect URLs against whitelist
4. Add HTTP security headers
5. Encrypt sensitive database fields

### Phase 3 (Medium Priority - Month 1)
1. Audit all 236 RLS policies
2. Implement data encryption at rest
3. Add explicit GDPR consent mechanisms
4. Implement audit logging
5. Setup security scanning (SCA/SAST)

### Phase 4 (Continuous)
1. Monthly dependency updates & vulnerability scanning
2. Quarterly penetration testing
3. Annual security architecture review
4. Security awareness training for team

---

## 15. CODE EXAMPLES & SPECIFIC FINDINGS

### Exposed Keys Example
```typescript
// BAD: /src/integrations/supabase/client.ts
const SUPABASE_PUBLISHABLE_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";  // JWT EXPOSED

// GOOD: Remove fallback completely
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Supabase key not configured');
}
```

### CORS Example
```typescript
// BAD: All edge functions
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // Allow all origins
};

// GOOD:
const ALLOWED_ORIGINS = [
  'https://agentbio.net',
  'https://www.agentbio.net'
];
const origin = req.headers.get('origin');
const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : '';
const corsHeaders = {
  'Access-Control-Allow-Origin': corsOrigin || '',
  'Access-Control-Max-Age': '86400',
};
```

### File Upload Validation
```typescript
// CURRENT: Client-side only
const validateFile = (file: File): string | null => {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "Invalid file type";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large";
  }
  return null;
};

// SHOULD ADD: Server-side validation in Supabase function
// Check magic bytes, not just MIME type
// Implement virus scanning (ClamAV, VirusTotal API)
// Store files outside web root
```

---

## CONCLUSION

The AgentBio platform demonstrates **moderate security posture** with solid authentication and authorization foundations via Supabase RLS policies. However, several **CRITICAL and HIGH-priority issues** require immediate remediation:

1. **Exposed credentials** (Supabase anon key)
2. **Insecure CORS** (allow all origins)
3. **Missing CSP headers**
4. **Weak rate limiting**
5. **Inadequate admin controls**

The backend architecture (Supabase + Edge Functions) provides good security defaults, but the frontend application has several configuration and implementation gaps. With focused effort on the Phase 1 recommendations, the security posture can be improved to enterprise-grade within 2-3 weeks.

**Overall Security Rating: 6.5/10** (with Phase 1 fixes: 8/10)

---

## APPENDIX: FILES & LOCATIONS

### Critical Security Files
- `/src/integrations/supabase/client.ts` - Supabase configuration (KEYS EXPOSED)
- `/supabase/config.toml` - Edge function JWT config
- `/supabase/functions/_shared/rateLimit.ts` - Rate limiting
- `/src/stores/useAuthStore.ts` - Authentication store
- `/src/components/auth/ProtectedRoute.tsx` - Route protection
- `/index.html` - HTML entry point (missing CSP)
- `.env.example` - Environment template

### Key Database Files
- `/supabase/migrations/20251030155500_*.sql` - Core tables & RLS
- `/supabase/migrations/20251031000001_*.sql` - Listings table
- `/supabase/migrations/20251107000000_*.sql` - Analytics & tokens

### Authentication Files
- `/src/pages/auth/Login.tsx`
- `/src/pages/auth/Register.tsx`
- `/src/pages/auth/ForgotPassword.tsx`
- `/src/pages/auth/ResetPassword.tsx`

