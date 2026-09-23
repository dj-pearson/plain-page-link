/**
 * Open houses: the agent's schedule, who signed in, and the public reads the
 * profile section and the sign-in kiosk use.
 *
 * Visitors never read `open_houses` directly — there is no public policy on it,
 * because private_notes (lockbox codes, seller instructions) is in the row.
 * They go through list_public_open_houses / get_public_open_house, which
 * return only the public columns. See 20260923000001.
 *
 * A sign-in is a lead: it goes through submit-lead like every other public
 * capture, with lead_type 'open_house' and the open house id, so it gets the
 * same validation, rate limiting, encryption, routing and notification.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { decryptLeadContacts } from '@/lib/pii';
import { callEdgeFunction } from '@/lib/edgeFunctions';
import { getLeadAttribution } from '@/lib/attribution';
import { errorHandler } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import type { Lead } from '@/types/lead';

type OpenHouseRow = Database['public']['Tables']['open_houses']['Row'];
export type PublicOpenHouse =
  Database['public']['Functions']['list_public_open_houses']['Returns'][number];
export type PublicOpenHouseDetail =
  Database['public']['Functions']['get_public_open_house']['Returns'][number];

export type OpenHouseStatus = 'scheduled' | 'completed' | 'cancelled';

export interface OpenHouseListing {
  id: string;
  address: string;
  city: string;
  state: string | null;
  zip_code: string | null;
  price: string;
  status: string | null;
  image: string | null;
  photos: Database['public']['Tables']['listings']['Row']['photos'];
}

export type OpenHouse = OpenHouseRow & {
  listings: OpenHouseListing | null;
  /** How many visitors signed in. */
  signInCount: number;
};

export interface OpenHouseInput {
  listing_id: string;
  starts_at: string;
  ends_at: string;
  is_public: boolean;
  public_notes?: string | null;
  private_notes?: string | null;
}

/** "12 Elm St, Springfield, IL 62701" */
export function formatOpenHouseAddress(l: {
  address: string;
  city: string;
  state?: string | null;
  zip_code?: string | null;
}): string {
  const stateZip = [l.state, l.zip_code].filter(Boolean).join(' ');
  return [l.address, l.city, stateZip].filter(Boolean).join(', ');
}

export function useOpenHouses() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['open-houses', user?.id],
    queryFn: async (): Promise<OpenHouse[]> => {
      if (!user?.id) return [];
      const [openHouses, signIns] = await Promise.all([
        supabase
          .from('open_houses')
          .select('*, listings(id, address, city, state, zip_code, price, status, image, photos)')
          .eq('user_id', user.id)
          .order('starts_at', { ascending: false })
          .limit(500),
        supabase
          .from('leads')
          .select('open_house_id')
          .eq('user_id', user.id)
          .not('open_house_id', 'is', null)
          .limit(10000),
      ]);
      if (openHouses.error) throw openHouses.error;
      if (signIns.error) throw signIns.error;

      const counts = new Map<string, number>();
      for (const row of signIns.data ?? []) {
        if (row.open_house_id)
          counts.set(row.open_house_id, (counts.get(row.open_house_id) ?? 0) + 1);
      }
      return (openHouses.data ?? []).map((row) => ({
        ...(row as OpenHouseRow & { listings: OpenHouseListing | null }),
        signInCount: counts.get(row.id) ?? 0,
      }));
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['open-houses'] });
    queryClient.invalidateQueries({ queryKey: ['public-open-houses'] });
  };

  const createOpenHouse = useMutation({
    mutationFn: async (input: OpenHouseInput) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('open_houses')
        .insert({ ...input, user_id: user.id })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'create_open_house',
        component: 'useOpenHouses',
      }),
  });

  const updateOpenHouse = useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<OpenHouseInput> & { status?: OpenHouseStatus };
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('open_houses')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'update_open_house',
        component: 'useOpenHouses',
      }),
  });

  const deleteOpenHouse = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('open_houses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error) =>
      errorHandler.captureException(error as Error, {
        action: 'delete_open_house',
        component: 'useOpenHouses',
      }),
  });

  return {
    openHouses: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createOpenHouse,
    updateOpenHouse,
    deleteOpenHouse,
  };
}

/** The visitors who signed in at one open house, contact details decrypted. */
export function useOpenHouseVisitors(openHouseId: string | null | undefined) {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['open-house-visitors', openHouseId],
    queryFn: async (): Promise<Lead[]> => {
      if (!user?.id || !openHouseId) return [];
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .eq('open_house_id', openHouseId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (error) throw error;
      const rows = data ?? [];
      const details = await decryptLeadContacts(rows.map((r) => r.id));
      return rows.map(({ encrypted_email: _e, encrypted_phone: _p, ...rest }) => ({
        ...rest,
        email: details.get(rest.id)?.email ?? null,
        phone: details.get(rest.id)?.phone ?? null,
      }));
    },
    enabled: !!user?.id && !!openHouseId,
    // The agent watches this during the event; keep it fresh.
    refetchInterval: 30 * 1000,
  });
}

/** Upcoming public open houses for a profile page. */
export function usePublicOpenHouses(agentId: string | null | undefined) {
  return useQuery({
    queryKey: ['public-open-houses', agentId],
    queryFn: async (): Promise<PublicOpenHouse[]> => {
      if (!agentId) return [];
      const { data, error } = await supabase.rpc('list_public_open_houses', { _user_id: agentId });
      if (error) {
        // A profile page must render without this section rather than fail.
        logger.error('Could not load public open houses', error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000,
  });
}

/** One open house for the sign-in kiosk, or null if it is not taking sign-ins. */
export function usePublicOpenHouse(openHouseId: string | null | undefined) {
  return useQuery({
    queryKey: ['public-open-house', openHouseId],
    queryFn: async (): Promise<PublicOpenHouseDetail | null> => {
      if (!openHouseId) return null;
      const { data, error } = await supabase.rpc('get_public_open_house', {
        _open_house_id: openHouseId,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!openHouseId,
    retry: 1,
  });
}

export interface OpenHouseSignIn {
  agentId: string;
  openHouseId: string;
  name: string;
  email: string;
  phone?: string;
  /** Already working with a buyer's agent. */
  hasAgent?: boolean;
  preapproved?: boolean;
  timeline?: string;
  /** How they heard about it. */
  heardFrom?: string;
  message?: string;
}

/** Sends one kiosk sign-in through submit-lead. Throws with a readable message. */
export async function submitOpenHouseSignIn(signIn: OpenHouseSignIn): Promise<void> {
  const formData: Record<string, unknown> = {};
  if (signIn.hasAgent !== undefined) formData.hasAgent = signIn.hasAgent;
  if (signIn.heardFrom) formData.heardFrom = signIn.heardFrom;

  await callEdgeFunction('submit-lead', {
    body: {
      user_id: signIn.agentId,
      lead_type: 'open_house',
      open_house_id: signIn.openHouseId,
      name: signIn.name,
      email: signIn.email,
      phone: signIn.phone || undefined,
      message: signIn.message || undefined,
      preapproved: signIn.preapproved,
      timeline: signIn.timeline || undefined,
      source: 'open_house',
      ...getLeadAttribution(),
      device: 'open_house_kiosk',
      form_data: Object.keys(formData).length > 0 ? formData : undefined,
    },
    auth: false,
  });
}
