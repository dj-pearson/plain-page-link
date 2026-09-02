import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validateUsername } from '@/lib/usernameValidation';
import { debounce } from '@/lib/utils';

/**
 * @param currentUserId the agent doing the editing, so their own current
 *        username does not read as taken. Omitted at signup, where there is no
 *        user yet.
 */
export const useUsernameCheck = (currentUserId?: string) => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (!username) {
        setError(null);
        setIsAvailable(null);
        return;
      }

      // First, validate format
      const validation = validateUsername(username);
      if (!validation.valid) {
        setError(validation.error || 'Invalid username');
        setIsAvailable(false);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        // Through the SECURITY DEFINER RPC, not a direct profiles query.
        //
        // The direct query is what this used to do, and it could not see the
        // rows that matter: since 20260808000002 the public SELECT policy on
        // `profiles` is scoped to published rows, so a username held by an
        // unpublished profile — which is every account that has not published
        // yet, including every account mid-signup — came back as no row and the
        // field said "Username is available". The insert then failed on the
        // unique index and the agent saw a generic error naming no field
        // (US-117).
        const { data, error: queryError } = await supabase.rpc('check_username_available', {
          _username: username.toLowerCase(),
          // undefined, not null, and a plain key rather than a spread: JSON
          // drops an undefined value so the parameter falls back to its
          // default at signup, and verify-schema's rpc-argument check can only
          // read a literal object.
          _current_user_id: currentUserId ?? undefined,
        });

        if (queryError) {
          throw queryError;
        }

        if (data === true) {
          setIsAvailable(true);
          setError(null);
        } else {
          setIsAvailable(false);
          setError('Username is already taken');
        }
      } catch (err) {
        setError('Failed to check username availability');
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }, 500),
    [currentUserId]
  );

  return {
    checkUsername,
    isChecking,
    error,
    isAvailable,
  };
};
