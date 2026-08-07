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
