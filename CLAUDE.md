# CLAUDE.md - AI Assistant Guide for AgentBio Platform

**Last Updated:** 2026-01-01
**Platform:** AgentBio Intelligence - AI-Powered Real Estate Platform
**Repository:** plain-page-link

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Codebase Architecture](#codebase-architecture)
4. [Development Workflow](#development-workflow)
5. [Key Conventions](#key-conventions)
6. [Database Schema](#database-schema)
7. [Common Tasks](#common-tasks)
8. [Security Considerations](#security-considerations)
9. [Performance Guidelines](#performance-guidelines)
10. [Testing Strategy](#testing-strategy)

---

## Project Overview

### What is AgentBio?

AgentBio Intelligence is an AI-powered real estate platform that transforms agents into data-driven closers. It's a modern link-in-bio platform specifically designed for real estate professionals, providing:

- **AI-Powered Intelligence**: Predictive lead scoring, smart property matching, and market intelligence
- **Portfolio Showcase**: Property listings, sold properties, and active listings
- **Lead Management**: CRM, lead capture forms, and behavioral tracking
- **Analytics Dashboard**: Performance tracking, conversion metrics, and engagement patterns
- **Content Marketing**: SEO-optimized blog system
- **PWA Support**: Mobile-first design with offline capabilities

### Business Context

- **Target Users**: Real estate agents, brokers, and property professionals
- **Value Proposition**: ML-scored leads convert 2x better, save 5+ hours/week, close deals 30% faster
- **Competitive Edge**: Data moat that strengthens with every interaction

---

## Technology Stack

### Frontend

- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 7.2 (with SWC for fast compilation)
- **Routing**: React Router DOM v6
- **State Management**:
  - Zustand (global state stores)
  - TanStack Query v5 (server state, caching, data fetching)
- **Styling**:
  - Tailwind CSS 3.4
  - CSS Variables for theming
  - Radix UI components (accessible, unstyled primitives)
- **UI Components**: Custom component library built on Radix UI
- **3D Graphics**: Three.js + React Three Fiber (for hero sections)
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion

### Backend

- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (JWT-based)
- **Storage**: Supabase Storage (for images, avatars, etc.)
- **Edge Functions**: Deno-based Supabase Functions (TypeScript)
- **Real-time**: Supabase Realtime subscriptions

### Deployment & Infrastructure

- **Hosting**: Cloudflare Pages
- **Edge Functions**: Supabase Edge Functions
- **Analytics**: Google Analytics
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **CDN**: Cloudflare

### Development Tools

- **Package Manager**: npm
- **TypeScript**: v5.4 with strict mode enabled
- **Linting**: TypeScript compiler checks
- **Version Control**: Git + GitHub

---

## Codebase Architecture

### Directory Structure

```
plain-page-link/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Radix-based)
│   │   ├── admin/          # Admin panel components
│   │   ├── analytics/      # Analytics display components
│   │   ├── auth/           # Authentication UI components
│   │   ├── blog/           # Blog display components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── features/       # Feature showcase components
│   │   ├── forms/          # Form components
│   │   ├── hero/           # Hero section components
│   │   ├── integrations/   # Third-party integration components
│   │   ├── landing/        # Landing page sections
│   │   ├── layout/         # Layout components (headers, footers)
│   │   ├── leads/          # Lead management components
│   │   ├── listings/       # Property listing components
│   │   ├── mobile/         # Mobile-specific components (PWA)
│   │   ├── modals/         # Modal dialogs
│   │   ├── onboarding/     # User onboarding components
│   │   ├── pageBuilder/    # Page builder components
│   │   ├── profile/        # Profile page components
│   │   ├── settings/       # Settings components
│   │   ├── testimonials/   # Testimonial components
│   │   ├── theme/          # Theme customization components
│   │   └── tools/          # Free tools components
│   │
│   ├── pages/              # Route-level page components
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── auth/           # Authentication pages (login, register, etc.)
│   │   ├── dashboard/      # User dashboard pages
│   │   ├── features/       # Feature showcase pages
│   │   ├── landing/        # Marketing landing pages
│   │   │   └── locations/  # Location-specific landing pages
│   │   ├── legal/          # Legal pages (privacy, terms, etc.)
│   │   ├── onboarding/     # User onboarding flow
│   │   ├── public/         # Public-facing pages
│   │   └── tools/          # Free tools (Instagram analyzer, etc.)
│   │
│   ├── hooks/              # Custom React hooks (30+ hooks)
│   │   ├── useProfile.ts       # Profile management
│   │   ├── useListings.ts      # Listing CRUD operations
│   │   ├── useLeads.ts         # Lead management
│   │   ├── useAnalytics.ts     # Analytics tracking
│   │   ├── useSubscription.ts  # Subscription management
│   │   ├── useArticles.ts      # Blog article management
│   │   ├── useTestimonials.ts  # Testimonials management
│   │   ├── useOfflineStorage.ts # PWA offline support
│   │   ├── useAutoSave.ts      # Auto-save functionality
│   │   └── use*.ts             # Other domain-specific hooks
│   │
│   ├── stores/             # Zustand global state stores
│   │   ├── useAuthStore.ts    # Main auth store (persisted)
│   │   └── pageBuilderStore.ts # Page builder state management
│   │
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client & types
│   │       ├── client.ts   # Supabase client instance
│   │       └── types.ts    # Auto-generated DB types
│   │
│   ├── lib/                # Utility libraries & helpers
│   │   ├── errorHandler.ts         # Centralized error handling
│   │   ├── offline-storage.ts      # IndexedDB for offline PWA
│   │   ├── push-notifications.ts   # FCM push notifications
│   │   ├── analytics.ts            # Analytics utilities
│   │   ├── lead-scoring.ts         # Lead scoring algorithms
│   │   ├── seo.ts                  # SEO utilities
│   │   ├── image-seo.ts            # Image SEO optimization
│   │   ├── pageBuilder.ts          # Page builder utilities
│   │   ├── themes.ts               # Theme definitions
│   │   ├── sync-manager.ts         # Offline sync management
│   │   ├── instagram-bio-analyzer/ # Instagram bio tool
│   │   └── listing-description-generator/ # Listing generator tool
│   │
│   ├── types/              # TypeScript type definitions
│   │   ├── database.ts     # Database table types
│   │   ├── user.ts         # User-related types
│   │   ├── listing.ts      # Listing types
│   │   ├── lead.ts         # Lead types
│   │   └── *.ts            # Other domain types
│   │
│   ├── utils/              # Utility functions
│   │
│   ├── config/             # Configuration files
│   │
│   ├── App.tsx             # Main app component with routes
│   ├── main.tsx            # App entry point
│   └── index.css           # Global styles & CSS variables
│
├── supabase/
│   ├── functions/          # Edge Functions (Deno/TypeScript)
│   │   ├── _shared/        # Shared utilities for functions
│   │   ├── stripe-webhook/ # Stripe payment webhooks
│   │   ├── send-welcome-email/
│   │   ├── generate-article/
│   │   ├── seo-audit/
│   │   └── [60+ functions] # Various backend services (SEO, AI, analytics, etc.)
│   │
│   └── migrations/         # Database migration SQL files
│       └── *.sql           # Timestamped migration files
│
├── public/                 # Static assets
│
├── .github/
│   ├── workflows/          # GitHub Actions CI/CD
│   └── ISSUE_TEMPLATE/     # Issue templates
│
├── package.json            # Dependencies & scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── .env.example            # Environment variable template
├── README.md               # Project documentation
└── CLAUDE.md               # This file
```

### Component Organization

**UI Components (`src/components/ui/`)**
- Based on Radix UI primitives
- Styled with Tailwind CSS
- Accessible by default
- Examples: `button.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`

**Feature Components (`src/components/[feature]/`)**
- Organized by feature domain
- Contain business logic
- Compose UI components

**Page Components (`src/pages/`)**
- Route-level components
- Lazy-loaded for code splitting (see App.tsx)
- Usually compose multiple feature components

### State Management Strategy

1. **Local Component State**: `useState` for simple, isolated state
2. **Zustand Stores**: Global app state (auth, theme preferences)
3. **TanStack Query**: Server state, caching, and data fetching
4. **URL State**: React Router for route params and search params

### Routing Architecture

**Route Structure:**
- `/` - Public landing page
- `/auth/*` - Authentication flows
- `/dashboard/*` - Protected dashboard routes
- `/:username` - Public user profiles
- `/blog/*` - Blog and content
- `/features/*` - Feature showcase pages
- `/for/*` - Location-specific landing pages
- `/tools/*` - Free tools (lead gen funnels)
- `/admin/*` - Admin-only routes

**Route Protection:**
- Uses `<ProtectedRoute>` component
- Checks auth state from `useAuthStore`
- Redirects to `/auth/login` if unauthenticated

**Code Splitting:**
- Most pages are lazy-loaded with `React.lazy()`
- Landing page and auth pages are eager-loaded for UX
- See `App.tsx` for lazy loading patterns

---

## Development Workflow

### Getting Started

1. **Clone Repository:**
   ```bash
   git clone https://github.com/dj-pearson/plain-page-link.git
   cd plain-page-link
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `VITE_SUPABASE_URL` - Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `VITE_APP_URL` - Your app URL (e.g., https://agentbio.net)

   Optional (for push notifications):
   - `VITE_FIREBASE_*` - Firebase config for FCM

4. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:8080`

5. **Build for Production:**
   ```bash
   npm run build
   ```

6. **Type Check + Build:**
   ```bash
   npm run build:check
   ```

### Git Workflow

This project follows **GitHub Flow**:

1. Create a feature branch from `main`: `git checkout -b feature/my-feature`
2. Make changes and commit with descriptive messages
3. Push to origin: `git push origin feature/my-feature`
4. Open a Pull Request against `main`
5. Address review comments
6. Merge when approved

**Branch Naming:**
- Features: `feature/feature-name`
- Bugs: `fix/bug-description`
- Refactoring: `refactor/what-changed`
- Claude branches: `claude/claude-md-[session-id]`

**Commit Messages:**
- Use present tense: "Add feature" not "Added feature"
- Be descriptive but concise
- Reference issue numbers when applicable

### Development Scripts

```json
{
  "dev": "vite",                    // Start dev server
  "build": "vite build",            // Production build
  "build:check": "tsc --noEmit && vite build",  // Type check + build
  "build:dev": "vite build --mode development", // Dev mode build
  "preview": "vite preview"         // Preview production build locally
}
```

---

## Key Conventions

### TypeScript

**Strict Mode Enabled:**
- All code must be type-safe
- No implicit `any` types
- Unused locals/parameters are errors

**Path Aliases:**
```typescript
// Use @ alias for src imports
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
```

**Type Imports:**
```typescript
// Prefer type imports for clarity
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';
```

### React Patterns

**Functional Components:**
```typescript
// Use arrow functions with explicit types
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onAction}>Click</button>
    </div>
  );
};
```

**Custom Hooks:**
```typescript
// Start with 'use' prefix
// Return object with named values (not arrays)
export const useListings = (userId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['listings', userId],
    queryFn: () => fetchListings(userId),
  });

  return { listings: data, isLoading, error };
};
```

**Lazy Loading:**
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

// Wrap in Suspense with fallback
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

### Styling Conventions

**Tailwind CSS:**
```typescript
// Use Tailwind utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-semibold text-gray-900">Title</h2>
</div>

// Use tailwind-merge for conditional classes
import { cn } from '@/lib/utils';

<Button className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)} />
```

**CSS Variables:**
```css
/* Defined in index.css */
/* Access via Tailwind or raw CSS */
.custom-element {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}
```

**Theming:**
- HSL color system for easy theme switching
- Colors defined as CSS variables
- Dark mode support via `class` strategy

### Component Patterns

**Radix UI Components:**
```typescript
// Import primitives from Radix
import * as Dialog from '@radix-ui/react-dialog';

// Compose and style with Tailwind
export const Modal = ({ children, open, onOpenChange }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" />
      <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
```

**Error Boundaries:**
```typescript
// Wrap lazy components in error boundaries
<LazyLoadErrorBoundary>
  <Suspense fallback={<LoadingSpinner />}>
    <LazyComponent />
  </Suspense>
</LazyLoadErrorBoundary>
```

### Data Fetching

**TanStack Query:**
```typescript
// Use Query for GET operations
const { data, isLoading, error } = useQuery({
  queryKey: ['profile', userId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },
});

// Use Mutation for POST/PUT/DELETE
const mutation = useMutation({
  mutationFn: async (newListing) => {
    const { data, error } = await supabase
      .from('listings')
      .insert(newListing);

    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['listings'] });
  },
});
```

**Supabase Client:**
```typescript
// Always handle errors
const { data, error } = await supabase
  .from('table_name')
  .select('*');

if (error) {
  errorHandler.captureException(error, { action: 'fetch_data' });
  throw error;
}

// Use type-safe queries
import type { Database } from '@/integrations/supabase/types';

const { data } = await supabase
  .from('listings')
  .select('id, title, price, status')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Error Handling

**Use errorHandler:**
```typescript
import { errorHandler } from '@/lib/errorHandler';

try {
  await riskyOperation();
} catch (error) {
  errorHandler.captureException(error as Error, {
    action: 'update_profile',
    component: 'ProfileSettings',
    userId: user.id,
  });

  // Show user-friendly message
  toast.error('Failed to update profile. Please try again.');
}
```

### File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`, `LeadCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useListings.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`, `validateEmail.ts`)
- **Types**: camelCase (e.g., `user.ts`, `listing.ts`)
- **Stores**: camelCase with `use` prefix (e.g., `useAuthStore.ts`)

---

## Database Schema

### `src/integrations/supabase/types.ts` is authoritative

The `public` schema has **134 tables**. Do not guess a table or column name from
this document, from a table's name, or from what a feature "should" have — read
`src/integrations/supabase/types.ts`, which is generated from the applied
schema and covers all of them.

This matters more than it sounds. An earlier version of this section described a
`blog_posts` table that has never existed (the real one is `articles`), and the
`gdpr-export` edge function duly queried `blog_posts`. The result was coalesced
with `|| []`, so the export did not fail — it silently returned zero articles on
every subject access request. Getting this section wrong propagates.

**Keeping types in sync:**

```bash
npm run types:generate   # regenerate types.ts from a live database
npm run types:check      # fail if types.ts has drifted from the schema
npm run verify:schema    # apply the migrations to a real Postgres and interrogate the result
npm run verify:migrations # structural lint of the migration files (no database needed)
```

`types:generate` reads the schema over `psql` rather than
`supabase gen types typescript`, which needs Docker that CI and sandboxes lack.
`verify:schema` is what catches the defects `tsc`, the unit tests and the build
all miss: a trigger naming a column that does not exist, a table the app queries
that no migration creates, an RPC called under the wrong name, an RLS policy
that grants far more than it appears to. It runs in CI against a real Postgres —
see `.github/workflows/verify-backend.yml` and `scripts/README-types-generation.md`.

### The tables you will touch most

Columns below are the real ones as of 2026-08. Everything is `uuid`/`text`
unless noted.

**profiles** — one row per agent, keyed by `auth.users.id`. ~45 columns.
```
id (PK, = auth.users.id), username (unique, NOT NULL), full_name, bio, avatar_url, theme
title, license_number, license_state, brokerage_name, brokerage_logo, years_experience (int)
specialties / certifications / service_cities / service_zip_codes (jsonb)
phone, sms_enabled (bool), email_display, calendly_url, zapier_webhook_url
instagram_url, facebook_url, linkedin_url, tiktok_url, youtube_url, zillow_url,
  realtor_com_url, website_url
seo_title, seo_description, og_image, custom_css, custom_domain, is_published (bool)
view_count / lead_count / link_click_count (int, denormalised counters)
created_at, updated_at
```

**listings** — properties. Note `price` is **text**, not numeric, and there is
no `title` or `images` column.
```
id, user_id (NOT NULL), address (NOT NULL), city (NOT NULL), price (text, NOT NULL)
beds (int, NOT NULL), baths (int, NOT NULL), sqft (int)
bedrooms / bathrooms (numeric), square_feet (int), lot_size_acres (numeric)
image (single, legacy), photos (jsonb, the real gallery), virtual_tour_url
status ('active' | 'sold' | 'pending'), property_type, description, mls_number
listed_date, sold_date (date), days_on_market (int), is_featured (bool), sort_order (int)
created_at, updated_at
```

**leads** — captured leads. The type column is `lead_type`, **not** `type`; a
trigger referencing `NEW.type` once aborted every insert.
```
id, user_id (NOT NULL), lead_type (NOT NULL), name (NOT NULL), email (NOT NULL), phone
encrypted_email, encrypted_phone   -- US-016 dual-write; plaintext still populated
message, notes, status, source, form_data (jsonb)
assigned_to, listing_id, price_range, timeline, property_address, preapproved (bool)
first_responded_at, contacted_at, closed_at
referrer_url, utm_source, utm_medium, utm_campaign, device
created_at, updated_at
```

**links** — the link-in-bio rows.
```
id, user_id (NOT NULL), title (NOT NULL), url (NOT NULL), icon
position (int, NOT NULL), is_active (bool), click_count (int)
created_at, updated_at
```
`click_count` is written **only** through `increment_link_clicks(link_id)`, a
`SECURITY DEFINER` function. There is deliberately no UPDATE policy on `links`
for anonymous visitors — the one that used to exist let any visitor rewrite any
profile's link targets. Do not add one back.

**articles** — the blog. This is the table; `blog_posts` does not exist.
```
id, title (NOT NULL), slug (NOT NULL), content (NOT NULL), excerpt
featured_image_url, author_id, status, category, tags (text[])
seo_title, seo_description, seo_keywords (text[]), view_count (int)
published_at, created_at, updated_at
generated_from_suggestion_id, keyword_id
```

**user_roles** — RBAC. `role` is the `app_role` enum, not text; check it with
`has_role(auth.uid(), 'admin'::app_role)`.
```
id, user_id (NOT NULL), role (app_role enum, NOT NULL)
```

The other ~128 tables cluster into: SEO tooling (`seo_*`, ~40 tables), search
console integrations (`gsc_*`, `ga4_*`, `bing_*`, `yandex_*`), billing
(`subscriptions`, `user_subscriptions`, `invoices`, `stripe_*`, `feature_*`),
auth and security (`mfa_*`, `sso_*`, `login_attempts`, `user_sessions`,
`audit_logs`), workflows (`workflow_*`), teams (`teams`, `team_members`), and
the free tools (`instagram_bio_*`, `listing_*`).

### Database Patterns

**Row Level Security (RLS):**
- RLS is enabled on every table in `public`, enforced by `verify:schema`.
- Enabling RLS is not the same as scoping it. Supabase grants `ALL` on public
  tables to `anon` and `authenticated`, and the anon key ships in the frontend
  bundle, so a policy written `FOR ALL USING (true)` with no `TO` clause grants
  the world — Postgres defaults an omitted `TO` to `TO PUBLIC`. Sixteen policies
  were written that way; see migration `20260806000001`.
- A policy meant for the backend must say `TO service_role` explicitly.
- `verify:schema` fails on any unconditional policy reaching
  `anon`/`authenticated` that is not declared in `PUBLIC_BY_DESIGN`.

**SECURITY DEFINER functions:**
- Must pin `SET search_path = public, extensions, pg_temp`. Without it the
  caller controls how unqualified names resolve inside a function running with
  owner privileges — a temp table can shadow a real one. Enforced by
  `verify:schema`; `extensions` is where pgcrypto lives, `pg_temp` is named last
  so it is searched last rather than first.

**Soft deletes:**
- Effectively unused: exactly one table carries `deleted_at`. There is no
  `usesSoftDelete` hook, despite what this document used to claim.

**Timestamps:**
- Most tables have `created_at`; 10 do not, so do not assume it.
- Many have `updated_at` maintained by a trigger. A trigger for a column the
  table lacks aborts every UPDATE — this happened to `seo_monitoring_schedules`.

**Foreign keys:**
- Enforced, with `ON DELETE CASCADE` where appropriate.

**Migrations:**
- `supabase/migrations/` applies to an empty database in filename order, in one
  pass, with `ON_ERROR_STOP=1`. It used to fail in ten places (duplicate
  timestamp prefixes, files indexing columns a later migration adds) and CI
  worked around it with three passes; US-060 replaced the 89 non-order-independent
  files with a squashed baseline. `.github/workflows/verify-backend.yml` now
  fails rather than converging on a later pass, so a migration that is not
  order-independent is caught immediately.

---

## Common Tasks

### Adding a New Page

1. **Create page component:**
   ```typescript
   // src/pages/MyNewPage.tsx
   export const MyNewPage = () => {
     return <div>My New Page</div>;
   };

   export default MyNewPage;
   ```

2. **Add lazy import in App.tsx:**
   ```typescript
   const MyNewPage = lazy(() => import('./pages/MyNewPage'));
   ```

3. **Add route:**
   ```typescript
   <Route path="/my-new-page" element={<MyNewPage />} />
   ```

### Adding a New Component

1. **Create component file:**
   ```typescript
   // src/components/features/MyComponent.tsx
   interface MyComponentProps {
     title: string;
   }

   export const MyComponent = ({ title }: MyComponentProps) => {
     return <div>{title}</div>;
   };
   ```

2. **Use in pages:**
   ```typescript
   import { MyComponent } from '@/components/features/MyComponent';
   ```

### Adding a New Hook

1. **Create hook file:**
   ```typescript
   // src/hooks/useMyFeature.ts
   export const useMyFeature = (param: string) => {
     const [state, setState] = useState(null);

     useEffect(() => {
       // Logic here
     }, [param]);

     return { state };
   };
   ```

2. **Use in components:**
   ```typescript
   import { useMyFeature } from '@/hooks/useMyFeature';

   const { state } = useMyFeature('value');
   ```

### Adding Database Migration

1. **Create migration file:**
   ```bash
   # supabase/migrations/YYYYMMDD_description.sql
   ```

2. **Write SQL:**
   ```sql
   CREATE TABLE IF NOT EXISTS my_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

   -- Add policies
   CREATE POLICY "Users can read own data"
     ON my_table FOR SELECT
     USING (auth.uid() = user_id);
   ```

3. **Update TypeScript types:**
   - Regenerate types from Supabase dashboard or CLI
   - Update `src/types/database.ts`

### Adding Edge Function

1. **Create function directory:**
   ```bash
   mkdir supabase/functions/my-function
   ```

2. **Create index.ts:**
   ```typescript
   // supabase/functions/my-function/index.ts
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

   serve(async (req) => {
     const supabase = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_ANON_KEY')!
     );

     // Function logic here

     return new Response(JSON.stringify({ success: true }), {
       headers: { 'Content-Type': 'application/json' },
     });
   });
   ```

3. **Deploy:**
   ```bash
   supabase functions deploy my-function
   ```

---

## Security Considerations

### Authentication

- **Never store passwords** - Use Supabase Auth
- **Validate JWT tokens** on the backend (automatic with Supabase)
- **Implement RLS** on all tables
- **Use HTTPS only** in production

### Input Validation

- **Validate on client and server**
- **Use Zod schemas** for type-safe validation
- **Sanitize user input** before rendering (use DOMPurify)
- **Parameterized queries** (Supabase handles this)

### XSS Prevention

```typescript
import DOMPurify from 'dompurify';

// Sanitize HTML content
const cleanHTML = DOMPurify.sanitize(userInput);
```

### CSRF Protection

- Supabase Auth handles CSRF tokens
- Use proper CORS settings on Edge Functions

### Environment Variables

- **Never commit `.env.local`**
- **Prefix with VITE_** for client-side variables
- **Validate required env vars** at startup (see `client.ts`)

### Content Security Policy

- Configured in `vite.config.ts` for dev
- Set proper CSP headers in production (Cloudflare Pages)

---

## Performance Guidelines

### Code Splitting

- **Lazy load routes** (see App.tsx)
- **Lazy load heavy components** (3D graphics, charts)
- **Use dynamic imports** for large libraries

### Image Optimization

- **Use WebP format** when possible
- **Implement lazy loading** with `loading="lazy"`
- **Use ProgressiveImage component** for large images
- **Compress images** before upload

### Caching Strategy

**TanStack Query:**
```typescript
useQuery({
  queryKey: ['data', id],
  queryFn: fetchData,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Service Worker:**
- PWA caching via `workbox-window`
- Offline-first for critical resources

### Bundle Size

- **Monitor bundle size** with `npm run build`
- **Avoid large dependencies** without tree-shaking
- **Use `iife` format** for better compatibility (see vite.config.ts)

### Database Queries

- **Select only needed columns**: `.select('id, title')` not `.select('*')`
- **Use indexes** on frequently queried columns
- **Paginate large result sets**
- **Avoid N+1 queries** - use joins or batch fetching

---

## Testing Strategy

### Current State

- **No automated tests yet** - Tests should be added progressively
- Manual testing workflow in place

### Recommended Testing Approach

**Unit Tests:**
- Test utilities and pure functions
- Use Vitest (fast, Vite-native)

**Component Tests:**
- Test UI components in isolation
- Use Testing Library

**Integration Tests:**
- Test user flows
- Mock Supabase client

**E2E Tests:**
- Test critical paths (auth, lead capture, listing creation)
- Use Playwright or Cypress

---

## Recent Improvements (2025-2026)

### Security Enhancements

**Secure Logger (`src/lib/logger.ts`):**
- Environment-aware logging that prevents sensitive data exposure in production
- Automatic redaction of passwords, tokens, API keys, and other sensitive data
- Truncated user IDs for privacy
- Stack traces hidden in production mode

```typescript
import { logger } from '@/lib/logger';

// Use instead of console.log
logger.info('User logged in', { userId: user.id });
logger.error('Operation failed', error, { action: 'update_profile' });
logger.authEvent('login_success', user.id);
```

**IDOR Protection:**
- All database queries validate user ownership
- Row Level Security (RLS) enforced on all tables
- Input sanitization with DOMPurify

**Login Security (`src/hooks/useLoginSecurity.ts`):**
- Brute force protection with login throttling
- Device fingerprinting for session tracking
- Failed login attempt tracking

### Mobile Optimization

**PWA Features:**
- `usePullToRefresh` hook for mobile refresh patterns
- Offline storage with IndexedDB (`src/lib/offline-storage.ts`)
- Sync manager for offline data synchronization
- 44px minimum touch targets for iOS compliance

**Mobile Components (`src/components/mobile/`):**
- `MobileNav` with responsive navigation
- `PullToRefresh` component
- Mobile-optimized form inputs with proper `inputMode`

### Error Handling Patterns

**Preferred Pattern:**
```typescript
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

try {
  await riskyOperation();
} catch (error) {
  // For errors that need tracking/monitoring
  errorHandler.captureException(error as Error, {
    action: 'operation_name',
    component: 'ComponentName',
  });

  // For debug logging
  logger.error('Operation failed', error);

  // User feedback
  toast.error('Something went wrong. Please try again.');
}
```

---

## Key Files to Reference

### Configuration

- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind/theming configuration
- `.env.example` - Environment variables template

### Core Application

- `src/App.tsx` - Main routing and app structure
- `src/main.tsx` - Application entry point
- `src/index.css` - Global styles and CSS variables

### Authentication & State

- `src/stores/useAuthStore.ts` - Global auth state
- `src/integrations/supabase/client.ts` - Supabase client
- `src/lib/errorHandler.ts` - Error handling utility

### Types

- `src/types/database.ts` - Database schema types
- `src/integrations/supabase/types.ts` - Auto-generated Supabase types

### Security & Logging

- `src/lib/logger.ts` - Secure logger with auto-redaction
- `src/lib/errorHandler.ts` - Centralized error handling
- `src/hooks/useLoginSecurity.ts` - Login throttling and protection

### Mobile & PWA

- `src/hooks/usePullToRefresh.ts` - Pull-to-refresh functionality
- `src/lib/offline-storage.ts` - IndexedDB offline storage
- `src/lib/sync-manager.ts` - Offline sync management
- `src/components/mobile/MobileNav.tsx` - Mobile navigation

---

## Documentation References

### External Docs

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [TanStack Query](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Zustand](https://zustand-demo.pmnd.rs/)

### Internal Docs

Six files stay in the root — `README.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
`SECURITY.md`, `CODE_OF_CONDUCT.md` and `LICENSE`. Everything else moved under
`docs/` in US-121, when the root held 121 markdown files:

| Directory | Holds | Examples |
| --- | --- | --- |
| `docs/setup/` | Getting a working environment, and per-integration setup | `GETTING_STARTED.md`, `AUTH_SETUP_DOCUMENTATION.md`, `OAUTH_SELF_HOSTED_GUIDE.md` |
| `docs/deploy/` | Shipping it — Cloudflare, Coolify, edge functions, monitoring | `CLOUDFLARE_DEPLOYMENT.md`, `EDGE_FUNCTIONS_DEPLOYMENT.md`, `MONITORING.md` |
| `docs/architecture/` | How it is built | `FRONTEND_ARCHITECTURE.md`, `API_DOCUMENTATION.md`, `PERFORMANCE_OPTIMIZATIONS.md` |
| `docs/product/` | What it is meant to do | `PRD.md`, `FEATURES_README.md`, `USER_JOURNEY_MAP.md` |
| `docs/seo/` | The SEO programme | `SEO_SYSTEM_OVERVIEW.md`, `INTERNAL_LINKING_STRATEGY.md` |
| `docs/reviews/` | Audits and code reviews, dated | `CODE_REVIEW_2026-08.md`, `SECURITY_AUDIT_COMPREHENSIVE.md` |
| `docs/archive/` | Point-in-time status notes, migration write-ups and sprint summaries kept for history | `SPRINT_*_IMPLEMENTATION_SUMMARY.md`, `SESSION_SUMMARY.md` |

`docs/archive/` is history, not guidance: it records what was true on a
particular day. Do not treat anything in it as current.

`prd.json` and `progress.txt` stay in the root, because the loop that drives the
work reads them there.

---

## Working with This Codebase

### As an AI Assistant

When working with this codebase, you should:

1. **Understand the Context**: This is a production real estate SaaS platform with real users
2. **Follow Conventions**: Adhere to the patterns established in existing code
3. **Type Safety First**: Always use TypeScript properly, no `any` types
4. **Think Performance**: Code-split, lazy-load, and optimize queries
5. **Security Conscious**: Validate inputs, use RLS, follow security best practices
6. **Mobile-First**: Consider mobile UX in all UI changes
7. **Accessibility**: Use semantic HTML and ARIA attributes appropriately
8. **Error Handling**: Always handle errors gracefully with user-friendly messages
9. **Test Your Changes**: Manually test in the UI before considering complete

### Common Pitfalls to Avoid

- **Don't bypass TypeScript**: Use proper types, not `as any`
- **Don't skip error handling**: Always handle Supabase errors
- **Don't forget RLS**: All new tables need Row Level Security
- **Don't bundle everything**: Lazy load non-critical code
- **Don't ignore mobile**: Test responsive design
- **Don't commit secrets**: Check `.env.local` is in `.gitignore`
- **Don't skip migrations**: Database changes need migration files

### When in Doubt

1. Look for existing patterns in the codebase
2. Check similar components for reference
3. Refer to external documentation
4. Ask clarifying questions before implementing

---

## Maintenance

### Keeping This Document Updated

When making significant changes to the codebase:

- **Update architecture sections** if structure changes
- **Update conventions** if new patterns are adopted
- **Update tech stack** when dependencies change significantly
- **Update database schema** when tables are added/modified
- **Update common tasks** when workflows change

**Last major update:** 2026-01-01

---

## Questions or Issues?

- **Repository**: [https://github.com/dj-pearson/plain-page-link](https://github.com/dj-pearson/plain-page-link)
- **Support**: support@agentbio.net
- **Website**: [https://agentbio.net](https://agentbio.net)

---

*This document was created to help AI assistants (like Claude) understand and work effectively with the AgentBio codebase. It should be treated as a living document and updated as the project evolves.*

<!-- SELVEDGE:START -->
## Pearson Media — shared context

*Managed from the vault. Edit `14 - Resources/Shared CLAUDE Block.md` in the vault; direct edits between these markers are overwritten once a sync exists. Everything outside them is yours and is never touched.*

**The memory vault.** Portfolio-wide memory lives in the **Hermes** vault at `<your-home>\Documents\Hermes` (`C:\Users\dpearson\Documents\Hermes` on this machine; remote: https://github.com/dj-pearson/Hermes). It holds the profile, the map of all ten projects, and cross-project knowledge. Read `VAULT-INDEX.md` there when a task needs context beyond this repo. This repo's own `CLAUDE.md`, `~/.claude` memory, and skills remain authoritative for work inside it — the vault supplements them, never replaces them.

**Name the project.** Pearson Media runs ten projects on a shared stack. Never say "the app," "the repo," or "production" without naming which one. A right answer about the wrong project is a wrong answer.

**The shared stack.** React + TypeScript + Vite, Tailwind, shadcn/ui, self-hosted Supabase, Cloudflare Pages, Coolify on Contabo, Stripe. A problem solved in one repo is usually already solved for this one — check the vault before solving it twice.

**Secrets are references, never values.** Never write a password, key, or token value into a note, summary, commit, or setup doc; name where it's stored instead. Loose credential files exist under your `Documents` folder (`C:\Users\dpearson\Documents` on this machine) — never read one into a document.

**Never delete what Claude Code relies on.** Repo `CLAUDE.md` files, `~/.claude/projects/*/memory/`, `.claude/skills/`, settings. Copy from them freely; removing or stubbing them is Dj's call alone.

**Evidence only.** Verify state from the actual file or command before claiming anything is done or in place. If unsure, say so and go find out.

**UI has a craft floor.** Every model trained on the same SaaS templates, so the *default* frontend output is a recognizable handful of tells — and Tailwind + shadcn/ui puts each of them one autocomplete away. Treat the following as the category's defaults rather than as bans: the brief's own words can earn any of them, but reaching for one on a free axis means you were not deciding. Refuse **purple/blue gradients and gradient text** (emphasis comes from weight and size); **Inter or a system default as the type *choice***; a colored **`border-left`/`border-right` above 1px** on cards, list items, callouts or alerts — the single most recognizable tell; grids of **same-size icon-tile + heading + text cards** as the page structure, and **cards nested in cards**; a **1px border under a wide soft shadow** (declare elevation once — border *or* shadow); **gray text on colored surfaces** (tint secondary text from the surface hue or the foreground); **bounce/elastic easing**; **monospace as a costume** for "technical" rather than for code, data or measurement; and a **tracked uppercase eyebrow over every section**. Keep body measure at 65–75ch, tracking no tighter than -0.04em, and card radii at 12–16px.

**Check UI, don't just intend it.** `npx impeccable detect <path>` runs 60 deterministic anti-pattern rules with no install, no API key and no LLM — it works from any repo, so there is no excuse for asserting a UI is clean. Use the `/impeccable` skill (`audit`, `critique`, `polish`, `colorize`, `typeset`) for the judgement calls it cannot make. Source: [Impeccable](https://github.com/pbakaus/impeccable), Apache 2.0.
<!-- SELVEDGE:END -->
