import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validateUsername } from "@/lib/usernameValidation";
import { debounce } from "lodash";

export const useUsernameCheck = () => {
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
        setError(validation.error || "Invalid username");
        setIsAvailable(false);
        setIsChecking(false);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          'check-username',
          {
            body: { username },
          }
        );

        if (functionError) throw functionError;

        if (data.available) {
          setIsAvailable(true);
          setError(null);
        } else {
          setIsAvailable(false);
          setError("Username is already taken");
        }
      } catch (err) {
        setError("Failed to check username availability");
        setIsAvailable(false);
      } finally {
        setIsChecking(false);
      }
    }, 500),
    []
  );

  return {
    checkUsername,
    isChecking,
    error,
    isAvailable,
  };
};