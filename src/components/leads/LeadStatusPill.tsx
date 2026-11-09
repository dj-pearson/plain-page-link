/**
 * A lead's status as a small coloured pill, in the colours of its group.
 *
 * Overview's Recent Leads used to colour 'new' blue, 'contacted' yellow and
 * every other status green, with light-only classes (US-602). So a lost lead
 * read as a win, the raw value showed instead of its label ("nurturing"), and
 * on the dark dashboard each pill was a pale patch. The tone now follows the
 * same grouping as the Leads chips (new / in progress / won / lost), and each
 * tone has a dark-mode pair; LeadStatusPill.test.tsx checks both for WCAG AA.
 */
import { cn } from '@/lib/utils';
import { CLOSED_STATUSES, WON_STATUSES, leadStatusLabel } from '@/lib/leadStatus';

export type LeadStatusTone = 'new' | 'in_progress' | 'won' | 'lost';

/** Which group a stored status belongs to; an unknown value reads as in progress. */
export function leadStatusTone(status: string | null | undefined): LeadStatusTone {
  const value = status ?? 'new';
  if (value === 'new') return 'new';
  if ((WON_STATUSES as readonly string[]).includes(value)) return 'won';
  if (CLOSED_STATUSES.has(value)) return 'lost';
  // contacted, qualified, nurturing — and any value outside the vocabulary.
  return 'in_progress';
}

export const LEAD_STATUS_TONE_CLASSES: Record<LeadStatusTone, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
  won: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
  lost: 'bg-muted text-muted-foreground',
};

interface LeadStatusPillProps {
  status: string | null | undefined;
  className?: string;
}

export function LeadStatusPill({ status, className }: LeadStatusPillProps) {
  const tone = leadStatusTone(status);
  return (
    <span
      data-tone={tone}
      className={cn(
        'px-2 py-1 text-xs rounded-full flex-shrink-0 font-medium',
        LEAD_STATUS_TONE_CLASSES[tone],
        className
      )}
    >
      {leadStatusLabel(status)}
    </span>
  );
}
