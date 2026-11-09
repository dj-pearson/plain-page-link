import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Phone, MessageSquare, Mail, Calendar, Home, X, ChevronUp } from 'lucide-react';
import type { PublicProfile } from '@/types/profile';
import { cn } from '@/lib/utils';
import { trackContactTap } from '@/lib/analyticsEvents';
import { AvatarImage } from './AvatarImage';
import { CONTACT_BUTTON_BOTTOM, QUICK_ACTIONS_PANEL_BOTTOM } from './stickyActionBarLayout';

interface StickyActionBarProps {
  profile: PublicProfile;
  onScheduleShowing?: () => void;
  onGetHomeValue?: () => void;
  onContactFormOpen?: () => void;
}

export function StickyActionBar({
  profile,
  onScheduleShowing,
  onGetHomeValue,
  onContactFormOpen,
}: StickyActionBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  // No slide-ins, springs or tap-scale under prefers-reduced-motion (US-260):
  // the panel fades, the desktop card is simply there.
  const reduceMotion = useReducedMotion() ?? false;

  const handleAction = (method: string, value?: string) => {
    // The sticky bar is the main contact surface on a phone, and it reported
    // nothing at all — not even to the console, as ContactButtons did. Recorded
    // before the navigation, because `tel:` and `mailto:` leave the page
    // (US-115). Fire-and-forget: the call must not wait on the insert.
    void trackContactTap(profile.id, method);

    if (method === 'phone' && value) {
      window.location.href = `tel:${value}`;
    } else if (method === 'email' && value) {
      window.location.href = `mailto:${value}`;
    } else if (method === 'sms' && value) {
      window.location.href = `sms:${value}`;
    } else if (method === 'schedule') {
      onScheduleShowing?.();
    } else if (method === 'valuation') {
      onGetHomeValue?.();
    } else if (method === 'contact') {
      onContactFormOpen?.();
    }
  };

  // Define available actions based on profile.
  //
  // Every button used to carry its own fixed hue (blue, green, purple, orange,
  // indigo), so the bar on a page themed in forest green or black still read as
  // a rainbow of stock colours, and the first thing a phone visitor saw ignored
  // the agent's theme (US-464). The colours now come from the theme alone:
  // the first action is filled with the theme primary (--primary, which
  // PROFILE_MAIN_STYLE points at --theme-primary on the public page, with a
  // contrast-picked foreground), the rest are a light tint of it carrying
  // near-black text, so contrast holds whatever colour the agent picked.
  const actions = [
    profile.phone && {
      id: 'phone',
      label: 'Call',
      icon: Phone,
      action: () => handleAction('phone', profile.phone ?? ''),
    },
    profile.phone &&
      profile.sms_enabled && {
        id: 'sms',
        label: 'Text',
        icon: MessageSquare,
        action: () => handleAction('sms', profile.phone ?? ''),
      },
    profile.email_display && {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: () => handleAction('email', profile.email_display ?? ''),
    },
    onScheduleShowing && {
      id: 'schedule',
      label: 'Schedule',
      icon: Calendar,
      action: () => handleAction('schedule'),
    },
    onGetHomeValue && {
      id: 'valuation',
      label: 'Home Value',
      icon: Home,
      action: () => handleAction('valuation'),
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    action: () => void;
  }>;

  const actionColor = (index: number) =>
    index === 0
      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
      : 'bg-primary/10 text-gray-900 hover:bg-primary/20';

  // If no actions available, don't render
  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile - Bottom Action Bar */}
      {/* xl:hidden, paired with the desktop panel's hidden xl:block below —
          one of the two at every width, neither on top of the content. */}
      <div className="xl:hidden">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={reduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
              animate={reduceMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { y: 100, opacity: 0 }}
              transition={
                reduceMotion ? { duration: 0.15 } : { type: 'spring', damping: 25, stiffness: 300 }
              }
              // Placed from the button's own geometry, so it clears the button
              // whatever the home-indicator inset (US-660).
              className="fixed left-0 right-0 z-50 px-4"
              style={{ bottom: QUICK_ACTIONS_PANEL_BOTTOM }}
              data-testid="quick-actions-panel"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Close quick actions"
                  >
                    <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => {
                          action.action();
                          setIsExpanded(false);
                        }}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl font-semibold transition-colors',
                          actionColor(index)
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden="true" />
                        <span className="text-sm">{action.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile FAB */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'fixed right-4 z-50 rounded-full px-6 py-4 shadow-2xl transition-all flex items-center gap-2 min-h-[56px]',
            isExpanded ? 'bg-gray-900 text-white' : 'bg-primary text-primary-foreground'
          )}
          whileTap={reduceMotion ? undefined : { scale: 0.95 }}
          style={{ bottom: CONTACT_BUTTON_BOTTOM }}
          aria-label={isExpanded ? 'Close quick actions' : 'Open quick actions'}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-5 w-5" />
              <span className="font-semibold text-sm">Close</span>
            </>
          ) : (
            <>
              <Phone className="h-5 w-5" />
              <span className="font-semibold text-sm">Contact</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Desktop - Floating Side Panel.
          Shown from xl (1280px), not md (768px). At md the content column
          reaches the full width, so a 200px panel pinned to right-6 sat on top
          of it from 768px to about 1150px (US-112). The mobile bar below is
          xl:hidden to match, so exactly one of the two is present at every
          width — the pair used to leave no gap only by overlapping. */}
      <div className="hidden xl:block">
        <motion.div
          initial={reduceMotion ? false : { x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-40"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-4 w-[200px]">
            <h3 className="font-semibold text-gray-900 mb-3 text-center text-sm">Quick Contact</h3>
            <div className="space-y-2">
              {actions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={action.action}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-colors text-sm',
                      actionColor(index)
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Agent Info */}
            <div className="mt-4 pt-4 border-t border-gray-200 text-center">
              {profile.avatar_url ? (
                <AvatarImage
                  url={profile.avatar_url}
                  width={48}
                  height={48}
                  alt={profile.full_name || profile.username}
                  className="w-12 h-12 rounded-full mx-auto mb-2 object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full mx-auto mb-2 bg-primary flex items-center justify-center border-2 border-gray-200">
                  <span className="text-sm font-bold text-primary-foreground">
                    {(profile.full_name || profile.username || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              )}
              <p className="text-xs font-medium text-gray-900">
                {profile.full_name || profile.username}
              </p>
              {/* "Responds in < 1 hour" stood here as literal text for every
                  agent, with nothing behind it (US-111). The profile header
                  shows a response time when one can be computed from real
                  first-response data; there is nothing honest to say here. */}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
