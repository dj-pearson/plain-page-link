# Backend API Endpoints - TODO

This document lists frontend API calls that currently don't have backend implementations. These need to be implemented using Supabase Edge Functions or similar serverless functions.

## Push Notifications

**Status:** ⚠️ Frontend ready, backend needed

### POST /api/v1/notifications/register
**File:** `src/lib/push-notifications.ts:121`

Registers a Firebase Cloud Messaging token for push notifications.

**Request Body:**
```json
{
  "token": "string (FCM token)",
  "userId": "string (user ID)",
  "device": {
    "userAgent": "string",
    "platform": "string",
    "language": "string",
    "timestamp": "number"
  }
}
```

**Implementation Notes:**
- Store FCM token in Supabase database linked to user
- Create a `push_tokens` table with columns: `id`, `user_id`, `token`, `device_info`, `created_at`, `updated_at`
- Handle token updates (same user, new device)

### DELETE /api/v1/notifications/unregister
**File:** `src/lib/push-notifications.ts:162`

Unregisters a push notification token.

**Request Body:**
```json
{
  "token": "string (FCM token to remove)"
}
```

**Implementation Notes:**
- Remove token from `push_tokens` table
- Or mark as inactive rather than deleting

---

## Contact Forms

**Status:** ⚠️ Frontend ready, backend needed

### POST /api/contact (Contact Form)
**File:** `src/components/forms/ContactForm.tsx`

Handles contact form submissions.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string (optional)",
  "message": "string",
  "listingId": "string (optional)"
}
```

**Implementation Options:**
1. **Supabase Edge Function** - Store in `leads` table and optionally send notification
2. **Email Service** - Send to agent's email via SendGrid/Resend
3. **Both** - Store in database AND send email

### POST /api/buyer-inquiry (Buyer Inquiry Form)
**File:** `src/components/forms/BuyerInquiryForm.tsx`

Handles buyer inquiry submissions.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "budget": "string",
  "location": "string",
  "bedrooms": "number",
  "moveInDate": "string",
  "additionalInfo": "string (optional)"
}
```

### POST /api/seller-inquiry (Seller Inquiry Form)
**File:** `src/components/forms/SellerInquiryForm.tsx`

Handles seller inquiry submissions.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "propertyType": "string",
  "yearsOwned": "number",
  "sellingReason": "string",
  "timeline": "string"
}
```

### POST /api/home-valuation (Home Valuation Form)
**File:** `src/components/forms/HomeValuationForm.tsx`

Handles home valuation requests.

**Request Body:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "address": "string",
  "bedrooms": "number",
  "bathrooms": "number",
  "sqft": "number (optional)",
  "yearBuilt": "number (optional)"
}
```

---

## Implementation Recommendations

### Supabase Edge Functions

Create edge functions for each endpoint:

```
supabase/functions/
├── register-push-token/
│   └── index.ts
├── unregister-push-token/
│   └── index.ts
├── submit-contact/
│   └── index.ts
├── submit-buyer-inquiry/
│   └── index.ts
├── submit-seller-inquiry/
│   └── index.ts
└── submit-home-valuation/
    └── index.ts
```

### Database Tables Needed

```sql
-- Push tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (may already exist)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  type TEXT NOT NULL, -- 'contact', 'buyer_inquiry', 'seller_inquiry', 'home_valuation'
  data JSONB, -- Store form-specific data
  source TEXT, -- 'website', 'listing_page', etc.
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'closed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
```

### Email Notifications

Consider using **Resend** or **SendGrid** for email notifications:
- Agent gets notified when new lead comes in
- Auto-response to lead confirming receipt
- Weekly lead summary

---

## Priority

**High Priority:**
1. Contact form submission (most commonly used)
2. Push notification registration (if using push notifications)

**Medium Priority:**
3. Buyer/Seller inquiry forms
4. Home valuation form

**Low Priority:**
5. Push notification unregistration (nice to have)

---

## Alternative: Direct Supabase Integration

Instead of API endpoints, forms can directly insert into Supabase:

```typescript
const { data, error } = await supabase
  .from('leads')
  .insert({
    agent_id: agentId,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    type: 'contact',
    data: formData,
    source: 'website'
  });
```

This would be simpler and wouldn't require edge functions for basic CRUD operations.
