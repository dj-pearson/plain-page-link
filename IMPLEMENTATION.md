# AgentBio.net Advanced Features Implementation Guide

## Overview

This document provides a comprehensive guide to the advanced features implementation for AgentBio.net. The system includes 10 major features with integrated usage-based pricing and Stripe billing.

---

## 📁 Project Structure

### Created Files

```
/database/schema/
└── features-schema.sql          # Complete database schema for all features

/src/types/
└── features.ts                  # TypeScript interfaces for all features

/src/config/
└── pricing-plans.ts             # Pricing tiers and usage pricing configuration

/src/lib/
└── usageTracking.ts             # Usage tracking and billing service

/src/hooks/
└── useFeatureUsage.ts           # React hooks for feature usage
```

---

## 🗄️ Database Schema

### Tables Created

**Pricing & Subscription System:**
- `feature_catalog` - Available features with pricing info
- `subscription_plan_features` - Feature limits per plan
- `feature_usage` - Usage tracking with billing status
- `monthly_usage_summary` - Aggregated monthly usage

**Feature-Specific Tables:**
1. `ai_listing_descriptions` - AI-generated listing content
2. `lead_scores` - Smart lead scoring and intent signals
3. `lead_score_history` - Historical scoring for ML training
4. `lead_conversions` - Conversion tracking
5. `follow_up_sequences` - Email/SMS drip campaigns
6. `follow_up_messages` - Sequence message templates
7. `active_sequences` - Running sequence instances
8. `sequence_message_log` - Message delivery tracking
9. `market_reports` - Market analysis reports
10. `market_report_leads` - Leads from market reports
11. `photo_enhancements` - Virtual staging & AI photo editing
12. `predictive_analytics` - AI predictions
13. `video_tours` - Automated video generation
14. `open_houses` - Open house event management
15. `open_house_registrations` - Visitor registration & tracking
16. `mortgage_calculations` - Mortgage calculator usage
17. `cma_reports` - AI-powered CMA generation

**Stripe Integration:**
- `stripe_customers` - Stripe customer mapping
- `stripe_usage_records` - Usage synced to Stripe
- `stripe_invoices` - Invoice tracking

### Database Functions

- `check_feature_limit(user_id, feature_key)` - Check if user can use feature
- `record_feature_usage(user_id, feature_key, count, metadata)` - Record usage with billing

---

## 💰 Pricing Model

### Plans

| Plan | Monthly | Yearly | Key Limits |
|------|---------|--------|------------|
| **Free** | $0 | $0 | 3 listings, 0 AI features |
| **Starter** | $29 | $290 | 10 listings, 10 AI descriptions/mo |
| **Professional** | $49 | $490 | 25 listings, 25 AI + reports + CMA |
| **Team** | $99 | $990 | Unlimited listings, 100 AI/mo |
| **Enterprise** | $299 | $2990 | Everything unlimited |

### Pay-Per-Use Pricing

- AI Listing Description: $2.00 (cost: $0.30)
- Market Report: $10.00 (cost: $2.00)
- Virtual Staging: $5.00/photo (cost: $3.00)
- Video Tour: $15.00 (cost: $8.00)
- CMA Report: $19.99 (cost: $3.00)
- SMS Messages: $10.00/100 (cost: $0.75)

### Usage Tracking

All feature usage is automatically tracked with:
- Usage count and metadata
- Billing status (pending/billed/failed)
- Stripe invoice linking
- Overage calculation and charging

---

## 🎯 Feature Implementation Status

### ✅ Core Infrastructure (COMPLETED)

- [x] Database schema design
- [x] TypeScript types/interfaces
- [x] Pricing configuration
- [x] Usage tracking service
- [x] React hooks for usage
- [x] Stripe integration structure

### 🚧 Features to Implement

#### Tier 1: Priority Features

1. **AI-Powered Listing Description Generator**
   - **Status:** Ready for implementation
   - **Components needed:**
     - `ListingDescriptionGenerator.tsx` - UI component
     - API route: `/api/features/generate-description`
     - OpenAI integration
   - **Implementation steps:**
     1. Create Supabase Edge Function for OpenAI API
     2. Build React component with form inputs
     3. Add to listings dashboard
     4. Test usage tracking and billing

2. **Smart Lead Scoring & Intent Signals**
   - **Status:** Ready for implementation
   - **Components needed:**
     - `LeadScoreDashboard.tsx` - Display scored leads
     - `LeadScoreCard.tsx` - Individual lead score UI
     - Background job for real-time scoring
   - **Implementation steps:**
     1. Create scoring algorithm function
     2. Build webhook listener for lead actions
     3. Create real-time notifications (SMS/email)
     4. Add to leads dashboard

3. **Automated Follow-Up Sequences**
   - **Status:** Ready for implementation
   - **Components needed:**
     - `SequenceBuilder.tsx` - Drag-and-drop sequence creator
     - `SequenceTemplates.tsx` - Pre-built templates
     - `ActiveSequencesManager.tsx` - Monitor active sequences
     - Background job processor
   - **Implementation steps:**
     1. Integrate SendGrid for email
     2. Integrate Twilio for SMS
     3. Build cron job for message scheduling
     4. Create sequence builder UI

