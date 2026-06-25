/**
 * Notification dropdown — list of recent notifications with mark-as-read and
 * mark-all-as-read. Rendered inside the bell's popover.
 */

import { CheckCheck, Inbox } from 'lucide-react';
import type { AppNotification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  return (
    <div className="flex max-h-[420px] flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-semibold text-foreground">Notifications</span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <CheckCheck className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
            <Inbox className="h-8 w-8 opacity-50" />
            You&apos;re all caught up.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => !n.read_at && onMarkAsRead(n.id)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-accent/50',
                    !n.read_at && 'bg-primary/5'
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                    {!n.read_at && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {n.message && (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{n.message}</span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {relativeTime(n.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
