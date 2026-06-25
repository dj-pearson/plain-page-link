/**
 * Feature flags.
 *
 * Evaluation rules (in order):
 *   1. Flag globally disabled        → false
 *   2. User explicitly targeted      → true
 *   3. rollout_percentage >= 100     → true
 *   4. rollout_percentage <= 0       → false
 *   5. No user id (anonymous)        → false (can't bucket deterministically)
 *   6. Deterministic per-user bucket → bucket < rollout_percentage
 *
 * Bucketing is deterministic per (flag, user) so a user's enrollment is stable
 * across reloads and the rollout grows monotonically as the percentage rises.
 */

import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout_percentage: number;
  user_ids: string[];
}

/** Stable 32-bit string hash (FNV-1a). */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned.
  return hash >>> 0;
}

/** Deterministic 0–99 bucket for a (flag, user) pair. */
export function rolloutBucket(flagName: string, userId: string): number {
  return hashString(`${flagName}:${userId}`) % 100;
}

/** Pure evaluation of a flag for a given user. */
export function evaluateFlag(flag: FeatureFlag, userId?: string | null): boolean {
  if (!flag.enabled) return false;
  if (userId && Array.isArray(flag.user_ids) && flag.user_ids.includes(userId)) return true;
  if (flag.rollout_percentage >= 100) return true;
  if (flag.rollout_percentage <= 0) return false;
  if (!userId) return false;
  return rolloutBucket(flag.name, userId) < flag.rollout_percentage;
}

/**
 * Fetches a single flag and evaluates it for the user. Returns false on any
 * error or missing flag (fail-closed). Prefer the `useFeatureFlag` hook in
 * components — this is for non-React call sites.
 */
export async function isFeatureEnabled(flagName: string, userId?: string | null): Promise<boolean> {
  try {
    // feature_flags isn't in the generated types yet — isolated cast.
    const { data, error } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              c: string,
              v: string
            ) => { maybeSingle: () => Promise<{ data: FeatureFlag | null; error: unknown }> };
          };
        };
      }
    )
      .from('feature_flags')
      .select('name, enabled, rollout_percentage, user_ids')
      .eq('name', flagName)
      .maybeSingle();

    if (error || !data) return false;
    return evaluateFlag(data, userId);
  } catch {
    return false;
  }
}
