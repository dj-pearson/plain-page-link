/**
 * The one thing to do next about a lead.
 *
 * US-103: LeadScoringSystem.getRecommendedActions() has produced advice like
 * "Send personalized message within 5 minutes" since it was written, and no
 * component has ever rendered it. The product's claim is that it guides a
 * non-technical agent through the process; a list of emoji strings buried in a
 * scoring module does not.
 *
 * This narrows that list to a single next step the UI can actually perform,
 * because a button an agent can press beats a paragraph they have to interpret.
 * The full list is still available from getRecommendedActions for anywhere that
 * wants the long form.
 */
import type { Lead } from '@/types/lead';

export type NextStepAction = 'call' | 'email' | 'sms' | 'task';

export interface LeadNextStep {
  /** What the button says. */
  label: string;
  /** Why, in one short line the agent can act on. */
  rationale: string;
  action: NextStepAction;
  urgency: 'now' | 'today' | 'this_week';
}

/** Hours since a timestamp, or null when it is missing. */
function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

/**
 * Decides the next step for `lead`.
 *
 * `score` is the ML/rules score where one exists; without it the step is driven
 * by status and age alone, which is the common case for a lead that arrived a
 * minute ago and has not been scored yet.
 */
export function getLeadNextStep(lead: Lead, score?: number | null): LeadNextStep {
  const age = hoursSince(lead.created_at);
  const unanswered = lead.status === 'new' && !lead.first_responded_at;

  // Nothing outranks an unanswered new lead. Speed of first response is the
  // single strongest predictor of conversion, and it is exactly what the Leads
  // page's SLA card is measuring.
  if (unanswered) {
    if (lead.phone) {
      return {
        label: 'Call now',
        rationale:
          age !== null && age >= 1
            ? `No response yet — this lead has been waiting ${Math.floor(age)}h`
            : 'A new lead answers fastest in the first few minutes',
        action: 'call',
        urgency: 'now',
      };
    }
    return {
      label: 'Email now',
      rationale: 'No phone number on this lead, so email is the fastest route',
      action: 'email',
      urgency: 'now',
    };
  }

  if (lead.status === 'converted' || lead.status === 'closed') {
    return {
      label: 'Schedule a check-in',
      rationale: 'Closed leads are the cheapest source of referrals',
      action: 'task',
      urgency: 'this_week',
    };
  }

  if (lead.status === 'lost') {
    return {
      label: 'Add to nurture',
      rationale: 'Set a reminder to revisit rather than dropping it entirely',
      action: 'task',
      urgency: 'this_week',
    };
  }

  // Contacted or later. What matters now is not going quiet.
  const sinceContact = hoursSince(lead.contacted_at);
  if (sinceContact !== null && sinceContact >= 72) {
    return {
      label: lead.phone ? 'Follow up by phone' : 'Follow up by email',
      rationale: `Last contact was ${Math.floor(sinceContact / 24)} days ago`,
      action: lead.phone ? 'call' : 'email',
      urgency: 'today',
    };
  }

  if (typeof score === 'number' && score >= 70) {
    return {
      label: 'Book a viewing',
      rationale: `Score ${score} — this lead is ready to move`,
      action: 'task',
      urgency: 'today',
    };
  }

  return {
    label: 'Set a follow-up',
    rationale: 'Keep the lead warm with a dated reminder',
    action: 'task',
    urgency: 'this_week',
  };
}
