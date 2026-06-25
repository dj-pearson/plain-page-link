/**
 * Notification bell — header trigger showing the unread count, opening the
 * notification dropdown.
 */

import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationDropdown } from '@/components/ui/notification-dropdown';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
        />
      </PopoverContent>
    </Popover>
  );
}
