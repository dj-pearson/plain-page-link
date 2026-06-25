/**
 * useNotifications — in-app notifications with Supabase Realtime.
 *
 * Loads the user's recent notifications, subscribes to INSERTs in real time,
 * and exposes unread count + mark-as-read / mark-all-as-read mutations.
 */

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

export type NotificationType = 'new_lead' | 'lead_scored' | 'subscription_event' | 'system_alert';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string | null;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// notifications isn't in the generated types yet — isolated cast.
const notifClient = supabase as unknown as {
  from: (t: string) => {
    select: (c: string) => {
      eq: (
        c: string,
        v: string
      ) => {
        order: (
          c: string,
          o: { ascending: boolean }
        ) => {
          limit: (n: number) => Promise<{ data: AppNotification[] | null; error: unknown }>;
        };
      };
    };
    update: (v: Record<string, unknown>) => {
      eq: (
        c: string,
        v: string
      ) => {
        is: (c: string, v: null) => Promise<{ error: unknown }>;
        select: (c: string) => Promise<{ error: unknown }>;
      };
    };
  };
};

export function useNotifications() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: ['notifications', userId],
    enabled: !!userId,
    queryFn: async (): Promise<AppNotification[]> => {
      const { data, error } = await notifClient
        .from('notifications')
        .select('id, user_id, type, title, message, data, read_at, created_at')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime subscription: refetch on any new notification for this user.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await notifClient
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
        .select('id');
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await notifClient
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
  };
}
