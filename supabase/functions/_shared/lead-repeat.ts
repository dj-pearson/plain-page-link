/**
 * Folding a repeat enquiry into the lead the visitor already has (US-513).
 *
 * submit-lead treats the same address enquiring again within a day as one lead
 * (US-220): no second notification, auto-reply or allowance charge. That part
 * is right — it is what stops a double submit or a replaying bot from spending
 * the agent's allowance. But the fold used to be
 *
 *     message: incoming.message ?? earlier.message
 *
 * so a visitor who wrote "Can I see 12 Main St on Saturday?" and an hour later
 * "Also, is 40 Oak Ave still available?" left the agent only the second
 * sentence, the listing they asked about the second time was dropped, and the
 * lead's timeline showed nothing. The first message — often the one the agent
 * was already emailed about — was overwritten in the database.
 *
 * This decides what the fold writes: the messages are kept together, a listing
 * is filled in only when the lead has none, and anything the visitor added is
 * recorded on the lead's timeline as a system row (form_submission), so the
 * agent can see that they came back. A byte-identical resubmission adds
 * nothing and logs nothing.
 *
 * The timeline row never carries the visitor's words, only that they sent
 * another message. The words live on leads.message, which the dashboard hides
 * on a locked lead (past the leads_per_month allowance), as the notification
 * email does. lead_activities.content has no such gate, and a lead can become
 * locked after the fold (a downgrade lowers the allowance), so copying the
 * message there would let an agent read a locked lead's enquiry, contact
 * details included, without upgrading.
 *
 * Whether the agent should also be emailed about a repeat is US-418's open
 * product question; this module deliberately does not decide it.
 */

/** leads.message is text; keep a merged history bounded all the same. */
export const MERGED_MESSAGE_MAX = 5000;

/** Placed between the earlier message and a later one in leads.message. */
export const MESSAGE_SEPARATOR = '\n\n---\n';

/** What the timeline row says in place of the new message's text. */
export const REPEAT_MESSAGE_NOTE = 'Sent another message';

export interface EarlierLead {
  message: string | null;
  listing_id: string | null;
  form_data: Record<string, unknown> | null;
}

export interface RepeatEnquiry {
  message?: string | null;
  /** Only an id already checked to belong to the agent. */
  listing_id?: string | null;
  /** Shown on the timeline row when the repeat names a different listing. */
  listing_address?: string | null;
  form_data?: Record<string, unknown> | null;
  source?: string | null;
}

export interface RepeatTimelineRow {
  activity_type: 'form_submission';
  title: string;
  content: string | null;
  metadata: Record<string, unknown>;
}

export interface RepeatMerge {
  /** Columns for the update on the earlier lead (updated_at is the caller's). */
  update: {
    message: string | null;
    form_data: Record<string, unknown>;
    listing_id?: string;
  };
  /** A timeline row to insert, or null when the repeat added nothing. */
  activity: RepeatTimelineRow | null;
}

function clean(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

function sameValue(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeRepeatEnquiry(earlier: EarlierLead, incoming: RepeatEnquiry): RepeatMerge {
  const earlierMessage = clean(earlier.message);
  const incomingMessage = clean(incoming.message);

  // New unless it repeats one of the messages already stored: a resubmission
  // of the same text is not news, a short reply that happens to appear inside
  // a longer earlier message still is.
  const storedMessages = earlierMessage.split(MESSAGE_SEPARATOR.trim()).map((part) => part.trim());
  const messageIsNew = incomingMessage !== '' && !storedMessages.includes(incomingMessage);

  let message: string | null = earlier.message;
  if (messageIsNew) {
    if (earlierMessage === '') {
      message = incomingMessage;
    } else {
      const combined = `${earlierMessage}${MESSAGE_SEPARATOR}${incomingMessage}`;
      // Over the cap the stored copy is cut, never the earlier words.
      message =
        combined.length > MERGED_MESSAGE_MAX ? `${combined.slice(0, MERGED_MESSAGE_MAX - 1)}…` : combined;
    }
  }

  const earlierForm = earlier.form_data ?? {};
  const incomingForm = incoming.form_data ?? {};
  const changedAnswers = Object.keys(incomingForm).filter((key) => !sameValue(earlierForm[key], incomingForm[key]));
  const form_data = { ...earlierForm, ...incomingForm };

  const incomingListing = incoming.listing_id ?? null;
  const listingIsNew = incomingListing !== null && incomingListing !== earlier.listing_id;
  // The lead keeps the listing it arrived with; a lead that had none takes the
  // one named now. Either way a different listing is on the timeline row.
  const fillListing = listingIsNew && earlier.listing_id === null;

  const update: RepeatMerge['update'] = { message, form_data };
  if (fillListing) update.listing_id = incomingListing as string;

  if (!messageIsNew && !listingIsNew && changedAnswers.length === 0) {
    return { update, activity: null };
  }

  const lines: string[] = [];
  // Not the text itself: see the header — the timeline is not lock-gated.
  if (messageIsNew) lines.push(REPEAT_MESSAGE_NOTE);
  if (listingIsNew) {
    const address = clean(incoming.listing_address);
    lines.push(address ? `Asked about ${address}` : 'Asked about another listing');
  }
  if (changedAnswers.length > 0) {
    lines.push(`Updated answers: ${changedAnswers.join(', ')}`);
  }

  return {
    update,
    activity: {
      activity_type: 'form_submission',
      title: 'Enquired again',
      content: lines.join('\n\n'),
      metadata: {
        repeat_enquiry: true,
        auto_logged: true,
        source: incoming.source ?? null,
        listing_id: listingIsNew ? incomingListing : null,
        changed_answers: changedAnswers,
      },
    },
  };
}
