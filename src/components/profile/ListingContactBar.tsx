/**
 * The contact bar pinned to the bottom of a listing page on a phone (US-361).
 *
 * On a narrow screen the listing page stacks the gallery, the facts and the
 * description before the Showing button in ListingDetails, so a visitor who
 * scrolled down to read about the home had no way to act on it without
 * scrolling back. This bar keeps the two actions that matter on the page in
 * reach the whole time: ask about this home, and ask to see it. Both open the
 * page's own forms, which attach the listing, so the lead reaches the CRM with
 * listing_id set (US-096).
 *
 * Below 640px only (`sm:hidden`): from `sm` up the listing's side column shows
 * the same buttons beside the description.
 */
import { Phone } from 'lucide-react';
import { trackContactTap } from '@/lib/analyticsEvents';

interface ListingContactBarProps {
  /** The agent's id; undefined while the owner previews, so nothing is counted. */
  profileId: string | undefined;
  agentName: string;
  /** Shown as a Call button when set. */
  phone?: string | null;
  /** Opens the lead form with this listing attached. */
  onAsk: () => void;
  /** Opens Calendly or the showing request; omitted for a sold home. */
  onRequestShowing?: () => void;
  /** Whether the showing opens Calendly (changes the label only). */
  hasCalendly?: boolean;
}

/** The height the page reserves below its content so the bar hides nothing. */
export const LISTING_CONTACT_BAR_SPACER = 'pb-24 sm:pb-8';

// The profile theme's own colours (useProfileTheme), not the dashboard's
// --background/--border tokens, so the bar matches a dark or tinted theme.
const HAIRLINE = 'hsl(var(--theme-text, 222 47% 11%) / 0.15)';
const BAR_STYLE = {
  backgroundColor: 'hsl(var(--theme-background, 217 33% 97%) / 0.97)',
  borderTopColor: HAIRLINE,
  paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))',
};
const OUTLINE_STYLE = { borderColor: HAIRLINE };
const OUTLINE =
  'inline-flex min-h-[48px] items-center justify-center rounded-lg border text-inherit hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const SOLID =
  'inline-flex min-h-[48px] flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function ListingContactBar({
  profileId,
  agentName,
  phone,
  onAsk,
  onRequestShowing,
  hasCalendly = false,
}: ListingContactBarProps) {
  const tel = phone?.replace(/[^\d+]/g, '') ?? '';

  // Fire-and-forget, as on the profile's sticky bar (US-115): the tap is the
  // conversion signal, the action must not wait on the insert.
  const track = (method: string) => void trackContactTap(profileId, method);

  const showingLabel = hasCalendly ? 'Schedule a showing' : 'Request a showing';

  return (
    <div
      role="region"
      aria-label="Contact about this home"
      className="fixed inset-x-0 bottom-0 z-40 border-t px-3 pt-2 sm:hidden"
      style={BAR_STYLE}
      data-testid="listing-contact-bar"
    >
      <div className="flex items-stretch gap-2">
        {tel && (
          <a
            href={`tel:${tel}`}
            onClick={() => track('phone')}
            aria-label={`Call ${agentName}`}
            className={`${OUTLINE} min-w-[48px]`}
            style={OUTLINE_STYLE}
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            track('contact');
            onAsk();
          }}
          className={onRequestShowing ? `${OUTLINE} flex-1 px-3 text-sm font-medium` : SOLID}
          style={onRequestShowing ? OUTLINE_STYLE : undefined}
        >
          Ask a question
        </button>
        {onRequestShowing && (
          <button
            type="button"
            onClick={() => {
              track('schedule');
              onRequestShowing();
            }}
            className={SOLID}
          >
            {showingLabel}
          </button>
        )}
      </div>
    </div>
  );
}
