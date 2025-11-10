import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendlyEmbed } from './CalendlyEmbed';

/**
 * CalendlyModal Component
 * Modal dialog with embedded Calendly scheduling widget
 */

interface CalendlyModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendlyUrl: string;
  title?: string;
  subtitle?: string;
  listingAddress?: string;
}

export function CalendlyModal({
  isOpen,
  onClose,
  calendlyUrl,
  title = 'Schedule a Showing',
  subtitle = 'Choose a time that works for you',
  listingAddress
}: CalendlyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-semibold mb-1">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
              {listingAddress && (
                <p className="text-sm text-primary font-medium mt-2">
                  Property: {listingAddress}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto" style={{ height: '650px' }}>
          <CalendlyEmbed url={calendlyUrl} minHeight="650px" />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * CalendlyInlineSection Component
 * Section component for embedding Calendly inline on a page
 */

interface CalendlyInlineSectionProps {
  calendlyUrl: string;
  title?: string;
  subtitle?: string;
  showBorder?: boolean;
}

export function CalendlyInlineSection({
  calendlyUrl,
  title = 'Schedule a Showing',
  subtitle = 'Book a convenient time to view this property',
  showBorder = true
}: CalendlyInlineSectionProps) {
  return (
    <div className={`${showBorder ? 'border border-gray-200 rounded-lg p-6' : ''}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </div>
      <CalendlyEmbed url={calendlyUrl} />
    </div>
  );
}