4. **Interactive Market Report Generator**
   - **Status:** Ready for implementation
   - **Components needed:**
     - `MarketReportGenerator.tsx` - Input form
     - `MarketReportView.tsx` - Interactive report display
     - Data integration APIs
   - **Implementation steps:**
     1. Integrate data sources (Zillow, Census, Walk Score)
     2. Create report generation logic
     3. Build interactive charts with Recharts
     4. Generate PDF exports

#### Tier 2: Advanced Features

5. **Virtual Staging & AI Photo Enhancement**
6. **Predictive Analytics Dashboard**
7. **Automated Video Tour & Reel Generator**
8. **Smart Open House Management System**

#### Basic Features (Quick Wins)

9. **Mortgage Pre-Qualification Widget**
   - **Status:** Can be implemented immediately (no external APIs)
   - **Components needed:**
     - `MortgageCalculator.tsx` - Calculator UI
     - `AffordabilityCalculator.tsx` - Affordability tool
   - **Implementation:** Pure client-side calculations

10. **AI-Powered CMA Generator**
    - **Status:** Complex - needs MLS integration
    - **Dependencies:** MLS data access, property database

---

## 🔧 Implementation Workflow

### Step 1: Set Up Database

```bash
# Run the schema migration
psql $DATABASE_URL < database/schema/features-schema.sql
```

### Step 2: Configure Environment Variables

```env
# .env.local
OPENAI_API_KEY=sk-...
SENDGRID_API_KEY=SG...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Data APIs
ZILLOW_API_KEY=...
WALKSCORE_API_KEY=...
CENSUS_API_KEY=... (free)
```

### Step 3: Create Supabase Edge Functions

Create these Edge Functions in your Supabase project:

1. **generate-listing-description** (OpenAI)
2. **generate-market-report** (Data aggregation)
3. **generate-cma** (AI + data)
4. **enhance-photo** (AI image processing)
5. **generate-video-tour** (Video generation)
6. **create-stripe-customer**
7. **create-checkout-session**
8. **report-stripe-usage**
9. **handle-stripe-webhook**

### Step 4: Implement Features

For each feature:

1. Create the UI component in `/src/components/features/`
2. Add API routes or Edge Functions
3. Integrate usage tracking
4. Test with different subscription plans
5. Add to relevant dashboard pages

---

## 🎨 UI Component Architecture

### Feature Component Pattern

```tsx
// Example: AI Listing Description Generator

import { useFeatureWithTracking } from '@/hooks/useFeatureUsage';
import { FEATURE_KEYS } from '@/config/pricing-plans';

export function ListingDescriptionGenerator({ listingId }: Props) {
  const { execute, isLoading, error } = useFeatureWithTracking(
    FEATURE_KEYS.AI_LISTING_DESCRIPTION,
    async (params) => {
      // Call API
      const { data } = await supabase.functions.invoke('generate-listing-description', {
        body: params
      });
      return data;
    }
  );

  const handleGenerate = async () => {
    const result = await execute({
      listing_id: listingId,
      property_type: 'Single Family',
      // ... other params
    });

    if (result) {
      // Handle success
    }
  };

  return (
    // UI with form inputs, preview, etc.
  );
}
```

### Usage Display Pattern

```tsx
// Show usage stats in dashboard

import { useUsageStats } from '@/hooks/useFeatureUsage';

export function UsageOverview() {
  const { stats, loading } = useUsageStats();

  return (
    <div>
      {Object.entries(stats).map(([key, usage]) => (
        <UsageCard
          key={key}
          featureName={key}
          used={usage.currentMonth}
          limit={usage.limit}
          remaining={usage.remaining}
          overageCharges={usage.overageCharges}
        />
      ))}
    </div>
  );
}
```

---

## 💳 Stripe Integration

### Subscription Flow

1. User selects plan on pricing page
2. Create Stripe Checkout Session (Edge Function)
3. Redirect to Stripe Checkout
4. Webhook confirms payment
5. Update `user_subscriptions` table
6. User gets access to features

### Usage-Based Billing

1. User triggers feature (e.g., generates AI description)
2. `useFeatureWithTracking` checks limits
3. If allowed, executes action
4. Records usage in `feature_usage` table
5. If overage, syncs to Stripe usage records
6. Stripe bills at end of billing cycle

### Webhook Events

Handle these Stripe webhooks:

- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Plan change
- `customer.subscription.deleted` - Cancellation
- `invoice.payment_succeeded` - Payment received
- `invoice.payment_failed` - Payment failed

---

## 📊 Admin Dashboard

### Required Views

1. **Usage Analytics**
   - Total usage by feature
   - Revenue by feature
   - Top users by usage
   - Overage revenue

2. **User Management**
   - User list with subscription info
   - Usage overview per user
   - Manual adjustments

