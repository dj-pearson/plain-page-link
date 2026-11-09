import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { callEdgeFunction, EdgeFunctionError } from '@/lib/edgeFunctions';
import { logger } from '@/lib/logger';

/**
 * /unsubscribe?l=<list>&c=<capture>&t=<token>: where the "Unsubscribe" link in
 * the free-tool emails lands (US-425).
 *
 * The listing drip used to link /unsubscribe with no parameters, and the app
 * had no such route, so the link opened the profile 404. The bio drip had no
 * link at all.
 *
 * The page asks for one click before it unsubscribes. Mail security scanners
 * and link prefetchers open every link in an email, and an opt-out they
 * trigger is not one the person made. A mail client's own Unsubscribe button
 * posts straight to email-unsubscribe and never comes here.
 */
const LIST_NAMES: Record<string, string> = {
  listing: 'the listing description generator emails',
  bio: 'the Instagram bio analyzer emails',
};

type State = 'ready' | 'working' | 'done' | 'invalid' | 'failed';

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const list = params.get('l') ?? '';
  const captureId = params.get('c') ?? '';
  const token = params.get('t') ?? '';
  const complete = Boolean(LIST_NAMES[list] && captureId && token);
  const [state, setState] = useState<State>(complete ? 'ready' : 'invalid');

  const unsubscribe = async () => {
    setState('working');
    try {
      await callEdgeFunction('email-unsubscribe', {
        body: { list, captureId, token },
        auth: false,
      });
      setState('done');
    } catch (error) {
      const status = error instanceof EdgeFunctionError ? error.status : undefined;
      if (status === 400 || status === 403) {
        setState('invalid');
      } else {
        logger.error('Unsubscribe failed', error, { action: 'email_unsubscribe' });
        setState('failed');
      }
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <SEOHead
        title="Unsubscribe | AgentBio"
        description="Stop emails from AgentBio."
        noindex
        nofollow
      />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center space-y-4">
        {(state === 'ready' || state === 'working') && (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              Unsubscribe from AgentBio emails
            </h1>
            <p className="text-muted-foreground">
              You signed up for {LIST_NAMES[list]}. Unsubscribe and we will not send marketing email
              to this address again, from this tool or any other.
            </p>
            <Button
              onClick={unsubscribe}
              disabled={state === 'working'}
              className="min-h-[44px] w-full"
            >
              {state === 'working' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Unsubscribing…
                </>
              ) : (
                'Unsubscribe'
              )}
            </Button>
          </>
        )}
        {state === 'done' && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground" role="status">
              You&apos;re unsubscribed
            </h1>
            <p className="text-muted-foreground">
              We will not send you any more of these emails. If one was already on its way, it may
              still arrive today.
            </p>
            <Button asChild variant="outline" className="min-h-[44px]">
              <Link to="/">Go to AgentBio</Link>
            </Button>
          </>
        )}
        {(state === 'invalid' || state === 'failed') && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
            <h1 className="text-xl font-semibold text-foreground" role="alert">
              {state === 'invalid' ? 'This unsubscribe link is not valid' : 'Something went wrong'}
            </h1>
            <p className="text-muted-foreground">
              {state === 'invalid' ? (
                <>
                  Use the Unsubscribe link at the bottom of the email you received, or email{' '}
                  <a className="underline" href="mailto:support@agentbio.net?subject=Unsubscribe">
                    support@agentbio.net
                  </a>{' '}
                  and we will remove you.
                </>
              ) : (
                'Please try again in a moment.'
              )}
            </p>
            {state === 'failed' && (
              <Button onClick={unsubscribe} variant="outline" className="min-h-[44px]">
                Try again
              </Button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
