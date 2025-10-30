# Backend Requirements Tracker

This document tracks all backend features needed for AgentBio.net as we build out the frontend.

## Status Legend
- 🔴 Not Started
- 🟡 In Progress  
- 🟢 Complete

## Frontend Progress
✅ Dashboard Layout with Sidebar
✅ Overview/Dashboard page
✅ Listings page (UI)
✅ Leads page (UI)
✅ Links page (UI)
⏳ Testimonials page (needs full implementation)
⏳ Profile page (needs full implementation)
⏳ Theme/Branding page (needs full implementation)
⏳ Analytics page (needs full implementation)
⏳ Settings page (needs full implementation)
⏳ Public Profile page (needs work)

---

## 1. Authentication & User Management 🟡

### API Endpoints Needed:
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user profile
- `PUT /api/user` - Update user profile
- `POST /api/user/avatar` - Upload avatar image

### Database Tables:
- `users` table (already exists in Laravel)
  - id, name, email, password, littlelink_name, littlelink_description, role, block, theme, etc.

---

## 2. Links Management 🔴

### API Endpoints Needed:
- `GET /api/links` - Get all user links
- `POST /api/links` - Create new link
- `PUT /api/links/{id}` - Update link
- `DELETE /api/links/{id}` - Delete link
- `PUT /api/links/reorder` - Reorder links (drag & drop)

### Database Tables:
- `links` table
  - id, user_id, title, url, icon, order, active, click_count, created_at, updated_at

---

## 3. Property Listings 🔴

### API Endpoints Needed:
- `GET /api/properties` - Get user properties
- `POST /api/properties` - Create property
- `PUT /api/properties/{id}` - Update property
- `DELETE /api/properties/{id}` - Delete property
- `GET /api/properties/{id}/public` - Public property view

### Database Tables:
- `properties` table
  - id, user_id, title, description, price, address, city, state, zip, bedrooms, bathrooms, sqft, status (active/sold/pending), featured, images (JSON), virtual_tour_url, created_at, updated_at

---

## 4. Lead Capture Forms 🔴

### API Endpoints Needed:
- `POST /api/leads` - Submit lead form
- `GET /api/leads` - Get user's leads
- `PUT /api/leads/{id}` - Update lead status
- `DELETE /api/leads/{id}` - Delete lead

### Database Tables:
- `leads` table
  - id, user_id, name, email, phone, message, source (property, contact form, etc), status (new/contacted/converted), created_at, updated_at

### Integrations:
- Email notifications for new leads
- Zapier webhook integration
- CRM integration (HubSpot, Salesforce, etc.)

---

## 5. Testimonials & Reviews 🔴

### API Endpoints Needed:
- `GET /api/testimonials` - Get user testimonials
- `POST /api/testimonials` - Create testimonial
- `PUT /api/testimonials/{id}` - Update testimonial
- `DELETE /api/testimonials/{id}` - Delete testimonial

### Database Tables:
- `testimonials` table
  - id, user_id, client_name, client_photo, rating, review_text, featured, created_at, updated_at

---

## 6. Calendar Integration 🔴

### API Endpoints Needed:
- `POST /api/calendar/connect` - Connect calendar (Calendly, Google Calendar)
- `GET /api/calendar/settings` - Get calendar settings
- `PUT /api/calendar/settings` - Update calendar settings

### Database Tables:
- `calendar_settings` table
  - id, user_id, provider (calendly/google), calendar_url, settings (JSON), created_at, updated_at

### Integrations:
- Calendly API
- Google Calendar API

---

## 7. Analytics & Tracking 🔴

### API Endpoints Needed:
- `GET /api/analytics/overview` - Dashboard overview stats
- `GET /api/analytics/links` - Link click analytics
- `GET /api/analytics/properties` - Property view analytics
- `GET /api/analytics/leads` - Lead conversion analytics
- `POST /api/analytics/track` - Track page view/click

### Database Tables:
- `analytics_events` table
  - id, user_id, event_type, event_data (JSON), ip_address, user_agent, created_at

---

## 8. Themes & Branding 🔴

### API Endpoints Needed:
- `GET /api/themes` - Get available themes
- `PUT /api/user/theme` - Update user theme
- `PUT /api/user/branding` - Update custom branding
- `POST /api/user/logo` - Upload logo

### Database Tables:
- `themes` table (predefined themes)
  - id, name, colors (JSON), fonts (JSON), preview_image
- User theme settings stored in `users` table or separate `user_settings` table

---

## 9. QR Code Generation 🔴

### API Endpoints Needed:
- `GET /api/qr-code` - Generate QR code for user profile

### Implementation:
- Server-side QR code generation
- Return as image or SVG

---

## 10. File Storage 🔴

### Storage Needs:
- User avatars
- Property images (multiple per property)
- Testimonial client photos
- Custom logos

### Implementation:
- Laravel filesystem (local/S3)
- Image optimization/resizing
- CDN for performance

---

## 11. Compliance & Legal 🔴

### API Endpoints Needed:
- `GET /api/compliance/templates` - Get disclosure templates
- `PUT /api/user/compliance` - Update compliance settings

### Database Tables:
- `compliance_settings` table
  - id, user_id, license_number, broker_info, disclosures (JSON), created_at, updated_at

---

## 12. Subscription & Billing 🔴

### API Endpoints Needed:
- `GET /api/plans` - Get subscription plans
- `POST /api/subscribe` - Subscribe to plan
- `PUT /api/subscription` - Update subscription
- `DELETE /api/subscription` - Cancel subscription

### Database Tables:
- `subscription_plans` table
- `subscriptions` table
  - id, user_id, plan_id, status, stripe_id, started_at, ends_at

### Integrations:
- Stripe API

---

## Notes
- Will update this document as we build frontend features
- Each section will be marked complete when backend is implemented
- Priority order will be determined based on frontend development progress
