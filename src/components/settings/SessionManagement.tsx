/**
 * Session Management Component
 * Displays active sessions and allows users to revoke them
 */

import { useState } from 'react';
import { Monitor, Smartphone, Tablet, MoreVertical, LogOut, Shield, RefreshCw } from 'lucide-react';
import { useSessions, Session } from '@/hooks/useSessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function SessionManagement() {
  const {
    sessions,
    totalSessions,
    isLoading,
    error,
    refetch,
    revokeSession,
    revokeAllOtherSessions,
    isRevoking,
    isRevokingAll,
    formatSessionInfo,
    formatRelativeTime,
  } = useSessions();

  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);

  const getDeviceIcon = (deviceType: Session['device_type']) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-5 w-5" />;
      case 'tablet':
        return <Tablet className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  const handleRevokeSession = () => {
    if (sessionToRevoke) {
      revokeSession(sessionToRevoke.id);
      setSessionToRevoke(null);
    }
  };

  const handleRevokeAllOthers = () => {
    revokeAllOtherSessions();
    setShowRevokeAllDialog(false);
  };

  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage devices and browsers where you're signed in
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && sessions.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading sessions...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Failed to load sessions</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions found
            </div>
          ) : (
            <div className="space-y-4">
              {/* Session list */}
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      session.is_current
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        session.is_current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {getDeviceIcon(session.device_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {session.browser || 'Unknown Browser'}
                            {session.os && ` on ${session.os}`}
                          </span>
                          {session.is_current && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {session.ip_address && (
                            <span>{session.ip_address}</span>
                          )}
                          {session.location_city && session.location_country && (
                            <span> • {session.location_city}, {session.location_country}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Last active: {formatRelativeTime(session.last_activity_at)}
                        </div>
                      </div>
                    </div>

                    {!session.is_current && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isRevoking}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setSessionToRevoke(session)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sign out this device
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>

              {/* Revoke all button */}
              {otherSessionsCount > 0 && (
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setShowRevokeAllDialog(true)}
                    disabled={isRevokingAll}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isRevokingAll ? 'Signing out...' : `Sign out all other devices (${otherSessionsCount})`}
                  </Button>
                </div>
              )}

              {/* Session count */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                {totalSessions} active session{totalSessions !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke single session dialog */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out this device?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out the session on{' '}
              <strong>
                {sessionToRevoke?.browser || 'Unknown browser'}
                {sessionToRevoke?.os && ` on ${sessionToRevoke.os}`}
              </strong>
              . They'll need to sign in again to access their account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Sign Out Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke all sessions dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out {otherSessionsCount} other session{otherSessionsCount !== 1 ? 's' : ''}.
              Your current session will remain active. This is useful if you think someone else
              may have access to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAllOthers}
              className="bg-red-600 hover:bg-red-700"
            >
              Sign Out All Other Devices
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
