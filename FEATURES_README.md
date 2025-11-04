# AgentBio.net Advanced Features - Quick Start Guide

## 🎉 What's Been Implemented

### ✅ Complete Foundation
- **Database Schema** (`database/schema/features-schema.sql`)
  - 30+ tables for all 10 features
  - Usage tracking and billing tables
  - Stripe integration tables
  - Database functions for limit checking

- **TypeScript Types** (`src/types/features.ts`)
  - Complete interfaces for all features
  - Request/response types
  - Stripe integration types

- **Pricing System** (`src/config/pricing-plans.ts`)
  - 5 pricing tiers (Free to Enterprise)
  - Usage-based pricing configuration
  - Helper functions for limits and billing

- **Usage Tracking** (`src/lib/usageTracking.ts`)
  - Automatic usage metering
  - Stripe billing integration
  - Monthly summaries
  - Overage calculation

- **React Hooks** (`src/hooks/useFeatureUsage.ts`)
  - `useFeatureAccess` - Check feature availability
  - `useTrackFeature` - Track usage with billing
  - `useUsageStats` - Get current usage
  - `useProjectedBill` - Calculate monthly bill
  - `useFeatureWithTracking` - Wrapper for features

### ✅ Complete Example Feature: Mortgage Calculator
- **Business Logic** (`src/lib/mortgageCalculator.ts`)
  - Monthly payment calculations
  - Affordability calculator
  - Amortization schedules
  - Refinance break-even analysis

- **UI Component** (`src/components/features/MortgageCalculator.tsx`)
  - Interactive sliders and inputs
  - Real-time calculations
  - Two calculator modes
  - Optional lead capture
  - Usage tracking integration

---

## 🚀 Next Steps

### 1. Deploy Database Schema (5 minutes)

```bash
# If using Supabase CLI
supabase db push

# Or execute SQL directly in Supabase dashboard
# Copy contents of database/schema/features-schema.sql
```

### 2. Add Mortgage Calculator to Your App (10 minutes)

```tsx
// In src/pages/dashboard/Listings.tsx or any page

import MortgageCalculator from '@/components/features/MortgageCalculator';

function ListingDetailPage({ listing }) {
  const { user } = useAuthStore();

  return (
    <div>
      {/* Your existing listing content */}

      <MortgageCalculator
        listingId={listing.id}
        defaultHomePrice={listing.price}
        showLeadCapture={true}
        agentId={user?.id}
      />
    </div>
  );
}
```

### 3. Test the Mortgage Calculator

1. Navigate to a listing page
2. See the calculator widget
3. Adjust sliders and see real-time calculations
4. Test lead capture form
5. Check `mortgage_calculations` table for tracked usage

---

## 📋 Implementing Additional Features

### Priority Order (Recommended)

1. ✅ **Mortgage Calculator** - DONE!
2. **AI Listing Description Generator** - High value, moderate complexity
3. **Smart Lead Scoring** - High value, moderate complexity
4. **Automated Follow-Up Sequences** - High value, higher complexity
5. **Interactive Market Reports** - High value, requires data APIs

### Implementation Template

For each feature, follow this pattern:

#### Step 1: Create Service/Logic Layer

```typescript
// src/lib/featureName.ts

export async function executeFeature(params: FeatureParams) {
  // Business logic here
  // Call external APIs if needed
  return result;
}
```

#### Step 2: Create React Component

```tsx
// src/components/features/FeatureName.tsx

import { useFeatureWithTracking } from '@/hooks/useFeatureUsage';
import { FEATURE_KEYS } from '@/config/pricing-plans';

export function FeatureName() {
  const { execute, isLoading, error } = useFeatureWithTracking(
    FEATURE_KEYS.FEATURE_NAME,
    async (params) => {
      // Your feature logic
      return await executeFeature(params);
    }
  );

  // UI implementation
}
```

#### Step 3: Add to Dashboard

```tsx
// Add to relevant dashboard page
import FeatureName from '@/components/features/FeatureName';

<FeatureName />
```

#### Step 4: Test Usage Tracking

- Verify limits work for each plan tier
- Test overage charging (if applicable)
- Check database records

---

## 🔑 Required API Keys

Before implementing AI features, set up these API keys:

### OpenAI (for AI features)
```bash
# .env.local
VITE_OPENAI_API_KEY=sk-...
```
Sign up: https://platform.openai.com/

### Stripe (for billing)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...  # Server-side only
```
Sign up: https://stripe.com/

### SendGrid (for email automation)
```bash
SENDGRID_API_KEY=SG...
```
Sign up: https://sendgrid.com/

### Twilio (for SMS automation)
```bash
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```
Sign up: https://www.twilio.com/

### Data APIs (for market reports)
- Zillow API: https://www.zillow.com/howto/api/APIOverview.htm
- Walk Score API: https://www.walkscore.com/professional/api.php
- Census API (FREE): https://www.census.gov/data/developers/data-sets.html

---

## 📊 Setting Up Stripe

### 1. Create Products in Stripe

For each pricing tier, create:
1. A product (e.g., "Professional Plan")
2. Two prices: monthly and yearly
3. Copy the price IDs

### 2. Update Price IDs

```typescript
// src/config/pricing-plans.ts

