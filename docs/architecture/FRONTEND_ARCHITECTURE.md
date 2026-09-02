# Frontend Architecture - AgentBio.net

**Project:** AgentBio.net Real Estate Link-in-Bio Platform  
**Tech Stack:** React 18 + TypeScript 5 + Tailwind CSS 3 + Vite  
**Last Updated:** October 30, 2025

---

## Technology Stack

### Core Framework

-   **React 18.2+** - UI library with hooks, suspense, concurrent features
-   **TypeScript 5+** - Type safety and developer experience
-   **Vite 5+** - Fast build tool and dev server
-   **React Router 6+** - Client-side routing

### Styling

-   **Tailwind CSS 3+** - Utility-first CSS framework
-   **shadcn/ui** - Re-usable component library (already available)
-   **Framer Motion** - Animations and transitions
-   **Lucide React** - Icon library

### State Management

-   **TanStack Query (React Query)** - Server state management
-   **Zustand** - Lightweight global state (theme, auth)
-   **React Hook Form** - Form state management
-   **Zod** - Schema validation

### Data Fetching

-   **Axios** - HTTP client with interceptors
-   **TanStack Query** - Caching, background updates, optimistic updates

### File Upload

-   **React Dropzone** - Drag & drop file uploads
-   **react-image-crop** - Image cropping for profiles/listings

### Maps & Location

-   **React Leaflet** or **Google Maps React** - Property location display
-   **Geoapify** or **Google Places** - Address autocomplete

### Analytics

-   **Custom analytics** - Privacy-first tracking
-   **Recharts** - Charts and graphs for analytics dashboard

### Calendar Integration

-   **react-big-calendar** - Calendar UI
-   **date-fns** - Date manipulation

### Rich Text

-   **TipTap** or **Quill** - Rich text editor for descriptions

---

## Project Structure

