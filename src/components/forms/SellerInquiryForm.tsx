import { DollarSign } from 'lucide-react';
import { TwoStepLeadForm, type QualifierField } from './TwoStepLeadForm';

/**
 * Seller enquiry. Two steps since US-228: name, contact and the address first;
 * the property details and reason after, optional. It required nine fields.
 */
const QUALIFIERS: QualifierField[] = [
  {
    key: 'propertyType',
    label: 'Property type',
    kind: 'select',
    options: [
      ['single-family', 'Single Family'],
      ['condo', 'Condo'],
      ['townhouse', 'Townhouse'],
      ['multi-family', 'Multi-Family'],
      ['land', 'Land'],
    ],
  },
  {
    key: 'bedrooms',
    label: 'Bedrooms',
    kind: 'select',
    options: [
      ['1', '1'],
      ['2', '2'],
      ['3', '3'],
      ['4', '4'],
      ['5+', '5+'],
    ],
  },
  {
    key: 'bathrooms',
    label: 'Bathrooms',
    kind: 'select',
    options: [
      ['1', '1'],
      ['1.5', '1.5'],
      ['2', '2'],
      ['2.5', '2.5'],
      ['3', '3'],
      ['3.5', '3.5'],
      ['4+', '4+'],
    ],
  },
  {
    key: 'timeline',
    label: 'When do you want to sell?',
    kind: 'select',
    options: [
      ['immediate', 'ASAP (0-30 days)'],
      ['1-3-months', '1-3 months'],
      ['3-6-months', '3-6 months'],
      ['6+-months', '6+ months'],
      ['just-exploring', 'Just exploring'],
    ],
  },
  {
    key: 'reason',
    label: 'Reason for selling',
    kind: 'select',
    options: [
      ['upsizing', 'Upsizing'],
      ['downsizing', 'Downsizing'],
      ['relocation', 'Relocation'],
      ['investment', 'Investment property'],
      ['financial', 'Financial reasons'],
      ['other', 'Other'],
    ],
  },
  { key: 'message', label: 'Anything else?', kind: 'textarea', placeholder: 'Recent updates, questions…' },
];

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
