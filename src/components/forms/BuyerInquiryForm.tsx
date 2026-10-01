import { Home } from 'lucide-react';
import { TwoStepLeadForm, type QualifierField } from './TwoStepLeadForm';

/**
 * Buyer enquiry. Two steps since US-228: name and an email or phone first; the
 * search criteria after, optional. It used to require all eight up front.
 */
const QUALIFIERS: QualifierField[] = [
  {
    key: 'propertyType',
    label: 'Property type',
    kind: 'select',
    options: [
      ['single-family', 'Single Family Home'],
      ['condo', 'Condo/Townhouse'],
      ['multi-family', 'Multi-Family'],
      ['land', 'Land/Lot'],
      ['luxury', 'Luxury Estate'],
    ],
  },
  {
    key: 'priceRange',
    label: 'Price range',
    kind: 'select',
    options: [
      ['0-250k', 'Under $250k'],
      ['250k-500k', '$250k - $500k'],
      ['500k-750k', '$500k - $750k'],
      ['750k-1m', '$750k - $1M'],
      ['1m-2m', '$1M - $2M'],
      ['2m+', '$2M+'],
    ],
  },
  {
    key: 'bedrooms',
    label: 'Bedrooms',
    kind: 'select',
    options: [
      ['1', '1 Bed'],
      ['2', '2 Beds'],
      ['3', '3 Beds'],
      ['4', '4 Beds'],
      ['5+', '5+ Beds'],
    ],
  },
  {
    key: 'timeline',
    label: 'When are you buying?',
    kind: 'select',
    options: [
      ['immediate', 'ASAP (0-30 days)'],
      ['1-3-months', '1-3 months'],
      ['3-6-months', '3-6 months'],
      ['6+-months', '6+ months'],
      ['just-looking', 'Just looking'],
    ],
  },
  {
    key: 'preApproved',
    label: 'Pre-approved?',
    kind: 'select',
    options: [
      ['yes', "Yes, I'm pre-approved"],
      ['in-process', 'In process'],
      ['not-yet', 'Not yet, need help'],
      ['cash', 'Cash buyer'],
    ],
  },
  { key: 'message', label: 'Anything else?', kind: 'textarea', placeholder: 'Tell us about your ideal home…' },
];

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

export function BuyerInquiryForm({ agentId, agentName, listing, onSuccess }: BuyerInquiryFormProps) {
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
