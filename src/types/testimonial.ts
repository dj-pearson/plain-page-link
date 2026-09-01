/**
 * A client testimonial, as the `testimonials` table actually stores it.
 *
 * This file previously described a schema that does not exist: `id: number`
 * (it is a uuid), `profile_id` (the column is `user_id`), and `review_text`
 * (the column is `review`). TestimonialCard rendered
 * `{testimonial.review_text}`, always undefined, while usePublicProfile was
 * selecting `review` correctly — so **every testimonial on every public profile
 * rendered an empty quote**. Fixed in US-056, alongside the identical defect in
 * types/profile.ts.
 *
 * Derived from the generated Row type so it cannot drift again.
 */

import type { Database } from '@/integrations/supabase/types';

/** A row from `testimonials`, exactly as stored. */
export type TestimonialRow = Database['public']['Tables']['testimonials']['Row'];

export type Testimonial = TestimonialRow;

/**
 * The subset of a testimonial a public profile page receives.
 *
 * usePublicProfile deliberately selects a column list rather than `*`, so the
 * public components must not be typed against the full row — they were, which
 * made every render site reject the hook's result for missing `user_id`,
 * `updated_at` and `listing_id`. Same construction as `PublicProfile`: add a
 * column to that select and it belongs here, and `Pick` rejects a name that is
 * not a real column.
 */
export type PublicTestimonialFields =
  | 'id'
  | 'client_name'
  | 'client_title'
  | 'client_photo'
  | 'review'
  | 'rating'
  | 'sort_order'
  | 'date'
  | 'is_featured'
  | 'transaction_type'
  | 'property_type'
  | 'created_at'
  | 'is_published';

export type PublicTestimonial = Pick<Testimonial, PublicTestimonialFields>;
