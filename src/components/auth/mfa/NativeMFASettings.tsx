import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useNativeMFA } from '@/hooks/useNativeMFA';
import { logger } from '@/lib/logger';

/**
 * Enrol and remove a second factor (US-085).
 *
 * Enrolment goes through Supabase's own mfa.enroll/challenge/verify, so the
 * factor lives in auth.mfa_factors and completing it upgrades the session to
 * aal2. The previous implementation stored its own TOTP secret and could only
 * ever set a boolean the client was free to ignore.
 */
export function NativeMFASettings() {
  const { status, isLoading, enroll, enrollVerify, unenroll } = useNativeMFA();
  const [enrollment, setEnrollment] = useState<{
    factorId: string;
    uri: string;
    secret: string;
  } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const busy = enroll.isPending || enrollVerify.isPending || unenroll.isPending;

  const begin = async () => {
    setError(null);
    try {
      const data = await enroll.mutateAsync();
      setEnrollment({ factorId: data.factorId, uri: data.totpUri, secret: data.secret });
    } catch (err) {
      logger.error('MFA enrolment failed to start', err as Error);
      setError('Could not start setup. Please try again.');
    }
  };

  const confirm = async () => {
    setError(null);
    if (!enrollment) return;
    try {
      await enrollVerify.mutateAsync({ factorId: enrollment.factorId, code });
      setEnrollment(null);
      setCode('');
    } catch (err) {
      logger.error('MFA enrolment verification failed', err as Error);
      setError('That code was not accepted. Codes expire every 30 seconds — try the current one.');
      setCode('');
    }
  };

  const remove = async () => {
    setError(null);
    if (!status?.factorId) return;
    try {
      await unenroll.mutateAsync(status.factorId);
    } catch (err) {
      logger.error('MFA unenrol failed', err as Error);
      setError('Could not remove the authenticator. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              {status?.isEnrolled ? (
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-muted-foreground" />
              )}
              Two-factor authentication
            </CardTitle>
            <CardDescription>
              An authenticator app code, required at sign-in as well as your password.
            </CardDescription>
          </div>
          <Badge variant={status?.isEnrolled ? 'default' : 'secondary'}>
            {status?.isEnrolled ? 'On' : 'Off'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {status?.hasLegacyFactor && (
          <Alert>
            <AlertDescription>
              Your authenticator needs setting up again — you will be prompted the next time you
              sign in. Your existing code keeps working until then.
            </AlertDescription>
          </Alert>
        )}

        {status?.isEnrolled ? (
          <Button variant="outline" onClick={remove} disabled={busy}>
            {unenroll.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Turn off
          </Button>
        ) : !enrollment ? (
          <Button onClick={begin} disabled={busy}>
            {enroll.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set up
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Add this to your authenticator app, then enter the code it shows.
              </p>
              <code className="block break-all text-xs">{enrollment.uri}</code>
              <p className="text-xs text-muted-foreground">
                Or enter the key manually: <code className="font-mono">{enrollment.secret}</code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="enrol-code">Authentication code</Label>
              <Input
                id="enrol-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={confirm} disabled={busy || code.length !== 6}>
                {enrollVerify.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEnrollment(null);
                  setCode('');
                }}
                disabled={busy}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