```
src/
├── main.tsx                    # App entry point
├── App.tsx                     # Root component with routing
├── vite-env.d.ts              # Vite type definitions
│
├── components/                 # Reusable components
│   ├── ui/                    # shadcn/ui components (existing)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   │
│   ├── profile/               # Public profile components
│   │   ├── ProfileHeader.tsx
│   │   ├── AgentBio.tsx
│   │   ├── ContactButtons.tsx
│   │   ├── SocialLinks.tsx
│   │   ├── ListingGallery.tsx
│   │   ├── ListingCard.tsx
│   │   ├── ListingDetailModal.tsx
│   │   ├── SoldProperties.tsx
│   │   ├── TestimonialCarousel.tsx
│   │   ├── CustomLinksList.tsx
│   │   └── QRCodeDisplay.tsx
│   │
│   ├── forms/                 # Lead capture forms
│   │   ├── BuyerInquiryForm.tsx
│   │   ├── SellerInquiryForm.tsx
│   │   ├── HomeValuationForm.tsx
│   │   ├── ContactForm.tsx
│   │   └── ScheduleShowingForm.tsx
│   │
│   ├── admin/                 # Admin dashboard components
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── StatsCard.tsx
│   │   ├── ListingManager.tsx
│   │   ├── ListingEditor.tsx
│   │   ├── TestimonialManager.tsx
│   │   ├── LeadsDashboard.tsx
│   │   ├── LeadCard.tsx
│   │   ├── LinkManager.tsx
│   │   ├── ProfileEditor.tsx
│   │   ├── ThemeCustomizer.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── FontSelector.tsx
│   │   └── PhotoUploader.tsx
│   │
│   ├── analytics/             # Analytics components
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── TrafficChart.tsx
│   │   ├── ConversionFunnel.tsx
│   │   ├── TopListingsChart.tsx
│   │   ├── SourceBreakdown.tsx
│   │   └── MetricsCards.tsx
│   │
│   ├── theme/                 # Theme system
│   │   ├── ThemeProvider.tsx
│   │   ├── ThemePreview.tsx
│   │   └── themes/
│   │       ├── luxury.ts
│   │       ├── modern-clean.ts
│   │       ├── classic.ts
│   │       ├── coastal.ts
│   │       ├── urban.ts
│   │       └── farmhouse.ts
│   │
│   ├── layout/                # Layout components
│   │   ├── PublicLayout.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── Header.tsx
│   │
│   └── common/                # Common shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       ├── ImageGallery.tsx
│       ├── MapView.tsx
│       ├── Badge.tsx
│       ├── Avatar.tsx
│       └── EmptyState.tsx
│
├── pages/                     # Page components (routes)
│   ├── public/
│   │   ├── ProfilePage.tsx    # Main public profile view
│   │   ├── NotFound.tsx
│   │   └── Landing.tsx        # Marketing landing page
│   │
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   │
│   └── dashboard/             # Admin dashboard pages
│       ├── Overview.tsx       # Dashboard home
│       ├── Listings.tsx       # Manage listings
│       ├── Leads.tsx          # Manage leads
│       ├── Analytics.tsx      # Analytics page
│       ├── Profile.tsx        # Edit profile
│       ├── Theme.tsx          # Theme customization
│       ├── Links.tsx          # Manage custom links
│       ├── Testimonials.tsx   # Manage testimonials
│       └── Settings.tsx       # Account settings
│
├── hooks/                     # Custom React hooks
│   ├── useAuth.ts            # Authentication hook
│   ├── useProfile.ts         # Profile data hook
│   ├── useListings.ts        # Listings CRUD hook
│   ├── useLeads.ts           # Leads management hook
│   ├── useAnalytics.ts       # Analytics data hook
│   ├── useTheme.ts           # Theme customization hook
│   ├── useMediaQuery.ts      # Responsive breakpoints
│   ├── useDebounce.ts        # Debounce values
│   └── useIntersectionObserver.ts  # Lazy loading
│
├── lib/                       # Utility libraries
│   ├── api/                   # API client
│   │   ├── client.ts         # Axios instance with interceptors
│   │   ├── auth.ts           # Auth endpoints
│   │   ├── profiles.ts       # Profile endpoints
│   │   ├── listings.ts       # Listing endpoints
│   │   ├── leads.ts          # Lead endpoints
│   │   ├── testimonials.ts   # Testimonial endpoints
│   │   ├── links.ts          # Link endpoints
│   │   ├── theme.ts          # Theme endpoints
│   │   └── analytics.ts      # Analytics endpoints
│   │
│   ├── utils.ts              # General utilities
│   ├── format.ts             # Formatting helpers (price, date, phone)
│   ├── validation.ts         # Zod schemas
│   ├── constants.ts          # App constants
│   └── analytics-tracker.ts  # Client-side analytics tracking
│
├── store/                     # Global state management
│   ├── auth.ts               # Auth store (Zustand)
│   ├── theme.ts              # Theme store (Zustand)
│   └── ui.ts                 # UI state (modals, sidebar, etc.)
│
├── types/                     # TypeScript types
│   ├── index.ts              # Re-exports
│   ├── user.ts               # User & auth types
│   ├── profile.ts            # Profile types
│   ├── listing.ts            # Listing types
│   ├── lead.ts               # Lead types
│   ├── testimonial.ts        # Testimonial types
│   ├── link.ts               # Link types
│   ├── theme.ts              # Theme types
│   └── analytics.ts          # Analytics types
│
├── styles/                    # Global styles
│   ├── index.css             # Tailwind imports, global styles
│   ├── themes.css            # Theme-specific CSS variables
│   └── animations.css        # Custom animations
│
└── assets/                    # Static assets
    ├── images/
    │   ├── logo.svg
    │   ├── placeholder-profile.png
    │   ├── placeholder-property.jpg
    │   └── themes/           # Theme preview images
    └── icons/
        └── custom-icons.svg
```

---

## Component Architecture

### Component Design Principles

1. **Composition over inheritance** - Build complex UIs from simple components
2. **Single Responsibility** - Each component does one thing well
3. **Props-driven** - Components controlled via props, not internal state
4. **Type-safe** - All props and state fully typed with TypeScript
5. **Accessible** - WCAG 2.1 AA compliant
6. **Responsive** - Mobile-first design

### Component Patterns

#### Container/Presentational Pattern

-   **Container components**: Handle data fetching, state management
-   **Presentational components**: Pure UI, receive data via props

Example:

```typescript
// Container
export function ListingsContainer() {
    const { data: listings, isLoading } = useListings();

    if (isLoading) return <LoadingSpinner />;

    return <ListingGallery listings={listings} />;
}

// Presentational
export function ListingGallery({ listings }: { listings: Listing[] }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
            ))}
        </div>
    );
}
```

#### Compound Components Pattern

