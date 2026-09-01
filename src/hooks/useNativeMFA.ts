import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/lib/logger';

/**
 * MFA through Supabase's own enrol/challenge/verify (US-085).
 *
 * The custom implementation this replaces could not enforce anything. It ran
 * entirely after signInWithPassword had already issued a full session, and
 * `requiresMFA` / `mfaVerified` were ordinary Zustand state — so someone with
 * the password and no TOTP already held a working access_token. They could
 * call PostgREST directly, or simply run
 * `useAuthStore.setState({ mfaVerified: true })` in a console.
 *
 * Native MFA moves the decision into the token. signInWithPassword still
 * returns a session, but it is an **aal1** session; only a successful
 * mfa.verify() upgrades it to aal2. RLS gated on the `aal` claim therefore
 * refuses the pre-challenge token no matter what the client believes about
 * itself, and no amount of local state can forge it.
 *
 * The legacy tables (user_mfa_settings, mfa_temp_codes, mfa_trusted_devices,
 * mfa_verification_logs) and the setup-mfa / verify-mfa / disable-mfa
 * functions stay only as long as the re-enrolment bridge below needs them.
 * See migrateLegacyFactor.
 */

/** The assurance level of the current session, straight from the token. */
export type AssuranceLevel = 'aal1' | 'aal2';

export interface MFAStatus {
  /** What this session currently holds. */
  currentLevel: AssuranceLevel | null;
  /** What it could hold — 'aal2' once a factor is enrolled. */
  nextLevel: AssuranceLevel | null;
  /** A verified TOTP factor exists on the account. */
  isEnrolled: boolean;
  /** Enrolled, but this session has not completed the challenge yet. */
  needsChallenge: boolean;
  /** Enrolled under the pre-US-085 custom system and not yet migrated. */
  hasLegacyFactor: boolean;
  factorId: string | null;
}

export interface NativeEnrollment {
  factorId: string;
  /** otpauth:// URI for the authenticator app. */
  totpUri: string;
  /** The shared secret, for manual entry. */
  secret: string;
  qrCode: string;
}

/**
 * Reads assurance level and factors from the session itself.
 *
 * getAuthenticatorAssuranceLevel() reports what the JWT actually carries, so
 * this cannot drift from what RLS will decide — which is the whole point of
 * the story.
 */
async function readMFAStatus(userId: string | undefined): Promise<MFAStatus> {
  const empty: MFAStatus = {
    currentLevel: null,
    nextLevel: null,
    isEnrolled: false,
    needsChallenge: false,
    hasLegacyFactor: false,
    factorId: null,
  };

  if (!userId) return empty;

  const [{ data: aal, error: aalError }, { data: factors, error: factorsError }] =
    await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);

  if (aalError) throw aalError;
  if (factorsError) throw factorsError;

  const verifiedTotp = factors?.totp?.find((factor) => factor.status === 'verified') ?? null;

  // The legacy row only matters while it is the user's ONLY factor: once they
  // have re-enrolled natively, a leftover row must not keep prompting them.
  let hasLegacyFactor = false;
  if (!verifiedTotp) {
    const { data: legacy } = await supabase
      .from('user_mfa_settings')
      .select('mfa_enabled, verified_at')
      .eq('user_id', userId)
      .maybeSingle();
    hasLegacyFactor = !!(legacy?.mfa_enabled && legacy?.verified_at);
  }

  const currentLevel = (aal?.currentLevel as AssuranceLevel | null) ?? null;
  const nextLevel = (aal?.nextLevel as AssuranceLevel | null) ?? null;

  return {
    currentLevel,
    nextLevel,
    isEnrolled: !!verifiedTotp,
    needsChallenge: !!verifiedTotp && nextLevel === 'aal2' && currentLevel === 'aal1',
    hasLegacyFactor,
    factorId: verifiedTotp?.id ?? null,
  };
}

export function useNativeMFA() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: status,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['mfa-status', user?.id],
    queryFn: () => readMFAStatus(user?.id),
    enabled: !!user?.id,
    // The token's AAL changes on verify; never serve a stale answer to a
    // component deciding whether to let someone through.
    staleTime: 0,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['mfa-status', user?.id] });
  }, [queryClient, user?.id]);

  /** Starts enrolment. The factor is unverified until enrollVerify succeeds. */
  const enroll = useMutation({
    mutationFn: async (): Promise<NativeEnrollment> => {
      // An abandoned enrolment leaves an unverified factor behind, and Supabase
      // rejects a second enrolment with the same friendly name. Clear them
      // first so a user who closed the dialog can simply start again.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const stale = (existing?.totp ?? []).filter((factor) => factor.status !== 'verified');
      for (const factor of stale) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'AgentBio TOTP',
      });
      if (error) throw error;

      return {
        factorId: data.id,
        totpUri: data.totp.uri,
        secret: data.totp.secret,
        qrCode: data.totp.qr_code,
      };
    },
  });

  /** Completes enrolment. On success the session is already aal2. */
  const enrollVerify = useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;
    },
    onSuccess: invalidate,
  });

  /** The sign-in challenge: upgrades an aal1 session to aal2. */
  const challenge = useMutation({
    mutationFn: async ({ factorId, code }: { factorId: string; code: string }) => {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;
    },
    onSuccess: invalidate,
  });

  const unenroll = useMutation({
    mutationFn: async (factorId: string) => {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /**
   * Moves a pre-US-085 enrolment onto a native factor.
   *
   * The old TOTP secret cannot be transplanted: it is encrypted with
   * PII_ENCRYPTION_KEY inside the Edge Function, and Supabase's factor table
   * has no supported write path other than mfa.enroll(), which mints its own
   * secret. So the user does have to scan a new QR code.
   *
   * They are not, however, asked to do it on the strength of their password
   * alone — that would hand anyone holding just the password the ability to
   * enrol a new factor, which is precisely the protection these users opted
   * into. The old code is verified first, through the legacy verify-mfa
   * function, and only then is the native factor enrolled and the legacy row
   * retired. Possession of the original factor is still proven exactly once.
   */
  const migrateLegacyFactor = useMutation({
    mutationFn: async ({
      legacyCode,
      newCode,
      factorId,
    }: {
      legacyCode: string;
      newCode: string;
      factorId: string;
    }) => {
      // 1. Prove possession of the existing factor.
      const response = await edgeFunctions.invoke('verify-mfa', {
        body: { code: legacyCode },
      });
      if (response.error) throw response.error;
      if (!response.data?.verified) {
        throw new Error('That code did not match your existing authenticator.');
      }

      // 2. Enrol and verify the native factor. Only now does the session
      //    become aal2.
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: newCode,
      });
      if (verifyError) throw verifyError;

      // 3. Retire the legacy enrolment. Deliberately last: if anything above
      //    failed the user still has their old factor and can retry.
      const disable = await edgeFunctions.invoke('disable-mfa', {
        body: { code: legacyCode, reason: 'migrated_to_native_mfa' },
      });
      if (disable.error) {
        // The native factor is live and is what the token now reflects, so
        // this is not worth failing the migration over — but it does leave a
        // stale row, so it must be visible.
        logger.error('Native MFA enrolled but legacy row could not be cleared', disable.error);
      }
    },
    onSuccess: invalidate,
  });

  return {
    status: status ?? null,
    isLoading,
    refetch,
    enroll,
    enrollVerify,
    challenge,
    unenroll,
    migrateLegacyFactor,
  };
}
