# 🗄️ Database Migration Instructions

## Overview
I've created 6 comprehensive SQL migration files that will set up your entire database schema for AgentBio.net. These migrations add all the missing tables and extend your existing profiles table.

---

## 📂 Migration Files Created

### 1. `20251031000001_create_listings_table.sql`
**Creates:** `listings` table for property showcase  
**Features:**
- All property fields (address, price, beds, baths, sqft, etc.)
- Status tracking (active, pending, under_contract, sold)
- Photos stored as JSONB array
- Featured listings support
- Full RLS policies (public can view, owners can manage)
- Automatic updated_at timestamp

### 2. `20251031000002_create_leads_table.sql`
**Creates:** `leads` table for inquiry capture  
**Features:**
- All lead types (buyer, seller, valuation, contact)
- Status tracking (new → contacted → qualified → closed/lost)
- UTM tracking for attribution
- Automatic email notification trigger (ready for Edge Function)
- Full RLS policies (public can submit, owners can view)

### 3. `20251031000003_create_testimonials_table.sql`
**Creates:** `testimonials` table for client reviews  
**Features:**
- 5-star rating system
- Client information with optional photo
- Transaction details
- Featured testimonials support
- Published/draft mode
- Full RLS policies

### 4. `20251031000004_create_subscriptions_table.sql`
**Creates:** `subscriptions` table for payment tracking  
**Features:**
- Stripe integration (customer_id, subscription_id)
- Plan limits (max listings, links, testimonials based on plan)
- Automatic free subscription on signup
- Helper function to check limits before adding content
- Billing period tracking

### 5. `20251031000005_extend_profiles_table.sql`
**Extends:** Existing `profiles` table  
**Adds:**
- Professional info (license, brokerage, years of experience)
- Specialties and certifications (JSONB arrays)
- Service areas (cities, zip codes)
- Contact info (phone, SMS, email)
- All social media links (Instagram, Facebook, LinkedIn, etc.)
- SEO fields (title, description, og_image)
- Settings (published, custom CSS, custom domain)
- Analytics counters (view_count, lead_count)
- Full-text search indexes for agent discovery

### 6. `20251031000006_create_storage_buckets.sql`
**Creates:** Storage buckets with RLS policies  
**Buckets:**
- `listing-photos` (10MB limit, images only)
- `brokerage-logos` (2MB limit, includes SVG support)
- Full RLS policies for upload/delete

---

## 🚀 How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended for First Time)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the content of each migration file **in order**:
   - First: `20251031000001_create_listings_table.sql`
   - Second: `20251031000002_create_leads_table.sql`
   - Third: `20251031000003_create_testimonials_table.sql`
   - Fourth: `20251031000004_create_subscriptions_table.sql`
   - Fifth: `20251031000005_extend_profiles_table.sql`
   - Sixth: `20251031000006_create_storage_buckets.sql`
5. Click **Run** for each migration
6. Verify success (should show "Success. No rows returned")

### Option 2: Supabase CLI (Recommended for Production)
```bash
# Make sure you're in your project directory
cd C:\Users\dpearson\Documents\LinkInBio\plain-page-link

# Login to Supabase (if not already)
supabase login

# Link to your project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all migrations
supabase db push

# Or apply them one by one
supabase migration up
```

### Option 3: Run via PowerShell Script
```powershell
# Create a script to run all migrations
$migrations = @(
    "supabase/migrations/20251031000001_create_listings_table.sql",
    "supabase/migrations/20251031000002_create_leads_table.sql",
    "supabase/migrations/20251031000003_create_testimonials_table.sql",
    "supabase/migrations/20251031000004_create_subscriptions_table.sql",
    "supabase/migrations/20251031000005_extend_profiles_table.sql",
    "supabase/migrations/20251031000006_create_storage_buckets.sql"
)

foreach ($migration in $migrations) {
    Write-Host "Applying $migration..."
    supabase db execute --file $migration
}
```

---

## ✅ Verification Checklist

After applying migrations, verify everything worked:

### Check Tables Created
```sql
-- Run this in Supabase SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('listings', 'leads', 'testimonials', 'subscriptions')
ORDER BY table_name;

-- Should return 4 rows
```

### Check Profiles Table Extended
```sql
-- Verify new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('title', 'license_number', 'instagram_url', 'seo_title')
ORDER BY column_name;

-- Should return 4 rows
```

### Check Storage Buckets
```sql
-- Verify buckets exist
SELECT id, name, public 
FROM storage.buckets 
WHERE id IN ('listing-photos', 'brokerage-logos', 'avatars')
ORDER BY id;

-- Should return 3 rows
```

