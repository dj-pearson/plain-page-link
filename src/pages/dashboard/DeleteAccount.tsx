import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2, ShieldOff, Undo2 } from 'lucide-react';
import { callEdgeFunction, edgeFunctions } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';

const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

interface DeletionStatus {
  scheduled: boolean;
  scheduledFor?: string | null;
  daysRemaining?: number | null;
}

export default function DeleteAccount() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await callEdgeFunction<DeletionStatus>('gdpr-deletion', {
        method: 'GET',
        auth: true,
      });
      setStatus(data ?? { scheduled: false });
    } catch (error) {
      logger.error('Failed to load deletion status', error as Error);
      setStatus({ scheduled: false });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    void fetchStatus();
  }, []);

  const handleRequestDeletion = async () => {
    if (confirmText.trim() !== CONFIRM_PHRASE) {
      toast({
        title: 'Confirmation required',
        description: `Type "${CONFIRM_PHRASE}" exactly to confirm.`,
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const { error } = await edgeFunctions.invoke('gdpr-deletion', {
      body: { action: 'request', reason: reason || undefined },
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: 'Could not schedule deletion',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Account deletion scheduled',
      description:
        'Your account and data will be deleted in 30 days. You can cancel any time before then.',
    });
    setConfirmText('');
    void fetchStatus();
  };

  const handleCancelDeletion = async () => {
    setSubmitting(true);
    const { error } = await edgeFunctions.invoke('gdpr-deletion', {
      body: { action: 'cancel', cancelReason: 'User cancelled from settings' },
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: 'Could not cancel deletion',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Deletion cancelled',
      description: 'Your account will not be deleted.',
    });
    void fetchStatus();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Delete Account</h1>
        <p className="text-sm text-gray-500 mt-1">
          Permanently delete your AgentBio account and associated data in accordance with your right
          to erasure (GDPR Article 17).
        </p>
      </div>

      {loadingStatus ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : status?.scheduled ? (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Deletion scheduled
            </CardTitle>
            <CardDescription>
              Your account is scheduled for deletion
              {status.scheduledFor
                ? ` on ${new Date(status.scheduledFor).toLocaleDateString()}`
                : ''}
              {typeof status.daysRemaining === 'number'
                ? ` (${status.daysRemaining} days remaining)`
                : ''}
              . You can cancel before then to keep your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleCancelDeletion} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Undo2 className="h-4 w-4 mr-2" />
              )}
              Cancel deletion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <ShieldOff className="h-5 w-5" />
              Danger zone
            </CardTitle>
            <CardDescription>
              This schedules permanent deletion of your profile, listings, leads, links, analytics,
              and testimonials. Your account is deactivated immediately and fully removed after a
              30-day grace period (during which you can cancel).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Reason for leaving (optional)</Label>
              <Input
                id="delete-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono">{CONFIRM_PHRASE}</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                aria-label="Deletion confirmation"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleRequestDeletion}
                disabled={submitting || confirmText.trim() !== CONFIRM_PHRASE}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete my account
              </Button>
              <Button variant="ghost" onClick={() => navigate('/dashboard/settings')}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
