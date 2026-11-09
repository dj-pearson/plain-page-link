# What the marketing pages claim, and the code that makes it true

Last reconciled: 2026-11-07 (US-310, slice 2 of US-143 "say what ships").

The homepage (`src/pages/public/Landing.tsx`), its benefits block
(`src/components/landing/AgentTestimonials.tsx`) and `/for-real-estate-agents`
(`src/pages/landing/ForRealEstateAgents.tsx`) may only claim something that a
file in this repository implements. Each claim below names that file. Before
adding a line to one of those pages, add its row here; if you cannot name the
file, the product does not do it yet and the page should not say it does.

`src/landing-claims.test.ts` checks that every path in the table exists and
that the phrases in the "Removed" list do not come back.

## Claims and where they are implemented

| Claim on the page | Implemented in |
| --- | --- |
| Active and sold listings with photos, price, beds/baths, square footage | `src/components/profile/ListingCard.tsx` |
| Sold properties showcase | `src/components/profile/SoldProperties.tsx` |
| Best listings highlighted at the top | `src/components/profile/FeaturedListingsCarousel.tsx` |
| Virtual tour link on a listing | `src/components/profile/ListingDetails.tsx` |
| MLS number shown on each listing | `src/components/profile/ListingDetails.tsx` |
| Open house dates on the profile | `src/components/profile/UpcomingOpenHouses.tsx` |
| Share an individual listing | `src/components/profile/ListingCard.tsx` |
| Import listings from a spreadsheet | `src/components/listings/CSVUploadDialog.tsx` |
| Buyer form with pre-qualification questions (price range, timeline, pre-approval) | `src/lib/leadFormSchema.ts` |
| Seller form with timeline; home valuation with address capture | `src/components/forms/SellerInquiryForm.tsx`, `src/components/forms/HomeValuationForm.tsx` |
| Email notification when a lead arrives | `supabase/functions/notify-lead/index.ts` |
| Calendly booking from the profile, saved as a lead | `src/components/integrations/CalendlyModal.tsx` |
| One-tap call, text and email buttons | `src/components/profile/ContactButtons.tsx`, `src/components/profile/StickyActionBar.tsx` |
| Sticky contact bar | `src/components/profile/StickyActionBar.tsx` |
| Which listings visitors view most | `src/hooks/useListingViewStats.ts` |
| Where each lead came from (campaign, referring site, device) | `src/lib/leadAttribution.ts` |
| Hot / warm / cold rating from the lead's answers | `src/lib/ml-lead-scoring.ts` |
| Team lead routing | `src/hooks/useLeadRouting.ts` |
| Equal Housing Opportunity logo and statement on the profile | `src/pages/public/FullProfilePage.tsx` |
| License number and state displayed | `src/components/profile/ProfileHeader.tsx` |
| Review link; each review approved before it shows | `src/pages/public/SubmitReview.tsx`, `src/hooks/useTestimonials.ts` |
| Star rating on every review | `src/components/profile/TestimonialCard.tsx` |
| Page builder (drag and drop) | `src/pages/PageBuilder.tsx` |
| Monthly price on the comparison table | `src/config/pricing-plans.ts` |

## Removed in US-310, because nothing implements them

| Was on the page | Why it went |
| --- | --- |
| "Time zone auto-detection / detection for out-of-area buyers" | No AgentBio code detects a visitor's time zone. Calendly does its own, for agents who connect it; that is Calendly's feature, not ours. |
| "Google Calendar support" for showings | There is no Google Calendar integration. Only open houses offer an add-to-calendar link (`src/lib/openHouseCalendar.ts`). |
| "Video testimonials" | `testimonials` has no video column; reviews are text and a rating. |
| "Property videos" | `listings` has `virtual_tour_url` and photos, nothing for video. |
| "Track Instagram Story vs Post vs DM" | Attribution reads UTM tags and the referrer. It can name Instagram only when the agent tags the link; it cannot tell a Story from a Post by itself. |
| "Lead scoring based on behavior" | The behavioural inputs were removed from the model in US-105 because nothing records them (see the comment in `src/lib/ml-lead-scoring.ts`). The rating uses what the lead submitted. |
| "MLS attribution when applicable", "Fair Housing disclaimers" | Neither is implemented beyond the MLS number and the Equal Housing statement listed above. |
| "Loads in under 2 seconds on 4G", "Instant load", "5+ seconds" for other sites | Never measured. The page is lightweight, but no number backs a timing claim. |
| "43% of real estate referrals come through text messages and social media" | No source. |
| "verified credentials" | The license number is what the agent typed; nothing verifies it. |
| "$39" monthly price on the comparison table | Not the price of any plan. The cell now reads from `PRICING_PLANS`. |

## Not covered yet

- The `/features/*` pages (US-295) and `src/config/pricing-plans.ts` dead keys
  (US-296) are separate slices of US-143.
- This file used to be a quick-start guide for a usage-billing system
  (`database/schema/features-schema.sql`, `src/lib/usageTracking.ts`,
  `src/hooks/useFeatureUsage.ts`, `src/components/features/MortgageCalculator.tsx`)
  that does not exist in the repository. That guide is gone; plan limits and
  metered quotas are described in CLAUDE.md under "Plan limits".
