import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

/** One campaign source's funnel, and its views → leads rate (US-227). */
export interface CampaignRow {
  source: string;
  views: number;
  formOpens: number;
  leads: number;
  /** leads / views, or null with no views to divide by. */
  rate: number | null;
}

export function toCampaignRows(raw: unknown): CampaignRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: { source?: string; views?: number; form_opens?: number; leads?: number }) => {
    const views = Number(r.views ?? 0);
    const leads = Number(r.leads ?? 0);
    return {
      source: r.source ?? 'direct',
      views,
      formOpens: Number(r.form_opens ?? 0),
      leads,
      rate: views > 0 ? leads / views : null,
    };
  });
}

export const useCampaignConversion = (since: Date) => {
  const { user } = useAuthStore();
  const sinceIso = since.toISOString().slice(0, 10);
  const { data, isLoading } = useQuery({
    queryKey: ['campaign-conversion', user?.id, sinceIso],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('campaign_conversion', { p_since: sinceIso });
      if (error) throw error;
      return toCampaignRows(data);
    },
  });
  return { rows: data ?? [], isLoading };
};
