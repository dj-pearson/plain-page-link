# AgentBio.net - Real Estate Link-in-Bio Platform

> Built on LinkStack foundation, modernized with React + TypeScript frontend

## 🏗️ Project Structure

```
plain-page-link/
├── frontend/              # React + TypeScript frontend (NEW)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities and API client
│   │   ├── types/        # TypeScript definitions
│   │   ├── styles/       # Global styles
│   │   └── store/        # Global state (Zustand)
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── app/                   # Laravel backend (LinkStack base)
├── routes/                # API routes
├── database/              # Migrations and seeders
├── resources/             # Laravel views (legacy)
│
├── PRD.md                 # Product Requirements Document
├── DATABASE_REQUIREMENTS.md   # Complete database schema
├── FRONTEND_ARCHITECTURE.md   # Frontend tech stack & architecture
└── SETUP_SUMMARY.md       # Current progress & next steps
```

## 🚀 Quick Start

### Frontend Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:5173**

### Backend Development (Laravel API)

```bash
# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Run migrations
php artisan migrate

# Start Laravel server
php artisan serve
```

Backend API runs on: **http://localhost:8000**

## 📚 Documentation

-   **[PRD.md](./PRD.md)** - Complete product requirements and market analysis
-   **[DATABASE_REQUIREMENTS.md](./DATABASE_REQUIREMENTS.md)** - Database schema and API endpoints
-   **[FRONTEND_ARCHITECTURE.md](./FRONTEND_ARCHITECTURE.md)** - Frontend tech stack and structure
-   **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)** - Current progress and next steps

## 🎯 Key Features (from PRD)

### For Real Estate Agents:

-   ✅ Professional profile page with photo, bio, credentials
-   ✅ Property listing gallery (active, pending, sold)
-   ✅ Lead capture forms (buyer, seller, home valuation)
-   ✅ Client testimonials and reviews
-   ✅ Custom links and CTAs
-   ✅ Calendar integration for bookings
-   ✅ Theme customization (colors, fonts, layout)
-   ✅ Analytics dashboard
-   ✅ Mobile-optimized design

### For Visitors:

-   Clean, fast-loading profile pages
-   Easy property browsing
-   One-click contact and booking
-   Mobile-first experience

## 💻 Tech Stack

### Frontend

-   **React 18** - UI library
-   **TypeScript 5** - Type safety
-   **Vite** - Build tool
-   **Tailwind CSS** - Styling
-   **TanStack Query** - Data fetching
-   **React Router** - Routing
-   **React Hook Form** - Form handling
-   **Zod** - Validation
-   **Zustand** - State management

### Backend

-   **Laravel 10** - PHP framework
-   **MySQL** - Database
-   **PHP 8.2+** - Server language

## 📦 Current Status

### ✅ Completed

-   [x] Project documentation (PRD, database schema, architecture)
-   [x] Frontend project setup (Vite, TypeScript, Tailwind)
-   [x] Complete TypeScript type system
-   [x] Utility libraries and API client
-   [x] Route configuration
-   [x] Development environment

### 🚧 In Progress

-   [ ] Core agent profile components
-   [ ] Public profile page
-   [ ] Admin dashboard layout

### ⏳ Coming Next

-   [ ] Property listing components
-   [ ] Lead capture forms
-   [ ] Theme customization
-   [ ] Analytics dashboard
-   [ ] Backend API implementation

See **[SETUP_SUMMARY.md](./SETUP_SUMMARY.md)** for detailed progress.

## 🎨 Theme System

Six pre-built themes for real estate agents:

1. **Luxury** - Dark, elegant, for high-end properties
2. **Modern Clean** - Bright, minimalist
3. **Classic Professional** - Traditional navy/gold
4. **Coastal** - Light blues, beach vibes
5. **Urban Contemporary** - Bold, geometric
6. **Farmhouse Charm** - Warm, rustic

Each agent can customize:

-   Colors (primary, secondary, accent)
-   Fonts (heading, body)
-   Layout (header style, button shape, spacing)
-   Hero images

## 📱 Mobile-First Design

-   80%+ traffic expected from mobile devices
-   Optimized for Instagram/TikTok bio links
-   Touch-friendly interactions
-   Fast page loads (<2 seconds on 4G)

## 🔐 Security

-   Bearer token authentication
-   CSRF protection
-   Input validation (Zod schemas)
-   Rate limiting on forms
-   Encrypted data storage
-   GDPR/CCPA compliant

## 📊 Analytics & Tracking

Privacy-first analytics:

-   Page views and unique visitors
-   Traffic sources (Instagram, Facebook, direct, etc.)
-   Link click tracking
-   Lead conversion funnel
-   Property view analytics
-   No third-party tracking cookies

## 🌐 Deployment

### Frontend (Vite Build)

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

### Backend (Laravel)

```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 🤝 Contributing

This is a private project built on the LinkStack open-source foundation.

LinkStack: https://github.com/LinkStackOrg/LinkStack

## 📄 License

AGPL-3.0 (inherited from LinkStack)

## 🔗 Related Links

-   [LinkStack Documentation](https://linkstack.org)
-   [Product Requirements (PRD)](./PRD.md)
-   [Database Schema](./DATABASE_REQUIREMENTS.md)

---

**Last Updated:** October 30, 2025  
**Version:** 1.0.0-alpha  
**Status:** In Development 🚧
