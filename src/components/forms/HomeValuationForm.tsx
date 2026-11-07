import { TrendingUp } from 'lucide-react';
import { TwoStepLeadForm } from './TwoStepLeadForm';
import { VALUATION_QUALIFIERS } from '@/lib/leadFormSchema';

/**
 * Home valuation. Two steps since US-228: name, contact and the address are
 * all an agent needs to start; the facts they would otherwise look up (size,
 * condition, year) are optional after. It required nine fields, including
 * square footage.
 */
// The questions live in leadFormSchema so the lead detail can read the
// answers back under the same labels (US-264).
const QUALIFIERS = VALUATION_QUALIFIERS;

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
