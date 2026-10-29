import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { logAuditEvent } from '@/lib/audit';
import { encryptPII, decryptOwnProfilePhone, isEncryptedPII } from '@/lib/pii';
import { logger } from '@/lib/logger';
import { toProfile } from '@/types/profile';
import { fetchOwnProfile } from '@/lib/ownProfile';
import type { Profile } from '@/types/profile';

/**
 * The agent profile, re-exported from the one place it is defined.
 *
 * This file used to declare a fourth Profile by hand, listing 30 of the 42
 * columns on `profiles` and typing every optional one `?: string` rather than
 * `string | null`. It omitted calendly_url, seo_title, seo_description,
 * sms_enabled, custom_css, custom_domain, is_published, zapier_webhook_url,
 * onboarding_completed_at, notification_preferences and the three counters —
 * and the dashboard's own profile form reads and writes calendly_url,
 * seo_title and seo_description, so `Partial<Profile>` silently dropped all
 * three from every save. `data as Profile` on the query hid it.
 */
export type { Profile, ProfileRow } from '@/types/profile';

export function useProfile() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // US-235: through get_own_profile — authenticated can select only the
      // public columns of profiles, and this needs the owner's private ones.
      const { data, error } = await fetchOwnProfile();

      if (error) throw error;
      const profileData = toProfile(data);
      // The function chooses the row from the JWT rather than being handed a
      // ciphertext — pii-crypto used to decrypt whatever it was given, for
      // anyone logged in (US-119). pii-crypto passes legacy plaintext through.
      //
      // US-237: when it cannot decrypt, the phone is unknown, not the stored
      // column. That column is ciphertext; it used to stand in here, so the
      // form showed `enc:v1:…` and a save encrypted the ciphertext again. The
      // rest of the profile still loads, and phoneUnavailable tells the form
      // to leave phone out of a save unless the agent types a new one.
      let phone: string | null = null;
      let phoneUnavailable = false;
      try {
        phone = await decryptOwnProfilePhone();
      } catch (decryptError) {
        logger.error('Could not decrypt the profile phone number', decryptError);
        phoneUnavailable = true;
      }
      return { ...profileData, phone, phoneUnavailable };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache retention
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Encrypt PII fields before save (transition: encrypts in place;
      // decryptPII on read passes any legacy plaintext through).
      const encryptedUpdates: Partial<Profile> = { ...updates };
      if ('phone' in updates) {
        if (isEncryptedPII(updates.phone)) {
          // Already ciphertext — a read that never decrypted. Encrypting it
          // again would bury the number under a second envelope (US-237).
          delete encryptedUpdates.phone;
        } else {
          encryptedUpdates.phone = await encryptPII(updates.phone ?? null);
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(encryptedUpdates)
        .eq('id', user.id)
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, updates) => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      logAuditEvent('profile_update', {
        resourceType: 'profile',
        resourceId: user?.id,
        details: { fields: Object.keys(updates) },
      });
    },
  });

  return {
    profile,
    isLoading,
    isError,
    error,
    refetch,
    updateProfile,
  };
}
