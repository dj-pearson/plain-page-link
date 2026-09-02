import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  ContactForm,
  BuyerInquiryForm,
  SellerInquiryForm,
  HomeValuationForm,
} from '@/components/forms';

export type LeadFormType = 'contact' | 'buyer' | 'seller' | 'valuation';

const FORM_TITLES: Record<LeadFormType, string> = {
  contact: 'Send a message',
  buyer: 'Buyer inquiry',
  seller: 'Seller inquiry',
  valuation: 'Home valuation request',
};

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formType: LeadFormType;
  agentId: string;
  agentName: string;
  /**
   * Set when the modal was opened from a specific property, so the lead
   * reaches the CRM with that listing attached (US-096).
   */
  listing?: { id: string; address: string };
}

export function LeadFormModal({
  isOpen,
  onClose,
  formType,
  agentId,
  agentName,
  listing,
}: LeadFormModalProps) {
  const renderForm = () => {
    switch (formType) {
      case 'contact':
        return (
          <ContactForm
            agentId={agentId}
            agentName={agentName}
            listing={listing}
            onSuccess={onClose}
          />
        );
      case 'buyer':
        return (
          <BuyerInquiryForm
            agentId={agentId}
            agentName={agentName}
            listing={listing}
            onSuccess={onClose}
          />
        );
      case 'seller':
        return <SellerInquiryForm agentId={agentId} agentName={agentName} onSuccess={onClose} />;
      case 'valuation':
        return <HomeValuationForm agentId={agentId} agentName={agentName} onSuccess={onClose} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Radix requires a title on every dialog; without one a screen reader
            announces the dialog with no name at all. The forms inside carry
            their own visible heading, so this one is hidden (US-112). */}
        <DialogTitle className="sr-only">{FORM_TITLES[formType]}</DialogTitle>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}
