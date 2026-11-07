import { Home } from 'lucide-react';
import { TwoStepLeadForm } from './TwoStepLeadForm';
import { BUYER_QUALIFIERS } from '@/lib/leadFormSchema';

/**
 * Buyer enquiry. Two steps since US-228: name and an email or phone first; the
 * search criteria after, optional. It used to require all eight up front.
 */
// The questions live in leadFormSchema so the lead detail can read the
// answers back under the same labels (US-264).
const QUALIFIERS = BUYER_QUALIFIERS;

interface BuyerInquiryFormProps {
  agentId: string;
  agentName: string;
  /**
   * The property this enquiry is about, when the form was opened from one.
   * Its id reaches leads.listing_id and its address leads.property_address
   * (US-096).
   */
  listing?: { id: string; address: string };
  onSuccess?: () => void;
}

export function BuyerInquiryForm({
  agentId,
  agentName,
  listing,
  onSuccess,
}: BuyerInquiryFormProps) {
  return (
    <TwoStepLeadForm
      agentId={agentId}
      agentName={agentName}
      leadType="buyer"
      formType="buyer_inquiry"
      icon={<Home className="w-5 h-5" aria-hidden="true" />}
      title="Find Your Dream Home"
      description={`Let ${agentName} help you find the perfect property`}
      qualifiers={QUALIFIERS}
      listingId={listing?.id}
      extraData={listing ? { address: listing.address } : undefined}
      successTitle="Inquiry Received!"
      successMessage={`${agentName} will be in touch about your home search.`}
      onSuccess={onSuccess}
    />
  );
}
