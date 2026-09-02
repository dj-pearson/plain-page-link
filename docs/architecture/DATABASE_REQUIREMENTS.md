# Database Requirements - AgentBio.net

**Project:** AgentBio.net - Real Estate Link-in-Bio Platform  
**Based on:** LinkStack Foundation + React/TypeScript Frontend  
**Last Updated:** October 30, 2025

---

## Overview

This document tracks all database schema requirements as we build the frontend. Each table will be implemented in the Laravel backend with migrations.

---

## Core Database Tables

### 1. Users Table

**Purpose:** Authentication and account management

```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('agent', 'team_lead', 'brokerage_admin') DEFAULT 'agent',
    email_verified_at TIMESTAMP NULL,
    remember_token VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,

    INDEX idx_email (email),
    INDEX idx_role (role)
);
```

**Fields Needed:**

-   Basic auth (email, password)
-   Role-based access control
-   Email verification
-   Social login support (future: google_id, facebook_id)

---

### 2. Profiles Table

**Purpose:** Agent/team public profile information

```sql
CREATE TABLE profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED UNIQUE NOT NULL,

    -- Identity
    slug VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    title VARCHAR(255), -- e.g., "Realtor®", "Real Estate Agent"
    bio TEXT, -- Max 500 characters
    profile_photo VARCHAR(255),

    -- Professional Info
    license_number VARCHAR(100) NOT NULL,
    license_state VARCHAR(2) NOT NULL,
    brokerage_name VARCHAR(255),
    brokerage_logo VARCHAR(255),
    years_experience INT,
    specialties JSON, -- Array of specialties
    certifications JSON, -- Array of certifications

    -- Service Areas
    service_cities JSON, -- Array of cities
    service_zip_codes JSON, -- Array of zip codes

    -- Contact
    phone VARCHAR(20),
    sms_enabled BOOLEAN DEFAULT false,
    email_display VARCHAR(255),

    -- Social Links
    instagram_url VARCHAR(255),
    facebook_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    tiktok_url VARCHAR(255),
    youtube_url VARCHAR(255),
    zillow_url VARCHAR(255),
    realtor_com_url VARCHAR(255),
    website_url VARCHAR(255),

    -- Settings
    is_published BOOLEAN DEFAULT false,
    theme_id VARCHAR(50) DEFAULT 'modern-clean',
    custom_css TEXT,
    seo_title VARCHAR(255),
    seo_description TEXT,

    -- Analytics
    view_count INT DEFAULT 0,
    lead_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_user_id (user_id),
    INDEX idx_published (is_published)
);
```

**Frontend Components Using This:**

-   ProfileHeader.tsx
-   AgentBio.tsx
-   ContactButtons.tsx
-   SocialLinks.tsx
-   ProfileSettings.tsx

---

### 3. Listings Table

**Purpose:** Property listings (active, pending, sold)

```sql
CREATE TABLE listings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,

    -- Property Details
    address_street VARCHAR(255) NOT NULL,
    address_city VARCHAR(100) NOT NULL,
    address_state VARCHAR(2) NOT NULL,
    address_zip VARCHAR(10) NOT NULL,
    address_full TEXT, -- Full formatted address

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Property Info
    price DECIMAL(12, 2) NOT NULL,
    original_price DECIMAL(12, 2), -- For sold properties
    bedrooms DECIMAL(3, 1), -- Allow 2.5 bedrooms
    bathrooms DECIMAL(3, 1),
    square_feet INT,
    lot_size_acres DECIMAL(8, 2),
    property_type ENUM('single_family', 'condo', 'townhouse', 'multi_family', 'land', 'commercial') NOT NULL,
    year_built INT,

    -- Description
    title VARCHAR(255), -- Custom title or auto-generated
    description TEXT, -- Max 1000 characters
    highlights JSON, -- Array of key features

    -- Status
    status ENUM('active', 'pending', 'under_contract', 'sold', 'draft') DEFAULT 'draft',
    listed_date DATE,
    sold_date DATE,
    days_on_market INT,

    -- MLS Info
    mls_number VARCHAR(50),
    mls_source VARCHAR(100),

    -- Media
    primary_photo VARCHAR(255),
    photos JSON, -- Array of photo URLs
    virtual_tour_url VARCHAR(255),
    video_url VARCHAR(255),

    -- Open House
    open_house_date DATETIME,
    open_house_end_date DATETIME,

    -- Sorting & Display
    sort_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_featured (is_featured),
    INDEX idx_sort (sort_order)
);
```

