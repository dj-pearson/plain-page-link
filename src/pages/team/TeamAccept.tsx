import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { edgeFunctions } from '@/lib/edgeFunctions';

/**
 * /team/accept?team=<id>&token=<token> — where a team invite email lands (US-226).
 *
 * The Team plan's invites could never be accepted: the teams function had an
 * 'accept' action and nothing in the app called it. RequireAuth sends a
 * signed-out invitee to log in (or register) and back here; this page redeems
 * the one-time token exactly once.
 */
type State = 'working' | 'accepted' | 'invalid' | 'failed';

export default function TeamAccept() {
  const [params] = useSearchParams();
  const teamId = params.get('team');
  const token = params.get('token');
  const [state, setState] = useState<State>(teamId && token ? 'working' : 'invalid');
  const started = useRef(false);

  useEffect(() => {
    if (!teamId || !token || started.current) return;
    started.current = true;
    edgeFunctions
      .invoke('teams', { body: { action: 'accept', teamId, token } })
      .then(({ error }) => {
        if (!error) setState('accepted');
        else setState((error as { status?: number }).status === 404 ? 'invalid' : 'failed');
      })
      .catch(() => setState('failed'));
  }, [teamId, token]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEOHead title="Join your team | AgentBio" description="Accept your team invitation." noindex />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        {state === 'working' && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">Joining the team…</h1>
          </>
        )}
        {state === 'accepted' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">You&apos;re on the team</h1>
            <p className="text-muted-foreground">
              Leads your team routes to you will appear in your Leads list under &ldquo;Assigned to me&rdquo;.
            </p>
            <Button asChild className="min-h-[44px]">
              <Link to="/dashboard/leads?assigned=me">Go to my leads</Link>
            </Button>
          </>
        )}
        {(state === 'invalid' || state === 'failed') && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground">
              {state === 'invalid' ? 'This invitation is not valid' : 'Something went wrong'}
            </h1>
            <p className="text-muted-foreground">
              {state === 'invalid'
                ? 'It may have been used already. Ask your team owner to send a new one.'
                : 'Please try the link again in a moment.'}
            </p>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
