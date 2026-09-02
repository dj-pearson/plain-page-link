# API Documentation - AgentBio.net

**Project:** AgentBio.net - Real Estate Link-in-Bio Platform  
**API Version:** 1.0  
**Base URL:** `https://api.agentbio.net/v1` (Production) / `http://localhost:8000/api/v1` (Development)  
**Last Updated:** October 30, 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Profiles](#profiles)
3. [Listings](#listings)
4. [Leads](#leads)
5. [Testimonials](#testimonials)
6. [Links](#links)
7. [Themes](#themes)
8. [Analytics](#analytics)
9. [Media Upload](#media-upload)
10. [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer {access_token}
```

### Register

**POST** `/auth/register`

Creates a new user account.

**Request Body:**

```json
{
    "email": "agent@example.com",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!",
    "display_name": "John Smith",
    "license_number": "CA-DRE-123456",
    "license_state": "CA"
}
```

**Response:** `201 Created`

```json
{
    "user": {
        "id": 1,
        "email": "agent@example.com",
        "role": "agent",
        "created_at": "2025-10-30T12:00:00Z"
    },
    "access_token": "eyJ0eXAiOiJKV1...",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

---

### Login

**POST** `/auth/login`

Authenticates user and returns access token.

**Request Body:**

```json
{
    "email": "agent@example.com",
    "password": "SecurePass123!"
}
```

**Response:** `200 OK`

```json
{
    "user": {
        "id": 1,
        "email": "agent@example.com",
        "role": "agent"
    },
    "access_token": "eyJ0eXAiOiJKV1...",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

**Errors:**

-   `401 Unauthorized` - Invalid credentials

---

### Logout

**POST** `/auth/logout`

Invalidates the current access token.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
    "message": "Successfully logged out"
}
```

---

### Refresh Token

**POST** `/auth/refresh`

Refreshes the access token.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
    "access_token": "eyJ0eXAiOiJKV1...",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

---

### Get Current User

**GET** `/auth/me`

Returns the currently authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
    "id": 1,
    "email": "agent@example.com",
    "role": "agent",
    "email_verified_at": "2025-10-30T12:00:00Z",
    "created_at": "2025-10-30T12:00:00Z",
    "profile": {
        "id": 1,
        "slug": "john-smith-realtor",
        "display_name": "John Smith",
        "is_published": true
    }
}
```

---

## Profiles

### Get Public Profile (No Auth Required)

**GET** `/profiles/{slug}`

Retrieves a public profile by slug. Increments view count.

**Parameters:**

-   `slug` (path) - Profile slug (e.g., "john-smith-realtor")

**Response:** `200 OK`

```json
{
    "id": 1,
    "slug": "john-smith-realtor",
    "display_name": "John Smith",
    "title": "Realtor® | Luxury Home Specialist",
    "bio": "With over 10 years of experience...",
    "profile_photo": "https://cdn.agentbio.net/photos/abc123.jpg",
    "license_number": "CA-DRE-123456",
    "license_state": "CA",
    "brokerage_name": "Luxury Homes Realty",
    "years_experience": 10,
    "specialties": ["Luxury Homes", "Waterfront"],
    "certifications": ["SRES", "GRI"],
    "service_cities": ["San Diego", "La Jolla"],
    "phone": "(619) 555-1234",
    "sms_enabled": true,
    "email_display": "john@example.com",
    "instagram_url": "https://instagram.com/johnsmith",
    "theme_id": "modern-clean",
    "is_published": true,
    "view_count": 1234
}
```

**Errors:**

-   `404 Not Found` - Profile not found or not published

---

### Get Own Profile

**GET** `/profile`

Returns the authenticated user's profile.

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` (Same structure as public profile, plus private fields)

---

### Create Profile

**POST** `/profile`

Creates a profile for the authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "slug": "john-smith-realtor",
    "display_name": "John Smith",
    "title": "Realtor® | Luxury Home Specialist",
    "bio": "With over 10 years...",
    "license_number": "CA-DRE-123456",
    "license_state": "CA",
    "brokerage_name": "Luxury Homes Realty",
    "phone": "(619) 555-1234",
    "email_display": "john@example.com"
}
```

**Response:** `201 Created`

---

### Update Profile

**PUT** `/profile`

Updates the authenticated user's profile.

**Headers:** `Authorization: Bearer {token}`

**Request Body:** (All fields optional, only send what's changing)

```json
{
    "display_name": "John M. Smith",
    "bio": "Updated bio...",
    "specialties": ["Luxury Homes", "Waterfront", "Investment"],
    "theme_id": "luxury-dark"
}
```

**Response:** `200 OK`

---

### Publish/Unpublish Profile

**PATCH** `/profile/publish`

Toggles profile published status.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "is_published": true
}
```

**Response:** `200 OK`

---

## Listings

### Get Profile Listings (Public)

**GET** `/profiles/{slug}/listings`

Returns all active listings for a public profile.

**Parameters:**

-   `slug` (path) - Profile slug
-   `status` (query, optional) - Filter by status: `active`, `pending`, `sold`
-   `limit` (query, optional) - Max results (default: 50)

**Response:** `200 OK`

```json
{
    "data": [
        {
            "id": 1,
            "address_full": "1234 Ocean View Drive, La Jolla, CA 92037",
            "price": 4500000,
            "bedrooms": 5,
            "bathrooms": 4.5,
            "square_feet": 4200,
            "property_type": "single_family",
            "title": "Stunning Ocean View Estate",
            "description": "Breathtaking ocean views...",
            "status": "active",
            "days_on_market": 29,
            "primary_photo": "https://cdn.agentbio.net/listings/photo1.jpg",
            "photos": ["url1.jpg", "url2.jpg"],
            "is_featured": true,
            "open_house_date": "2025-11-02T14:00:00Z"
        }
    ],
    "meta": {
        "total": 15,
        "count": 15
    }
}
```

---

### Get Own Listings

**GET** `/listings`

Returns all listings for the authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

-   `status` (optional) - Filter: `active`, `pending`, `sold`
-   `page` (optional) - Page number (default: 1)
-   `per_page` (optional) - Results per page (default: 20)

**Response:** `200 OK` (Paginated)

---

### Get Listing by ID

**GET** `/listings/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

### Create Listing

**POST** `/listings`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "address_street": "1234 Ocean View Drive",
    "address_city": "La Jolla",
    "address_state": "CA",
    "address_zip": "92037",
    "price": 4500000,
    "bedrooms": 5,
    "bathrooms": 4.5,
    "square_feet": 4200,
    "property_type": "single_family",
    "year_built": 2018,
    "title": "Stunning Ocean View Estate",
    "description": "Breathtaking ocean views...",
    "highlights": ["Ocean views", "Infinity pool"],
    "status": "active",
    "is_featured": false
}
```

**Response:** `201 Created`

**Errors:**

-   `422 Unprocessable Entity` - Validation errors

---

### Update Listing

**PUT** `/listings/{id}`

**Headers:** `Authorization: Bearer {token}`

**Request Body:** (Partial update supported)

**Response:** `200 OK`

---

### Delete Listing

**DELETE** `/listings/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

### Upload Listing Photos

**POST** `/listings/{id}/photos`

**Headers:**

-   `Authorization: Bearer {token}`
-   `Content-Type: multipart/form-data`

**Request Body:**

```
photos[]: File (multiple files allowed)
```

**Response:** `200 OK`

```json
{
    "photos": [
        {
            "id": 1,
            "url": "https://cdn.agentbio.net/listings/photo1.jpg",
            "is_primary": true,
            "sort_order": 0
        }
    ]
}
```

---

### Reorder Listing Photos

**PUT** `/listings/{id}/photos/reorder`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "photo_ids": [3, 1, 2, 5, 4]
}
```

**Response:** `200 OK`

---

## Leads

### Submit Lead (Public)

**POST** `/profiles/{slug}/leads`

Submits a lead form from a public profile.

**Parameters:**

-   `slug` (path) - Profile slug

**Request Body:**

```json
{
    "lead_type": "buyer",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "(555) 123-4567",
    "message": "Looking for a 3BR home...",
    "form_data": {
        "property_type": "single-family",
        "price_range": "500k-750k",
        "bedrooms": "3",
        "timeline": "1-3-months",
        "pre_approved": "yes"
    }
}
```

**Response:** `201 Created`

```json
{
    "id": 123,
    "message": "Thank you! We'll be in touch soon."
}
```

**Errors:**

-   `422 Unprocessable Entity` - Validation errors
-   `429 Too Many Requests` - Rate limited (max 5 per hour per IP)

---

### Get All Leads

**GET** `/leads`

Returns all leads for the authenticated user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

-   `lead_type` (optional) - Filter: `buyer`, `seller`, `valuation`, `contact`
-   `status` (optional) - Filter: `new`, `contacted`, `qualified`, `converted`, `lost`
-   `page` (optional) - Page number
-   `per_page` (optional) - Results per page (default: 20)
-   `sort` (optional) - Sort field: `created_at`, `name`
-   `order` (optional) - Sort order: `asc`, `desc`

**Response:** `200 OK` (Paginated)

```json
{
  "data": [
    {
      "id": 123,
      "lead_type": "buyer",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "phone": "(555) 123-4567",
      "message": "Looking for a 3BR home...",
      "status": "new",
      "source": "profile_page",
      "form_data": {...},
      "created_at": "2025-10-30T12:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 145,
    "per_page": 20,
    "last_page": 8
  }
}
```

---

### Get Lead by ID

**GET** `/leads/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

### Update Lead Status

**PATCH** `/leads/{id}/status`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "status": "contacted",
    "notes": "Called and left voicemail"
}
```

**Response:** `200 OK`

---

### Add Lead Note

**POST** `/leads/{id}/notes`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "note": "Client is pre-approved for $800k"
}
```

**Response:** `201 Created`

---

### Delete Lead

**DELETE** `/leads/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

## Testimonials

### Get Profile Testimonials (Public)

**GET** `/profiles/{slug}/testimonials`

Returns published testimonials for a profile.

**Response:** `200 OK`

```json
{
    "data": [
        {
            "id": 1,
            "client_name": "Michael & Jennifer Chen",
            "client_photo": "https://cdn.agentbio.net/testimonials/photo1.jpg",
            "client_title": "First-Time Homebuyers",
            "rating": 5,
            "review_text": "Sarah made our first home buying...",
            "property_type": "Single Family Home",
            "transaction_type": "buyer",
            "date": "2025-09-15",
            "is_featured": true
        }
    ]
}
```

---

### Get Own Testimonials

**GET** `/testimonials`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK` (Same structure as public, but includes unpublished)

---

### Create Testimonial

**POST** `/testimonials`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "client_name": "Michael Chen",
    "client_title": "First-Time Homebuyer",
    "rating": 5,
    "review_text": "Excellent service!",
    "property_type": "Single Family Home",
    "transaction_type": "buyer",
    "date": "2025-09-15",
    "is_featured": false
}
```

**Response:** `201 Created`

---

### Update Testimonial

**PUT** `/testimonials/{id}`

**Headers:** `Authorization: Bearer {token}`

**Request Body:** (Partial updates supported)

**Response:** `200 OK`

---

### Delete Testimonial

**DELETE** `/testimonials/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

## Links

### Get Profile Links (Public)

**GET** `/profiles/{slug}/links`

Returns all custom links for a profile (e.g., mortgage calculator, buyer guide PDFs).

**Response:** `200 OK`

```json
{
    "data": [
        {
            "id": 1,
            "title": "Download Buyer's Guide",
            "url": "https://cdn.agentbio.net/resources/buyers-guide.pdf",
            "icon": "file-text",
            "button_style": "primary",
            "is_visible": true,
            "click_count": 45,
            "sort_order": 0
        }
    ]
}
```

---

### Get Own Links

**GET** `/links`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

### Create Link

**POST** `/links`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "title": "Schedule a Consultation",
    "url": "https://calendly.com/john-smith",
    "icon": "calendar",
    "button_style": "primary",
    "is_visible": true
}
```

**Response:** `201 Created`

---

### Update Link

**PUT** `/links/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

---

### Delete Link

**DELETE** `/links/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

### Reorder Links

**PUT** `/links/reorder`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "link_ids": [3, 1, 5, 2, 4]
}
```

**Response:** `200 OK`

---

### Track Link Click (Public)

**POST** `/links/{id}/click`

Increments click counter for analytics.

**Response:** `200 OK`

---

## Themes

### Get Available Themes

**GET** `/themes`

Returns all available theme presets.

**Response:** `200 OK`

```json
{
    "data": [
        {
            "id": "modern-clean",
            "name": "Modern Clean",
            "description": "Minimalist design with clean lines",
            "preview_image": "https://cdn.agentbio.net/themes/modern-clean.jpg",
            "is_premium": false
        },
        {
            "id": "luxury-dark",
            "name": "Luxury Dark",
            "description": "Elegant dark theme for high-end agents",
            "preview_image": "https://cdn.agentbio.net/themes/luxury-dark.jpg",
            "is_premium": true
        }
    ]
}
```

---

### Get Theme by ID

**GET** `/themes/{id}`

Returns theme configuration including colors, fonts, and layout options.

**Response:** `200 OK`

```json
{
    "id": "modern-clean",
    "name": "Modern Clean",
    "config": {
        "colors": {
            "primary": "#3B82F6",
            "secondary": "#10B981",
            "accent": "#F59E0B",
            "background": "#FFFFFF",
            "text": "#1F2937"
        },
        "fonts": {
            "heading": "Inter",
            "body": "Inter"
        },
        "layout": {
            "header_style": "centered",
            "card_style": "rounded",
            "spacing": "comfortable"
        }
    }
}
```

---

### Apply Theme

**PATCH** `/profile/theme`

Applies a theme to the user's profile.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**

```json
{
    "theme_id": "luxury-dark",
    "custom_colors": {
        "primary": "#8B5CF6"
    }
}
```

**Response:** `200 OK`

---

## Analytics

### Get Profile Analytics

**GET** `/analytics/profile`

Returns analytics for the authenticated user's profile.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**

-   `start_date` (optional) - ISO date (default: 30 days ago)
-   `end_date` (optional) - ISO date (default: today)
-   `granularity` (optional) - `day`, `week`, `month` (default: `day`)

**Response:** `200 OK`

```json
{
    "period": {
        "start_date": "2025-10-01",
        "end_date": "2025-10-30"
    },
    "overview": {
        "total_views": 1234,
        "unique_visitors": 876,
        "total_leads": 45,
        "conversion_rate": 3.65,
        "avg_time_on_page": 125
    },
    "views_over_time": [
        { "date": "2025-10-01", "views": 42, "unique": 35 },
        { "date": "2025-10-02", "views": 38, "unique": 31 }
    ],
    "leads_by_type": {
        "buyer": 20,
        "seller": 15,
        "valuation": 8,
        "contact": 2
    },
    "top_listings": [
        { "listing_id": 1, "title": "Ocean View Estate", "views": 234 }
    ],
    "traffic_sources": {
        "direct": 45,
        "social": 30,
        "search": 15,
        "referral": 10
    }
}
```

---

### Get Listing Analytics

**GET** `/analytics/listings/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`

```json
{
    "listing_id": 1,
    "total_views": 234,
    "unique_visitors": 189,
    "inquiries": 12,
    "photo_views": {
        "photo_1": 234,
        "photo_2": 198
    }
}
```

---

### Track Analytics Event (Public)

**POST** `/analytics/track`

Tracks custom events from public profiles.

**Request Body:**

```json
{
    "event_type": "button_click",
    "profile_slug": "john-smith-realtor",
    "metadata": {
        "button_id": "contact_phone"
    }
}
```

**Response:** `200 OK`

---

## Media Upload

### Upload Profile Photo

**POST** `/media/profile-photo`

**Headers:**

-   `Authorization: Bearer {token}`
-   `Content-Type: multipart/form-data`

**Request Body:**

```
photo: File (max 5MB, jpg/png)
```

**Response:** `200 OK`

```json
{
    "url": "https://cdn.agentbio.net/photos/abc123.jpg",
    "thumbnail_url": "https://cdn.agentbio.net/photos/abc123_thumb.jpg"
}
```

---

### Upload Brokerage Logo

**POST** `/media/brokerage-logo`

**Headers:**

-   `Authorization: Bearer {token}`
-   `Content-Type: multipart/form-data`

**Request Body:**

```
logo: File (max 2MB, jpg/png/svg)
```

**Response:** `200 OK`

---

### Delete Media

**DELETE** `/media/{id}`

**Headers:** `Authorization: Bearer {token}`

**Response:** `204 No Content`

---

## Error Handling

### Standard Error Response Format

```json
{
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "The given data was invalid.",
        "errors": {
            "email": ["The email field is required."],
            "price": ["The price must be a number."]
        }
    }
}
```

### HTTP Status Codes

-   `200 OK` - Success
-   `201 Created` - Resource created successfully
-   `204 No Content` - Success with no response body
-   `400 Bad Request` - Invalid request format
-   `401 Unauthorized` - Missing or invalid authentication
-   `403 Forbidden` - Authenticated but not authorized
-   `404 Not Found` - Resource not found
-   `422 Unprocessable Entity` - Validation failed
-   `429 Too Many Requests` - Rate limit exceeded
-   `500 Internal Server Error` - Server error

### Common Error Codes

| Code                    | Description                      |
| ----------------------- | -------------------------------- |
| `AUTHENTICATION_FAILED` | Invalid credentials              |
| `TOKEN_EXPIRED`         | Access token has expired         |
| `VALIDATION_ERROR`      | Request validation failed        |
| `NOT_FOUND`             | Resource not found               |
| `UNAUTHORIZED`          | Not authorized for this action   |
| `RATE_LIMIT_EXCEEDED`   | Too many requests                |
| `SLUG_TAKEN`            | Profile slug already in use      |
| `PROFILE_NOT_PUBLISHED` | Profile is not published         |
| `FILE_TOO_LARGE`        | Uploaded file exceeds size limit |
| `INVALID_FILE_TYPE`     | Unsupported file format          |

---

## Rate Limiting

**General API Calls:**

-   Authenticated: 1000 requests per hour per user
-   Public: 100 requests per hour per IP

**Lead Submissions:**

-   5 submissions per hour per IP address
-   20 submissions per day per IP address

**Analytics Tracking:**

-   1000 events per hour per profile

Rate limit headers included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1635724800
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**

-   `page` - Page number (default: 1)
-   `per_page` - Results per page (default: 20, max: 100)

**Response Meta:**

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "from": 1,
    "to": 20,
    "total": 145,
    "per_page": 20,
    "last_page": 8
  },
  "links": {
    "first": "https://api.agentbio.net/v1/listings?page=1",
    "last": "https://api.agentbio.net/v1/listings?page=8",
    "prev": null,
    "next": "https://api.agentbio.net/v1/listings?page=2"
  }
}
```

---

## Webhooks (Future Feature)

Agents can configure webhooks to receive notifications:

-   `lead.created` - New lead submitted
-   `profile.viewed` - Profile viewed (throttled)
-   `listing.inquired` - Inquiry on listing

Webhook payload example:

```json
{
    "event": "lead.created",
    "timestamp": "2025-10-30T12:00:00Z",
    "data": {
        "lead_id": 123,
        "lead_type": "buyer",
        "name": "Jane Doe"
    }
}
```

---

## Implementation Notes for Backend

### Authentication

-   Use Laravel Sanctum for SPA authentication
-   Token expiration: 60 minutes
-   Refresh token support required

### Database

-   All timestamps in UTC
-   Soft deletes for profiles, listings, leads
-   Full-text search on listings (title, description, address)

### File Storage

-   Use Laravel Storage with S3 driver
-   Image optimization on upload (compress, resize, create thumbnails)
-   CDN integration (CloudFront)

### Security

-   CORS: Allow frontend domain
-   Rate limiting via middleware
-   Input sanitization
-   SQL injection protection (use Eloquent ORM)
-   XSS protection

### Performance

-   Cache public profiles (5 minutes TTL)
-   Cache theme configurations (1 hour TTL)
-   Database indexing on frequently queried fields
-   Eager loading to prevent N+1 queries

### Email Notifications

-   New lead notification to agent
-   Lead confirmation to client
-   Weekly analytics digest

---

**End of API Documentation**

For questions or updates, contact the development team.