### Check RLS Policies
```sql
-- Verify RLS is enabled and policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('listings', 'leads', 'testimonials', 'subscriptions')
ORDER BY tablename, policyname;

-- Should return multiple rows
```

---

## 🔧 Post-Migration Setup

### 1. Test Subscription Creation
After migration, sign up a new test user and verify:
```sql
-- Check if subscription was auto-created
SELECT * FROM subscriptions WHERE user_id = 'YOUR_TEST_USER_ID';
-- Should show a 'free' plan subscription
```

### 2. Test Data Insertion
Try inserting test data:
```sql
-- Test listing (replace user_id with your test user)
INSERT INTO listings (user_id, address, city, state, zip_code, price, bedrooms, bathrooms, status)
VALUES (
  'YOUR_TEST_USER_ID',
  '123 Main St',
  'San Diego',
  'CA',
  '92101',
  995000,
  3,
  2.5,
  'active'
);

-- Test lead (should work without authentication - public form)
INSERT INTO leads (user_id, name, email, lead_type, message)
VALUES (
  'YOUR_TEST_USER_ID',
  'John Doe',
  'john@example.com',
  'buyer',
  'Interested in viewing properties'
);

-- Test testimonial
INSERT INTO testimonials (user_id, client_name, rating, review_text, transaction_type)
VALUES (
  'YOUR_TEST_USER_ID',
  'Jane Smith',
  5,
  'Excellent service!',
  'buyer'
);
```

### 3. Test Storage Upload
Try uploading a test image to the new buckets:
```typescript
// In your app
const { data, error } = await supabase.storage
  .from('listing-photos')
  .upload(`${user.id}/test.jpg`, file);
```

---

## 🐛 Troubleshooting

### Error: "relation already exists"
**Solution:** Table was already created. Safe to ignore or drop table first:
```sql
DROP TABLE IF EXISTS listings CASCADE;
```

### Error: "column already exists"
**Solution:** Column was already added to profiles. Safe to ignore or check:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'title';
```

### Error: "permission denied"
**Solution:** Make sure you're running as the service role or as a user with proper permissions.

### Error: "function update_updated_at_column does not exist"
**Solution:** This function should have been created in your initial migrations. Create it:
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

---

## 📊 Database Schema Summary

After migrations, your database will have:

### Tables
- ✅ `profiles` (extended with 20+ new columns)
- ✅ `user_roles` (existing)
- ✅ `links` (existing)
- ✅ `listings` (NEW - 20+ columns)
- ✅ `leads` (NEW - 15+ columns)
- ✅ `testimonials` (NEW - 12+ columns)
- ✅ `subscriptions` (NEW - 18+ columns)

### Storage Buckets
- ✅ `avatars` (existing)
- ✅ `listing-photos` (NEW)
- ✅ `brokerage-logos` (NEW)

### Functions
- `handle_new_user()` - Creates profile on signup
- `check_username_available()` - Username validation
- `has_role()` - Role checking
- `increment_profile_views()` - Analytics counter
- `increment_profile_leads()` - Analytics counter
- `create_default_subscription()` - Auto-create free plan
- `check_subscription_limit()` - Enforce plan limits
- `notify_new_lead()` - Trigger for email notifications

### Triggers
- Auto-create profile on user signup
- Auto-create subscription on profile creation
- Auto-update `updated_at` on all tables
- Auto-notify on new lead (for email)
- Auto-increment lead counter on profile

---

## 🎯 Next Steps After Migration

1. **Update Frontend Types** - Regenerate TypeScript types from Supabase:
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
   ```

2. **Connect ProfilePage** - Update `src/pages/public/ProfilePage.tsx` to fetch real data

3. **Test Dashboard Pages** - Verify CRUD operations work in dashboard

4. **Set up Email Service** - Create Supabase Edge Function to send emails

5. **Integrate Stripe** - Set up payment webhook handler

---

## 📞 Need Help?

If you encounter issues:
1. Check the Supabase logs: Dashboard → Logs → Postgres Logs
2. Verify RLS policies aren't blocking your queries
3. Test with service_role key temporarily to rule out RLS issues
4. Check the Supabase Discord for community help

---

**✅ You're now ready to build against a complete database schema!**

All tables match the PRD requirements and are production-ready with proper:
- Row Level Security (RLS)
- Indexes for performance
- Triggers for automation
- Storage buckets with policies
- Helper functions

