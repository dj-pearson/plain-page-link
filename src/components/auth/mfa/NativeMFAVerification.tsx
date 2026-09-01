import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useNativeMFA } from '@/hooks/useNativeMFA';
import { logger } from '@/lib/logger';

interface NativeMFAVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * The sign-in second factor (US-085).
 *
 * Two paths, because the pre-US-085 enrolments cannot be carried across:
 *
 *  - A native factor: challenge it, and the session becomes aal2.
 *  - A legacy factor: the old TOTP secret is encrypted with the Edge
 *    Function's key and Supabase has no supported way to import it, so the
 *    user has to scan a new QR code. They prove possession of the OLD factor
 *    first, so a password alone can never enrol a replacement.
 */
export function NativeMFAVerification({ onSuccess, onCancel }: NativeMFAVerificationProps) {
  const { status, isLoading, challenge, enroll, migrateLegacyFactor } = useNativeMFA();
  const [code, setCode] = useState('');
  const [legacyCode, setLegacyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [migration, setMigration] = useState<{ factorId: string; uri: string } | null>(null);

  const busy =
    challenge.isPending || enroll.isPending || migrateLegacyFactor.isPending || isLoading;

  const handleChallenge = async () => {
    setError(null);
    if (!status?.factorId) return;
    try {
      await challenge.mutateAsync({ factorId: status.factorId, code });
      onSuccess();
    } catch (err) {
      logger.error('MFA challenge failed', err as Error);
      setError('That code was not accepted. Codes expire every 30 seconds — try the current one.');
      setCode('');
    }
  };

  const startMigration = async () => {
    setError(null);
    try {
      const enrolled = await enroll.mutateAsync();
      setMigration({ factorId: enrolled.factorId, uri: enrolled.totpUri });
    } catch (err) {
      logger.error('Could not start MFA migration', err as Error);
      setError('Could not start re-enrolment. Please try again.');
    }
  };

  const completeMigration = async () => {
    setError(null);
    if (!migration) return;
    try {
      await migrateLegacyFactor.mutateAsync({
        legacyCode,
        newCode: code,
        factorId: migration.factorId,
      });
      onSuccess();
    } catch (err) {
      logger.error('MFA migration failed', err as Error);
      setError(
        err instanceof Error
          ? err.message
          : 'Re-enrolment failed. Your existing authenticator still works — please try again.'
      );
      setCode('');
      setLegacyCode('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Legacy enrolment: re-enrol, authorised by the existing factor.
  if (status?.hasLegacyFactor) {
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Set up your authenticator again</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Two-factor authentication now runs through your login token rather than the app, which
            means it protects your data at the database rather than only in the browser. Your
            existing code still works — you just need to add a new entry to your authenticator.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!migration ? (
          <Button onClick={startMigration} disabled={busy} className="w-full">
            {enroll.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                Add this to your authenticator app, then enter both codes below.
              </p>
              <code className="block break-all text-xs">{migration.uri}</code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legacy-code">Code from your existing entry</Label>
              <Input
                id="legacy-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={legacyCode}
                onChange={(e) => setLegacyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-code">Code from the new entry</Label>
              <Input
                id="new-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>

            <Button
              onClick={completeMigration}
              disabled={busy || code.length !== 6 || legacyCode.length !== 6}
              className="w-full"
            >
              {migrateLegacyFactor.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finish
            </Button>
          </div>
        )}

        <Button variant="ghost" onClick={onCancel} disabled={busy} className="w-full">
          Cancel and sign out
        </Button>
      </div>
    );
  }

  // Ordinary native challenge.
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Two-factor authentication</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the six-digit code from your authenticator app.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="mfa-code">Authentication code</Label>
        <Input
          id="mfa-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && code.length === 6) handleChallenge();
          }}
          placeholder="000000"
          autoFocus
        />
      </div>

      <Button onClick={handleChallenge} disabled={busy || code.length !== 6} className="w-full">
        {challenge.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify
      </Button>

      <Button variant="ghost" onClick={onCancel} disabled={busy} className="w-full">
        Cancel and sign out
      </Button>
    </div>
  );
}
