import { Link } from 'react-router-dom';
import { PenLine } from 'lucide-react';

interface ReviewInviteProps {
  /** The profile's username — the review page is routed at /:username/review. */
  username: string;
  /** Display name, for the invitation copy. */
  agentName: string;
}

/**
 * "Worked with {name}? Leave a review" (US-113).
 *
 * The review page has existed at /:username/review since US-074, but the only
 * thing that built the URL was RequestTestimonialModal in the agent's own
 * dashboard — so a client could reach it only if the agent had already texted
 * them a link. A visitor already on the profile had no way in, which is exactly
 * the visitor most likely to have worked with them.
 *
 * A real <Link>, not a click handler on a div: middle-click, Cmd-click and
 * "copy link address" all have to work, and it has to be reachable by keyboard.
 */
export function ReviewInvite({ username, agentName }: ReviewInviteProps) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <span>Worked with {agentName}?</span>
      <Link
        to={`/${username}/review`}
        className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-4 decoration-muted-foreground/50 hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        <PenLine className="h-4 w-4" aria-hidden="true" />
        Leave a review
      </Link>
    </div>
  );
}