**Frontend Components Using This:**

-   ListingGallery.tsx
-   ListingCard.tsx
-   ListingDetailModal.tsx
-   SoldPropertiesGallery.tsx
-   ListingManager.tsx (admin)

---

### 4. Testimonials Table

**Purpose:** Client reviews and social proof

```sql
CREATE TABLE testimonials (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,
    listing_id BIGINT UNSIGNED NULL, -- Link to specific property

    -- Client Info
    client_name VARCHAR(255) NOT NULL,
    client_photo VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT false,

    -- Testimonial
    rating INT NOT NULL, -- 1-5 stars
    testimonial_text TEXT NOT NULL, -- Max 500 characters
    service_type ENUM('buyer', 'seller', 'both') NOT NULL,
    property_type VARCHAR(100),
    transaction_date DATE,

    -- Media
    video_url VARCHAR(255),

    -- Display
    is_featured BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
    INDEX idx_profile_id (profile_id),
    INDEX idx_rating (rating),
    INDEX idx_featured (is_featured)
);
```

**Frontend Components Using This:**

-   TestimonialCarousel.tsx
-   TestimonialCard.tsx
-   TestimonialManager.tsx (admin)

---

### 5. Leads Table

**Purpose:** Capture buyer/seller inquiries

```sql
CREATE TABLE leads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,
    listing_id BIGINT UNSIGNED NULL, -- If inquiry about specific property

    -- Lead Type
    form_type ENUM('buyer_inquiry', 'seller_inquiry', 'home_valuation', 'general_contact', 'showing_request') NOT NULL,

    -- Contact Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    preferred_contact_method ENUM('email', 'phone', 'sms', 'video') DEFAULT 'email',

    -- Lead Details (JSON for flexibility)
    lead_data JSON, -- Custom fields based on form_type
    /*
    For buyer_inquiry: {
        price_range_min, price_range_max,
        bedrooms_min, timeline,
        preapproval_status, message
    }
    For seller_inquiry: {
        property_address, desired_timeline,
        estimated_value, reason_for_selling, message
    }
    For home_valuation: {
        property_address, property_type,
        bedrooms, bathrooms, square_feet, best_time_to_discuss
    }
    */

    -- Lead Management
    status ENUM('new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed', 'spam') DEFAULT 'new',
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    notes TEXT,

    -- Source Tracking
    source VARCHAR(100), -- 'instagram', 'facebook', 'direct', 'qr_code'
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer_url TEXT,

    -- Follow-up
    contacted_at TIMESTAMP NULL,
    next_follow_up TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
    INDEX idx_profile_id (profile_id),
    INDEX idx_status (status),
    INDEX idx_form_type (form_type),
    INDEX idx_created_at (created_at)
);
```

**Frontend Components Using This:**

-   BuyerInquiryForm.tsx
-   SellerInquiryForm.tsx
-   HomeValuationForm.tsx
-   ContactForm.tsx
-   LeadDashboard.tsx (admin)

---

### 6. Links Table

**Purpose:** Custom links and CTAs

```sql
CREATE TABLE links (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,

    -- Link Details
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description VARCHAR(500),

    -- Display
    icon VARCHAR(100), -- Icon name or custom icon URL
    button_style ENUM('filled', 'outlined', 'text') DEFAULT 'filled',
    custom_color VARCHAR(7), -- Hex color

    -- Scheduling
    is_active BOOLEAN DEFAULT true,
    start_date DATETIME NULL,
    end_date DATETIME NULL,

    -- Sorting
    sort_order INT DEFAULT 0,

    -- Analytics
    click_count INT DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_sort (sort_order),
    INDEX idx_active (is_active)
);
```