For complex components with multiple related sub-components:

```typescript
<ListingDetailModal>
    <ListingDetailModal.Header />
    <ListingDetailModal.Gallery />
    <ListingDetailModal.Description />
    <ListingDetailModal.CTAs />
</ListingDetailModal>
```

---

## State Management Strategy

### Server State (TanStack Query)

-   Profile data
-   Listings
-   Leads
-   Testimonials
-   Analytics data

**Benefits**: Automatic caching, background refetching, optimistic updates

### Client State (Zustand)

-   Authentication status & user data
-   Theme settings (in-memory)
-   UI state (sidebar open/closed, active modal)

### Form State (React Hook Form)

-   All forms use React Hook Form for validation and submission
-   Zod schemas for validation

---

## Routing Structure

```typescript
/                           → Landing page (marketing)
/:slug                      → Public profile page
/auth/login                 → Login
/auth/register              → Register
/auth/forgot-password       → Forgot password

/dashboard                  → Dashboard overview (protected)
/dashboard/listings         → Manage listings
/dashboard/listings/new     → Add listing
/dashboard/listings/:id     → Edit listing
/dashboard/leads            → Lead management
/dashboard/testimonials     → Manage testimonials
/dashboard/links            → Manage custom links
/dashboard/analytics        → Analytics
/dashboard/profile          → Edit profile
/dashboard/theme            → Theme customization
/dashboard/settings         → Account settings
```

---

## API Integration Pattern

### API Client Setup (Axios)

```typescript
// lib/api/client.ts
import axios from "axios";

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);

export default apiClient;
```

### React Query Setup

```typescript
// hooks/useListings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as listingsApi from "@/lib/api/listings";

export function useListings() {
    return useQuery({
        queryKey: ["listings"],
        queryFn: listingsApi.getListings,
    });
}

export function useCreateListing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: listingsApi.createListing,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["listings"] });
        },
    });
}
```

---

## Styling Strategy

### Tailwind Configuration

Custom theme extending default Tailwind:

```typescript
// tailwind.config.ts
export default {
    theme: {
        extend: {
            colors: {
                primary: "var(--color-primary)",
                secondary: "var(--color-secondary)",
                accent: "var(--color-accent)",
            },
            fontFamily: {
                heading: "var(--font-heading)",
                body: "var(--font-body)",
            },
        },
    },
};
```

### CSS Variables for Dynamic Theming

```css
/* styles/themes.css */
:root[data-theme="modern-clean"] {
    --color-primary: #2563eb;
    --color-secondary: #10b981;
    --color-accent: #f59e0b;
    --font-heading: "Inter", sans-serif;
    --font-body: "Inter", sans-serif;
}

:root[data-theme="luxury"] {
    --color-primary: #1e293b;
    --color-secondary: #d4af37;
    --color-accent: #ffffff;
    --font-heading: "Playfair Display", serif;
    --font-body: "Montserrat", sans-serif;
}
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load admin pages
const Dashboard = lazy(() => import("@/pages/dashboard/Overview"));
const Listings = lazy(() => import("@/pages/dashboard/Listings"));
```

### Image Optimization

-   Lazy load images with Intersection Observer
-   Use WebP format with fallback
-   Serve responsive images (srcset)
-   Blur placeholder while loading

### Bundle Optimization

-   Tree-shaking unused code
-   Dynamic imports for heavy components
-   Vite code splitting

---

## Testing Strategy (Future)

-   **Unit Tests**: Vitest for utilities and hooks
-   **Component Tests**: React Testing Library
-   **E2E Tests**: Playwright
-   **Type Safety**: TypeScript strict mode

---

## Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:8000/api
VITE_APP_URL=http://localhost:5173
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_STRIPE_PUBLIC_KEY=your_key_here
```

---

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Build for production**: `npm run build`
3. **Preview build**: `npm run preview`
4. **Type check**: `npm run type-check`
5. **Lint**: `npm run lint`

---

## Next Steps

1. ✅ Set up Vite + React + TypeScript project
2. Configure Tailwind CSS with custom theme
3. Install dependencies (React Query, Zustand, React Hook Form, etc.)
4. Create base layout components
5. Implement authentication flow
6. Build public profile page components
7. Build admin dashboard components
8. Integrate with Laravel API

---

**This is a living document and will be updated as the frontend architecture evolves.**
