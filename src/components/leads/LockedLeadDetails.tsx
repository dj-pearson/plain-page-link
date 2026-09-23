/**
 * What an agent sees instead of a lead's contact details once the lead is past
 * their plan's monthly allowance (20260923000003).
 *
 * The blurred text is a placeholder, not the real address run through a CSS
 * filter: pii-crypto returned nothing for this lead, so there is nothing real
 * to blur and nothing for devtools to reveal. The blur only says "there is
 * something here", and the link says how to see it.
 */
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { UPGRADE_PATH } from '@/lib/planLimits';
import { cn } from '@/lib/utils';

interface LockedLeadDetailsProps {
  /** Show the placeholder message line too, for views that show the message. */
  withMessage?: boolean;
  className?: string;
}

export function LockedLeadDetails({ withMessage = false, className }: LockedLeadDetailsProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div aria-hidden="true" className="select-none blur-[5px]">
        <p className="text-sm">jordan.smith@example.com</p>
        <p className="text-sm">(555) 014-2398</p>
        {withMessage && (
          <p className="text-sm">
            Hi! I'd love to see this home this weekend if it's still available.
          </p>
        )}
      </div>
      <p className="flex flex-wrap items-center gap-1.5 text-sm">
        <Lock className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" aria-hidden="true" />
        <span className="text-foreground">Past this month's lead allowance.</span>
        <Link
          to={UPGRADE_PATH}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-primary hover:underline"
        >
          Upgrade to see their details
        </Link>
      </p>
    </div>
  );
}