export const PRICING_PLANS: PricingTier[] = [
  {
    id: 'professional',
    // ...
    stripe_price_id_monthly: 'price_1ABC123...',  // ← Add your price IDs
    stripe_price_id_yearly: 'price_1XYZ456...',
  },
];
```

### 3. Create Metered Billing Items

For usage-based features:
1. Create usage-based price in Stripe
2. Attach to subscription as additional line item
3. Report usage via API

---

## 🧪 Testing Checklist

### Per Feature
- [ ] UI renders correctly
- [ ] Input validation works
- [ ] Results calculate correctly
- [ ] Usage is tracked in database
- [ ] Limits work for each plan tier
- [ ] Overage charges (if applicable)
- [ ] Error handling works
- [ ] Loading states display

### Billing Integration
- [ ] Free plan: Feature disabled/limited
- [ ] Paid plans: Feature accessible
- [ ] Usage limits enforced
- [ ] Overage charges calculated
- [ ] Monthly usage resets
- [ ] Invoices generated correctly

---

## 🎨 UI Component Library

All UI components are available in `src/components/ui/`:

- `<Card>` - Container for features
- `<Input>` - Form inputs
- `<Slider>` - Range inputs
- `<Tabs>` - Tab navigation
- `<Button>` - Action buttons
- `<Dialog>` - Modals
- `<Toast>` - Notifications

Example usage in `MortgageCalculator.tsx`

---

## 📖 Feature Implementation Guides

### Feature 1: AI Listing Description Generator

**Estimated Time:** 4-8 hours

**Requirements:**
- OpenAI API key
- Supabase Edge Function

**Steps:**
1. Create Edge Function (`generate-listing-description`)
2. Implement OpenAI prompt engineering
3. Build UI component with form
4. Add fair housing compliance check
5. Store generated content in database

**Reference:** See `features.md` lines 11-105 for spec

### Feature 2: Smart Lead Scoring

**Estimated Time:** 6-10 hours

**Requirements:**
- Lead behavior tracking
- Real-time updates

**Steps:**
1. Create scoring algorithm function
2. Add behavior tracking to profile pages
3. Build lead dashboard with priority sorting
4. Implement real-time notifications
5. Add conversion tracking

**Reference:** See `features.md` lines 107-343 for spec

### Feature 3: Automated Follow-Up Sequences

**Estimated Time:** 12-16 hours

**Requirements:**
- SendGrid API key
- Twilio API key (for SMS)
- Background job processor

**Steps:**
1. Create sequence builder UI
2. Implement email/SMS sending
3. Build scheduling system
4. Add pause on reply detection
5. Create pre-built templates

**Reference:** See `features.md` lines 345-677 for spec

---

## 🐛 Troubleshooting

### "Feature limit reached" but I haven't used it

**Solution:** Check that:
1. User has active subscription
2. `subscription_plan_features` table has correct limits
3. Current month usage is calculated correctly

```sql
-- Check user's plan and limits
SELECT
  u.email,
  sp.name as plan,
  spf.feature_key,
  spf.monthly_limit,
  COUNT(fu.id) as current_usage
FROM profiles u
JOIN user_subscriptions us ON us.user_id = u.id
JOIN subscription_plans sp ON sp.id = us.subscription_plan_id
JOIN subscription_plan_features spf ON spf.plan_id = sp.id
LEFT JOIN feature_usage fu ON fu.user_id = u.id
  AND fu.feature_key = spf.feature_key
  AND DATE_TRUNC('month', fu.used_at) = DATE_TRUNC('month', NOW())
WHERE u.id = 'user-id-here'
GROUP BY u.email, sp.name, spf.feature_key, spf.monthly_limit;
```

### Usage not tracking

**Check:**
1. `record_feature_usage` function exists
2. User ID is correct
3. Feature key matches catalog
4. Database permissions

### Calculator not rendering

**Check:**
1. All dependencies installed (`npm install`)
2. UI components exist in `src/components/ui/`
3. No TypeScript errors
4. Component imported correctly

---

## 📞 Support

### Documentation
- **Implementation Guide:** `IMPLEMENTATION.md`
- **Database Schema:** `database/schema/features-schema.sql`
- **Feature Specifications:** `features.md`

### Key Files
- Types: `src/types/features.ts`
- Pricing: `src/config/pricing-plans.ts`
- Usage Tracking: `src/lib/usageTracking.ts`
- Hooks: `src/hooks/useFeatureUsage.ts`

### Example Code
- Complete Feature: `src/components/features/MortgageCalculator.tsx`
- Business Logic: `src/lib/mortgageCalculator.ts`

---

## ✅ Quick Win Checklist

Complete these in order to see immediate value:

- [ ] Deploy database schema
- [ ] Add Mortgage Calculator to a listing page
- [ ] Test the calculator
- [ ] Verify usage tracking works
- [ ] Set up Stripe test account
- [ ] Implement AI Listing Generator
- [ ] Add to listings dashboard
- [ ] Test with different plan tiers
- [ ] Implement Lead Scoring
- [ ] View scored leads in dashboard

**Time to first working feature:** ~30 minutes (Mortgage Calculator)
**Time to revenue-generating feature:** ~4-6 hours (AI Generator)

---

## 🎯 Success Metrics

Track these metrics to measure feature success:

1. **Usage Metrics**
   - Features used per user per month
   - Most popular features
   - Usage by plan tier

2. **Revenue Metrics**
   - Overage revenue by feature
   - Upgrade conversion rate
   - Average revenue per user (ARPU)

3. **User Engagement**
   - Features used in first 7 days
   - Daily active users per feature
   - Feature retention rate

---

## 🚀 You're Ready!

You now have:
- ✅ Complete database schema
- ✅ TypeScript types
- ✅ Pricing system
- ✅ Usage tracking
- ✅ React hooks
- ✅ Working example (Mortgage Calculator)
- ✅ Implementation guides

**Start with the Mortgage Calculator** to see the system in action, then implement additional features based on your priorities!

Good luck! 🎉
