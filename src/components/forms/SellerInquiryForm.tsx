import { DollarSign } from 'lucide-react';
import { TwoStepLeadForm } from './TwoStepLeadForm';
import { SELLER_QUALIFIERS } from '@/lib/leadFormSchema';

/**
 * Seller enquiry. Two steps since US-228: name, contact and the address first;
 * the property details and reason after, optional. It required nine fields.
 */
// The questions live in leadFormSchema so the lead detail can read the
// answers back under the same labels (US-264).
const QUALIFIERS = SELLER_QUALIFIERS;

interface SellerInquiryFormProps {
  agentId: string;
  agentName: string;
  onSuccess?: () => void;
}

export function SellerInquiryForm({ agentId, agentName, onSuccess }: SellerInquiryFormProps) {
  return (
    <TwoStepLeadForm
      agentId={agentId}
      agentName={agentName}
      leadType="seller"
      formType="seller_inquiry"
      icon={<DollarSign className="w-5 h-5" aria-hidden="true" />}
      title="Sell Your Home"
      description={`Get a competitive market analysis from ${agentName}`}
      askAddress
      qualifiers={QUALIFIERS}
      successTitle="Request Received!"
      successMessage={`${agentName} will be in touch about selling your home.`}
      onSuccess={onSuccess}
    />
  );
}