3. **Billing Dashboard**
   - Pending charges
   - Failed payments
   - Revenue reports
   - Refund management

4. **Feature Management**
   - Enable/disable features
   - Adjust pricing
   - Update limits

---

## 🧪 Testing Checklist

### Per Feature

- [ ] Free plan: Feature disabled or limited
- [ ] Starter plan: Can use with limits
- [ ] Professional plan: Full access with limits
- [ ] Team/Enterprise: Unlimited access
- [ ] Overage charges work correctly
- [ ] Usage tracking records properly
- [ ] Stripe billing syncs correctly

### Integration Tests

- [ ] Subscription upgrade/downgrade
- [ ] Monthly limit reset
- [ ] Overage billing
- [ ] Failed payment handling
- [ ] Webhook processing
- [ ] Usage report generation

---

## 🚀 Deployment Steps

1. **Database Migration**
   ```bash
   # Apply schema
   supabase db push
   ```

2. **Deploy Edge Functions**
   ```bash
   supabase functions deploy generate-listing-description
   supabase functions deploy create-stripe-customer
   # ... deploy all functions
   ```

3. **Configure Stripe Products**
   - Create products for each pricing tier
   - Set up metered billing for usage-based features
   - Configure webhooks
   - Get product IDs and update `pricing-plans.ts`

4. **Seed Data**
   ```sql
   -- Feature catalog is seeded in schema
   -- Update Stripe product IDs
   UPDATE subscription_plans
   SET stripe_price_id_monthly = 'price_xxx'
   WHERE name = 'Professional';
   ```

5. **Deploy Frontend**
   ```bash
   npm run build
   # Deploy to your hosting
   ```

---

## 📝 Next Steps

### Immediate Priorities

1. ✅ **Set up Stripe account and products**
2. ✅ **Create Supabase Edge Functions for:**
   - OpenAI integration
   - Stripe integration
   - Data fetching APIs

3. ✅ **Implement Feature #9: Mortgage Calculator** (Quick win - no APIs needed)
   - Pure client-side
   - Can be done in 1-2 hours
   - Shows feature system working

4. ✅ **Implement Feature #1: AI Listing Description Generator** (High value)
   - Integrate OpenAI API
   - Build generator UI
   - Add to listings page

5. ✅ **Implement Feature #2: Lead Scoring** (High value)
   - Create scoring algorithm
   - Add to leads dashboard
   - Enable real-time notifications

### Medium Term

- Build remaining Tier 1 features
- Create admin dashboard
- Set up monitoring and alerts
- Add comprehensive testing

### Long Term

- Implement Tier 2 features
- Machine learning for predictions
- Advanced analytics
- Mobile app features

---

## 🆘 Common Issues & Solutions

### Issue: "Feature limit reached" but user hasn't used feature

**Solution:** Check subscription is active and `subscription_plan_features` table has correct limits.

### Issue: Usage not syncing to Stripe

**Solution:**
1. Check `stripe_usage_records` table for sync errors
2. Verify Stripe subscription has metered billing items
3. Check Edge Function logs for errors

### Issue: Overage charges not appearing

**Solution:**
1. Verify `overage_allowed = true` in plan features
2. Check `feature_usage` table for `included_in_plan = false`
3. Ensure Stripe webhook is processing correctly

---

## 📚 Resources

### Documentation

- [Stripe Usage-Based Billing](https://stripe.com/docs/billing/subscriptions/usage-based)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [OpenAI API](https://platform.openai.com/docs/api-reference)

### Example Implementations

- See `src/hooks/useFeatureUsage.ts` for usage patterns
- See `src/lib/usageTracking.ts` for service layer
- See `src/config/pricing-plans.ts` for plan configuration

---

## ✨ Summary

**What's Been Built:**
- Complete database schema for all 10 features
- TypeScript types and interfaces
- Pricing model with 5 tiers
- Usage tracking service with Stripe integration
- React hooks for feature usage
- Comprehensive documentation

**What's Next:**
- Implement Stripe Edge Functions
- Build feature UI components
- Add features to dashboard
- Create admin panel
- Test billing flows
- Deploy to production

**Estimated Timeline:**
- Stripe setup: 2-4 hours
- Mortgage Calculator: 2-4 hours
- AI Description Generator: 8-12 hours
- Lead Scoring: 8-12 hours
- Follow-Up Sequences: 16-20 hours
- Market Reports: 12-16 hours
- Admin Dashboard: 8-12 hours
- **Total: 56-80 hours for core features**

---

## 🎉 Conclusion

The foundation for all 10 advanced features has been built with a robust pricing and usage tracking system integrated with Stripe. The architecture supports:

- Flexible pricing tiers
- Usage-based billing
- Automatic overage charges
- Real-time usage tracking
- Easy feature additions
- Comprehensive analytics

You can now proceed with implementing individual features knowing that the billing infrastructure is ready to support them.

---

*Last Updated: {{DATE}}*
*Version: 1.0.0*
