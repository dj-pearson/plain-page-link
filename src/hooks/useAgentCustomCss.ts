/**
 * profiles.custom_css for the signed-in agent's editor (US-514).
 *
 * A private column: read through get_own_profile (fetchOwnProfile), written
 * under the "own profile" UPDATE policy. The enforce_custom_css trigger refuses
 * more than CUSTOM_CSS_MAX_LENGTH characters, and non-empty CSS on a plan
 * without customThemes. What is stored is what the agent typed; the public page
 * renders it only through sanitizeCustomCss.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchOwnProfile } from '@/lib/ownProfile';
import { CUSTOM_CSS_MAX_LENGTH } from '@/lib/customCss';

export const agentCustomCssKey = (userId: string | undefined) =>
  ['agent-custom-css', userId] as const;

export function useAgentCustomCss() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: agentCustomCssKey(user?.id),
    enabled: !!user?.id,
    queryFn: async (): Promise<string> => {
      const { data, error } = await fetchOwnProfile();
      if (error) throw error;
      return data?.custom_css ?? '';
    },
  });

  const save = useMutation({
    mutationFn: async (css: string) => {
      if (!user?.id) throw new Error('You need to be signed in to save custom CSS.');
      if (css.length > CUSTOM_CSS_MAX_LENGTH) {
        throw new Error(
          `Custom CSS is limited to ${CUSTOM_CSS_MAX_LENGTH.toLocaleString('en-US')} characters.`
        );
      }
      const value = css.trim() ? css : null;
      const { error } = await supabase
        .from('profiles')
        .update({ custom_css: value })
        .eq('id', user.id);
      if (error) throw error;
      return value ?? '';
    },
    onSuccess: (css) => {
      queryClient.setQueryData(agentCustomCssKey(user?.id), css);
      // The owner's own public page (and its preview) picks it up next visit.
      void queryClient.invalidateQueries({ queryKey: ['profile-custom-css', user?.id ?? null] });
    },
  });

  return {
    /** The stored CSS, '' when none. */
    css: query.data ?? '',
    isLoading: query.isLoading,
    isError: query.isError,
    save,
  };
}
