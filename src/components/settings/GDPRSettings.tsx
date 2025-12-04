/**
 * GDPR Settings Component
 * Handles data export and account deletion
 */

import { useState } from 'react';
import { Download, Trash2, AlertTriangle, Clock, XCircle, CheckCircle } from 'lucide-react';
import { useGDPR } from '@/hooks/useGDPR';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export function GDPRSettings() {
  const {
    exportData,
    isExporting,
    deletionStatus,
    isDeletionStatusLoading,
    isAccountDeletionScheduled,
    daysUntilDeletion,
    deletionScheduledFor,
    requestDeletion,
    cancelDeletion,
    isRequestingDeletion,
    isCancellingDeletion,
    formatDaysRemaining,
  } = useGDPR();

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');

  const handleExport = () => {
    exportData();
    setShowExportDialog(false);
  };

  const handleRequestDeletion = () => {
    requestDeletion(deletionReason || undefined);
    setShowDeleteDialog(false);
    setDeletionReason('');
  };

  const handleCancelDeletion = () => {
    cancelDeletion('User changed their mind');
    setShowCancelDialog(false);
  };

  return (
    <>
      {/* Data Export Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                Download a copy of all your data in JSON format
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your data export will include your profile, listings, leads, testimonials,
              links, blog posts, analytics, and security activity logs.
            </p>
            <Button
              onClick={() => setShowExportDialog(true)}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Preparing Export...' : 'Export My Data'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Deletion Section */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-red-600" />
            <div>
              <CardTitle className="text-red-600">Delete Account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isDeletionStatusLoading ? (
            <div className="text-muted-foreground">Loading status...</div>
          ) : isAccountDeletionScheduled ? (
            // Deletion is scheduled
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                <Clock className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-600">
                    Account Deletion Scheduled
                  </h4>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                    Your account will be permanently deleted{' '}
                    <strong>{formatDaysRemaining(daysUntilDeletion || 0)}</strong>
                    {deletionScheduledFor && (
                      <> ({new Date(deletionScheduledFor).toLocaleDateString()})</>
                    )}.
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-2">
                    You can cancel this request before the deletion date to keep your account.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(true)}
                disabled={isCancellingDeletion}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isCancellingDeletion ? 'Cancelling...' : 'Cancel Deletion'}
              </Button>
            </div>
          ) : (
            // No deletion scheduled
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                    This action is irreversible
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Deleting your account will permanently remove all your data, including
                    your profile, listings, leads, and analytics. This cannot be undone.
                  </p>
                </div>
              </div>

              <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                <li>30-day grace period before permanent deletion</li>
                <li>You can cancel the deletion request during this period</li>
                <li>We recommend exporting your data first</li>
              </ul>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isRequestingDeletion}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isRequestingDeletion ? 'Processing...' : 'Request Account Deletion'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Your Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will download a JSON file containing all your data including:
              <ul className="mt-2 ml-4 list-disc text-left">
                <li>Profile information</li>
                <li>Property listings</li>
                <li>Leads and contacts</li>
                <li>Testimonials</li>
                <li>Links and social profiles</li>
                <li>Blog posts</li>
                <li>Analytics data</li>
                <li>Security activity logs</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Download Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">
              Delete Your Account?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  This will schedule your account for permanent deletion. You'll have
                  30 days to cancel this request if you change your mind.
                </p>
                <div>
                  <Label htmlFor="reason" className="text-sm font-medium">
                    Why are you leaving? (Optional)
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="Help us improve by sharing your feedback..."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    After 30 days, all your data will be permanently deleted and cannot be recovered.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestDeletion}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Schedule Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Deletion Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Account Deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <p>
                  Your account deletion will be cancelled and your account will remain active.
                  All your data will be preserved.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelDeletion}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Keep My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
