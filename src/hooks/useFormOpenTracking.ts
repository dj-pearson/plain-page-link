import { useEffect } from 'react';
import { trackFormOpen } from '@/lib/analyticsEvents';

/** Records one form_open when a lead form is shown (US-227). */
export const useFormOpenTracking = (agentId: string | undefined, formType: string) => {
  useEffect(() => {
    void trackFormOpen(agentId, formType);
  }, [agentId, formType]);
};
