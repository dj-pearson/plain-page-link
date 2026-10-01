import { TrendingUp } from 'lucide-react';
import { TwoStepLeadForm, type QualifierField } from './TwoStepLeadForm';

/**
 * Home valuation. Two steps since US-228: name, contact and the address are
 * all an agent needs to start; the facts they would otherwise look up (size,
 * condition, year) are optional after. It required nine fields, including
 * square footage.
 */
const QUALIFIERS: QualifierField[] = [
  {
    key: 'propertyType',
    label: 'Property type',
    kind: 'select',
    options: [
      ['single-family', 'Single Family Home'],
      ['condo', 'Condo'],
      ['townhouse', 'Townhouse'],
      ['multi-family', 'Multi-Family'],
      ['manufactured', 'Manufactured'],
    ],
  },
  {
    key: 'condition',
    label: 'Condition',
    kind: 'select',
    options: [
      ['excellent', 'Excellent'],
      ['good', 'Good'],
      ['average', 'Average'],
      ['fair', 'Fair'],
      ['needs-work', 'Needs Work'],
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
      ['5', '5'],
      ['6+', '6+'],
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
      ['4', '4'],
      ['4.5+', '4.5+'],
    ],
  },
  { key: 'squareFeet', label: 'Square feet', kind: 'number', placeholder: '2000' },
  { key: 'yearBuilt', label: 'Year built', kind: 'number', placeholder: '1995' },
];

interface HomeValuationFormProps {
  agentId: string;
  agentName: string;
  onSuccess?: () => void;
}

export function HomeValuationForm({ agentId, agentName, onSuccess }: HomeValuationFormProps) {
  return (
    <TwoStepLeadForm
      agentId={agentId}
      agentName={agentName}
      leadType="valuation"
      formType="valuation_request"
      icon={<TrendingUp className="w-5 h-5" aria-hidden="true" />}
      title="Free Home Valuation"
      description={`Find out what your home is worth in today's market with ${agentName}`}
      askAddress
      qualifiers={QUALIFIERS}
      successTitle="Request Received!"
      successMessage={`${agentName} will send your home's market analysis.`}
      onSuccess={onSuccess}
    />
  );
}
