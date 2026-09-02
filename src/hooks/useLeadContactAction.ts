/**
 * Records that the agent reached out to a lead.
 *
 * US-101: the mailto:/tel:/sms: links on the Leads page card and in the detail
 * modal were plain anchors with no side effect. An agent who phoned a lead a
 * minute after it arrived still read "No response · 3h" on the card and pulled
 * the Avg Response KPI down, because first_responded_at is only set by the
 * set_lead_first_responded_at trigger on the first status change away from
 * 'new'.
 *
 * Shared by both call sites so they cannot drift. The link itself is never
 * intercepted: the href fires, the dialer or mail client opens, and this runs
 * alongside. A failure to record is surfaced but never blocks the agent from
 * making the call.
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLeadActivities } from '@/hooks/useLeadActivities';
import { buildContactPatch } from '@/lib/leadStatus';
import { logger } from '@/lib/logger';
import type { Lead } from '@/types/lead';

export type ContactChannel = 'call' | 'email' | 'sms';

export function useLeadContactAction(onRecorded?: (patchedStatus: string) => void) {
  const { logCall, logEmail, logActivity } = useLeadActivities(undefined);

  return useCallback(
    async (lead: Lead, channel: ContactChannel) => {
      try {
        const patch = buildContactPatch(lead);
        if (patch) {
          const { error } = await supabase.from('leads').update(patch).eq('id', lead.id);
          if (error) throw error;
          onRecorded?.(patch.status);
        }

        // Through the RPCs, which also maintain contacted_at server-side
        // (US-100). Outcome 'initiated', not 'connected': the browser can
        // establish that the dialer opened, not that anyone answered.
        if (channel === 'call') {
          logCall({ leadId: lead.id, outcome: 'initiated', notes: 'Called from the CRM' });
        } else if (channel === 'email') {
          logEmail({
            leadId: lead.id,
            subject: `Reply to ${lead.name}`,
            recipient: lead.email ?? '',
            body: 'Opened from the CRM',
          });
        } else {
          logActivity({
            leadId: lead.id,
            activityType: 'sms',
            title: 'Text message',
            content: 'Opened the SMS app from the CRM',
          });
        }
      } catch (error) {
        logger.error('Failed to record a contact action', error as Error);
      }
    },
    [logCall, logEmail, logActivity, onRecorded]
  );
}
