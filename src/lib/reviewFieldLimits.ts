/**
 * How long each review field may be, in the browser.
 *
 * SubmitReview.tsx put no maxLength on anything. The edge function has enforced
 * review <= 2000 and the three 100-character fields all along, so a happy
 * client writing a long testimonial — the most useful review an agent can get —
 * filled the form in and was refused after pressing Send (US-199).
 *
 * Worse, they were not told why. The submit handler threw the server's own
 * explanation away and showed "There was an error submitting your review.
 * Please try again", so trying again produced the same result forever.
 *
 * The same table lives in supabase/functions/_shared/validation.ts as
 * REVIEW_FIELD_LIMITS. Deno and Vite cannot import each other, so
 * reviewFieldLimits.test.ts imports both and fails if they drift.
 */
export const REVIEW_FIELD_LIMITS = {
  client_name: { min: 1, max: 100 },
  client_title: { min: 0, max: 100 },
  property_type: { min: 0, max: 100 },
  review: { min: 1, max: 2000 },
  rating: { min: 1, max: 5 },
} as const;

/**
 * Show a count only once it is worth knowing.
 *
 * A counter sitting under an empty box says "there is a limit and you are being
 * measured against it". One that appears at three quarters says "you are close",
 * which is the only moment it helps.
 */
export const COUNTER_APPEARS_AT = 0.75;

export function shouldShowCounter(length: number, max: number): boolean {
  return length >= max * COUNTER_APPEARS_AT;
}
