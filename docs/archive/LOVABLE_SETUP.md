# ✅ Lovable Setup Complete - AgentBio.net

## Project Structure

This is **AgentBio.net** - a TypeScript/React link-in-bio platform for real estate agents, built on top of LinkStack features.

## Key Files

- `src/App.tsx` - Main routing (Landing, Dashboard, Profile pages)
- `src/main.tsx` - App entry point with React Query
- `src/index.css` - Tailwind CSS with design system
- `src/pages/public/Landing.tsx` - Homepage
- `src/pages/dashboard/Links.tsx` - LinkStack link manager
- `src/components/dashboard/LinkManager.tsx` - Full CRUD link management

## Features Available

### Public Pages
- `/` - Landing page with hero, features, CTA
- `/:slug` - Dynamic profile pages (e.g., `/sarah-johnson-realtor`)
- `/auth/login` - Login page
- `/auth/register` - Registration page

### Dashboard Pages (Protected)
- `/dashboard` - Overview with stats
- `/dashboard/links` - **LinkStack link manager** (add/edit/delete custom links)
- `/dashboard/listings` - Property listings management
- `/dashboard/leads` - Lead tracking
- `/dashboard/profile` - Profile editor
- `/dashboard/theme` - Theme customization
- `/dashboard/testimonials` - Client testimonials
- `/dashboard/analytics` - Analytics dashboard
- `/dashboard/settings` - Account settings

## LinkStack Features Ported

✅ All 8 block types supported:
1. **Link** - Standard URL buttons
2. **Predefined** - Social media (Instagram, Facebook, Twitter, etc.)
3. **Heading** - Section titles
4. **Text** - Content blocks
5. **Spacer** - Vertical spacing
6. **Telephone** - Click-to-call
7. **Email** - Click-to-email
8. **vCard** - Contact card download

## Tech Stack

- React 18
- TypeScript 5
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Radix UI (Dialog, Select, Tabs, etc.)
- Lucide Icons
- Sonner (Toasts)
- Zustand (State)

## Development

```bash
npm install
npm run dev
```

App runs on port 8080 in Lovable.

## Notes

- All UI components are in `src/components/ui/`
- LinkStack types are in `src/types/linkstack.ts`
- Currently uses mock data (no backend API yet)
- Ready for Lovable deployment

