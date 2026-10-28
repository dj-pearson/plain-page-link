import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { HomeValuationForm } from './HomeValuationForm';

interface HomeValuationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
}

/**
 * The public profile's "What's my home worth?" dialog.
 *
 * Its own module so FullProfilePage can lazy-load the dialog and the form as
 * one chunk (US-244); the page used to import both statically, along with all
 * of Radix Dialog, for a form most visitors never open.
 */
export function HomeValuationDialog({
  open,
  onOpenChange,
  agentId,
  agentName,
}: HomeValuationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Hidden: HomeValuationForm renders its own visible heading, but a
            dialog without a title is announced unnamed (US-112). */}
        <DialogTitle className="sr-only">Home valuation request</DialogTitle>
        <HomeValuationForm
          agentId={agentId}
          agentName={agentName}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
