/**
 * How long each lead field is allowed to be, in the browser.
 *
 * Not one of the four public lead forms had a `.max()` on any field. The edge
 * function has enforced these bounds all along, so a buyer writing more than
 * 2000 characters about what they are looking for — which a motivated buyer
 * does — passed client validation, pressed Send, and got a generic failure.
 * Their message was gone, and nothing told them why (US-198).
 *
 * This is the fifth in the sequence US-069, US-095, US-096, US-197: every time,
 * a lead the visitor filled in correctly was thrown away by the layer behind
 * the form.
 *
 * These numbers are `leads`' own column limits, and the same table lives in
 * supabase/functions/_shared/validation.ts as LEAD_FIELD_LIMITS. Deno and Vite
 * cannot import each other, so leadFieldLimits.test.ts imports both and fails
 * if they drift apart.
 */
export const LEAD_FIELD_LIMITS = {
  name: { min: 1, max: 100 },
  email: { max: 255 },
  message: { min: 0, max: 2000 },
  property_address: { min: 0, max: 500 },
  price_range: { min: 0, max: 100 },
  timeline: { min: 0, max: 100 },
} as const;

/** The message shown when a field is over its limit. Says the number. */
export function tooLong(label: string, max: number): string {
  return `${label} must be ${max} characters or fewer`;
}
