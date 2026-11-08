/**
 * The listing description generator drip, emails 1-7 (US-479).
 *
 * The keys are the sequence numbers init_listing_email_sequence() writes into
 * listing_email_sequences (there is no email 4), and the HTML in
 * send-scheduled-listing-emails is keyed the same way. `day` is when each one
 * becomes due, matching get_pending_listing_emails(): email n on day n.
 *
 * The welcome email (send-listing-generator-email) is separate and goes out at
 * capture.
 */
export const LISTING_DRIP: Readonly<Record<number, { subject: string; day: number }>> = {
  1: { subject: 'The most common listing description mistake', day: 1 },
  2: { subject: 'Power words that make buyers take action', day: 2 },
  3: { subject: 'How to choose the right description style for your listing', day: 3 },
  5: { subject: 'Four things to check before your listing goes live', day: 5 },
  6: { subject: 'Your listing checklist: Beyond the description', day: 6 },
  7: { subject: 'What AgentBio does with the listings you write', day: 7 },
};

/** sequence number -> due day, for drip-schedule.ts. */
export const LISTING_DRIP_DAY: Readonly<Record<number, number>> = Object.fromEntries(
  Object.entries(LISTING_DRIP).map(([n, { day }]) => [Number(n), day])
);