**Frontend Components Using This:**

-   CustomLinksList.tsx
-   LinkButton.tsx
-   LinkManager.tsx (admin)

---

### 7. Theme_Settings Table

**Purpose:** Store custom theme configurations per profile

```sql
CREATE TABLE theme_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED UNIQUE NOT NULL,

    -- Theme Selection
    theme_id VARCHAR(50) NOT NULL, -- 'luxury', 'modern-clean', 'classic', 'coastal', 'urban', 'farmhouse'

    -- Colors
    primary_color VARCHAR(7) DEFAULT '#2563eb', -- Hex
    secondary_color VARCHAR(7) DEFAULT '#10b981',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#1f2937',
    accent_color VARCHAR(7) DEFAULT '#f59e0b',

    -- Typography
    heading_font VARCHAR(100) DEFAULT 'Inter',
    body_font VARCHAR(100) DEFAULT 'Inter',
    font_size_scale DECIMAL(3, 2) DEFAULT 1.00, -- 0.8 - 1.5

    -- Layout
    header_style ENUM('centered', 'left', 'banner') DEFAULT 'centered',
    button_shape ENUM('rounded', 'square', 'pill') DEFAULT 'rounded',
    card_style ENUM('shadow', 'border', 'flat') DEFAULT 'shadow',
    spacing_density ENUM('compact', 'comfortable', 'spacious') DEFAULT 'comfortable',

    -- Advanced
    custom_css TEXT,
    show_branding BOOLEAN DEFAULT true, -- "Powered by AgentBio.net"

    -- Banner/Hero
    hero_image VARCHAR(255),
    hero_overlay_opacity DECIMAL(3, 2) DEFAULT 0.5,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id)
);
```

**Frontend Components Using This:**

-   ThemeCustomizer.tsx
-   ThemePreview.tsx
-   ColorPicker.tsx
-   FontSelector.tsx

---

### 8. Analytics_Events Table

**Purpose:** Track user interactions and page views

```sql
CREATE TABLE analytics_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    profile_id BIGINT UNSIGNED NOT NULL,

    -- Event Details
    event_type ENUM('page_view', 'link_click', 'listing_view', 'form_submit', 'phone_click', 'email_click', 'booking_click') NOT NULL,
    event_data JSON, -- Additional event-specific data

    -- Visitor Info (anonymized)
    visitor_id VARCHAR(255), -- Hashed fingerprint
    session_id VARCHAR(255),

    -- Source Tracking
    referrer_url TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),

    -- Device Info
    device_type ENUM('mobile', 'tablet', 'desktop') NOT NULL,
    browser VARCHAR(100),
    os VARCHAR(100),

    -- Location (city-level only for privacy)
    country VARCHAR(2),
    state VARCHAR(100),
    city VARCHAR(100),

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    INDEX idx_profile_id (profile_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at),
    INDEX idx_session (session_id)
);
```

**Frontend Components Using This:**

-   AnalyticsDashboard.tsx
-   TrafficChart.tsx
-   ConversionFunnel.tsx
-   LinkClickAnalytics.tsx

---

### 9. Teams Table

**Purpose:** Team/brokerage management

```sql
CREATE TABLE teams (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Team Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo VARCHAR(255),

    -- Branding
    primary_color VARCHAR(7),
    custom_domain VARCHAR(255),

    -- Settings
    is_active BOOLEAN DEFAULT true,
    max_agents INT DEFAULT 5,

    -- Subscription
    plan_tier ENUM('team', 'enterprise') DEFAULT 'team',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_slug (slug)
);
```

---

### 10. Team_Members Table

**Purpose:** Link users to teams with roles

```sql
CREATE TABLE team_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    team_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('member', 'lead', 'admin') DEFAULT 'member',

    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id)
);
```

---

## API Endpoints Needed

### Authentication

