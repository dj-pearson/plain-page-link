/**
 * Display labels for testimonial fields.
 *
 * `transaction_type` has three values the review form can produce — 'buyer',
 * 'seller' and 'both' — and TestimonialCard rendered
 * `type === 'buyer' ? 'Buyer' : 'Seller'`, so a client who bought *and* sold
 * with the agent was shown on the public profile as a seller (US-113). The
 * badge that misrepresents the relationship is worse than no badge.
 *
 * Kept out of the component so the mapping is testable on its own and so the
 * dashboard and the notification email can agree with the public page.
 */

export type TransactionType = 'buyer' | 'seller' | 'both';

const TRANSACTION_LABELS: Record<TransactionType, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  both: 'Buyer & Seller',
};

/**
 * The badge text for a stored transaction_type, or null when there is nothing
 * meaningful to show.
 *
 * The column is nullable text, not an enum, so anything can be in it. An
 * unrecognised value returns null rather than being guessed at — that is the
 * defect this replaces.
 */
export function transactionTypeLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = value.trim().toLowerCase();
  return key in TRANSACTION_LABELS ? TRANSACTION_LABELS[key as TransactionType] : null;
}
