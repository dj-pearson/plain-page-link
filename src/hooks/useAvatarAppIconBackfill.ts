/**
 * Runs the home-screen icon backfill (US-492) once the dashboard has settled.
 * See src/lib/backfillAvatarAppIcons.ts.
 */
import { useEffect } from 'react';
import { supabaseConfig } from '@/integrations/supabase/client';
import { backfillAvatarAppIcons } from '@/lib/backfillAvatarAppIcons';
import { storeAvatarAppIcons } from '@/lib/storeAvatarAppIcons';

/** Out of the way of the dashboard's own first requests. */
const START_DELAY_MS = 4000;

export function useAvatarAppIconBackfill(
  userId: string | null | undefined,
  avatarUrl: string | null | undefined
): void {
  useEffect(() => {
    if (!userId || !avatarUrl) return;
    const timer = setTimeout(() => {
      void backfillAvatarAppIcons(userId, avatarUrl, {
        storageBase: supabaseConfig.url,
        fetchImpl: (input, init) => fetch(input, init),
        store: (uid, objectName, photo) => storeAvatarAppIcons('avatars', uid, objectName, photo),
      });
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [userId, avatarUrl]);
}