-   `POST /api/auth/register` - Register new user
-   `POST /api/auth/login` - Login
-   `POST /api/auth/logout` - Logout
-   `POST /api/auth/refresh` - Refresh token
-   `GET /api/auth/user` - Get current user

### Profiles

-   `GET /api/profile/:slug` - Get public profile (public)
-   `GET /api/profile` - Get own profile (auth)
-   `PUT /api/profile` - Update profile (auth)
-   `POST /api/profile/photo` - Upload profile photo (auth)
-   `PUT /api/profile/publish` - Publish/unpublish profile (auth)

### Listings

-   `GET /api/listings` - Get own listings (auth)
-   `GET /api/profile/:slug/listings` - Get public listings (public)
-   `POST /api/listings` - Create listing (auth)
-   `PUT /api/listings/:id` - Update listing (auth)
-   `DELETE /api/listings/:id` - Delete listing (auth)
-   `POST /api/listings/:id/photos` - Upload listing photos (auth)
-   `PUT /api/listings/reorder` - Reorder listings (auth)

### Testimonials

-   `GET /api/testimonials` - Get own testimonials (auth)
-   `GET /api/profile/:slug/testimonials` - Get public testimonials (public)
-   `POST /api/testimonials` - Create testimonial (auth)
-   `PUT /api/testimonials/:id` - Update testimonial (auth)
-   `DELETE /api/testimonials/:id` - Delete testimonial (auth)

### Leads

-   `POST /api/leads` - Submit lead form (public)
-   `GET /api/leads` - Get own leads (auth)
-   `PUT /api/leads/:id/status` - Update lead status (auth)
-   `GET /api/leads/stats` - Get lead statistics (auth)

### Links

-   `GET /api/links` - Get own links (auth)
-   `GET /api/profile/:slug/links` - Get public links (public)
-   `POST /api/links` - Create link (auth)
-   `PUT /api/links/:id` - Update link (auth)
-   `DELETE /api/links/:id` - Delete link (auth)
-   `PUT /api/links/reorder` - Reorder links (auth)
-   `POST /api/links/:id/track-click` - Track link click (public)

### Theme Settings

-   `GET /api/theme` - Get own theme settings (auth)
-   `PUT /api/theme` - Update theme settings (auth)
-   `GET /api/themes/presets` - Get available theme presets (public)

### Analytics

-   `GET /api/analytics/overview` - Get analytics overview (auth)
-   `GET /api/analytics/traffic` - Get traffic data (auth)
-   `GET /api/analytics/conversions` - Get conversion data (auth)
-   `POST /api/analytics/track` - Track event (public)

---

## Data Migration Notes

### From LinkStack to AgentBio.net

1. **Existing LinkStack tables to preserve:**
    - `users` - Map to new structure
    - `links` - Can be adapted for custom links
2. **Tables to deprecate:**
    - Most LinkStack-specific tables
3. **New real estate-specific tables:**
    - All listings, testimonials, leads tables are new

---

## Phase 1 Priority Tables (MVP)

For initial MVP, focus on:

1. ✅ Users
2. ✅ Profiles
3. ✅ Listings
4. ✅ Leads
5. ✅ Links
6. ✅ Theme_Settings
7. ✅ Analytics_Events (basic)

Phase 2 (after MVP):

-   Teams
-   Team_Members
-   Testimonials (enhanced)

---

## Notes & Decisions

### Image Storage Strategy

-   Use AWS S3 or Cloudflare R2 for image storage
-   Store only URLs in database, not binary data
-   Implement image optimization pipeline (WebP conversion, thumbnails)

### Analytics Privacy

-   No PII stored in analytics_events
-   IP addresses hashed, not stored
-   GDPR-compliant with anonymization

### Scalability Considerations

-   Indexes on frequently queried columns
-   JSON fields for flexible data structures
-   Consider read replicas for analytics queries at scale

---

**Next Updates:**

-   API endpoint specifications (request/response schemas)
-   Validation rules
-   Seeder data for development
