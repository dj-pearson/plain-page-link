/**
 * What each public lead form asks, and how the CRM reads the answers back
 * (US-264, first slice of US-130).
 *
 * The buyer, seller and valuation forms used to declare their questions inline,
 * and the lead detail never looked at them: splitFormData lifts price_range,
 * timeline, property_address, preapproved and message into columns and puts
 * everything else in leads.form_data, but the modal rendered only `source`,
 * `property_address` and a `budget` key no form writes. A buyer's property
 * type, bedrooms and cash-or-lender answer, a seller's bathrooms and reason for
 * selling, a valuation's size, year and condition — and even the price range,
 * timeline and pre-approval columns — reached the database and were never
 * shown to the agent.
 *
 * The questions now live here, the forms render them from here, and
 * describeLeadAnswers turns a stored lead back into the labelled answers the
 * visitor gave — one list, so a question added to a form is a question the
 * agent sees.
 *
 * form_data, per lead_type (keys other than these are still shown, under a
 * label derived from the key, so a new form is never silently hidden):
 *
 *   buyer      propertyType, bedrooms, preApprovalStatus (the four-way answer
 *              behind the preapproved boolean)
 *   seller     propertyType, bedrooms, bathrooms, reason
 *   valuation  propertyType, condition, bedrooms, bathrooms, squareFeet,
 *              yearBuilt
 *   open_house hasAgent (boolean), heardFrom (free text from a fixed list)
 *   contact    nothing — name, contact details and message are all columns
 *
 * Columns read alongside: price_range, timeline, preapproved.
 */

/**
 * Structurally the Json of src/integrations/supabase/types.ts, declared here
 * rather than imported so this file has no imports at all: notify-lead runs
 * an exact copy (supabase/functions/_shared/leadFormSchema.ts, held to this
 * file by a parity test) and the edge container cannot reach src/.
 */
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface QualifierField {
  /** Key in the answers bag; see splitFormData for the ones with a column. */
  key: string;
  label: string;
  kind: 'select' | 'text' | 'number' | 'textarea';
  options?: [value: string, label: string][];
  placeholder?: string;
}

/** Buyer enquiry, step two (US-228). */
export const BUYER_QUALIFIERS: QualifierField[] = [
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
  {
    key: 'message',
    label: 'Anything else?',
    kind: 'textarea',
    placeholder: 'Tell us about your ideal home…',
  },
];

/** Seller enquiry, step two (US-228). */
export const SELLER_QUALIFIERS: QualifierField[] = [
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
  {
    key: 'message',
    label: 'Anything else?',
    kind: 'textarea',
    placeholder: 'Recent updates, questions…',
  },
];

/** Home valuation, step two (US-228). */
export const VALUATION_QUALIFIERS: QualifierField[] = [
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

const QUALIFIERS_BY_TYPE: Record<string, QualifierField[]> = {
  buyer: BUYER_QUALIFIERS,
  seller: SELLER_QUALIFIERS,
  valuation: VALUATION_QUALIFIERS,
};

/**
 * Agent-facing labels. The forms ask the visitor in the second person ("When
 * are you buying?"); the agent reads a field name.
 */
const AGENT_LABELS: Record<string, string> = {
  propertyType: 'Property type',
  priceRange: 'Price range',
  bedrooms: 'Bedrooms',
  bathrooms: 'Bathrooms',
  timeline: 'Timeline',
  preApproved: 'Financing',
  preApprovalStatus: 'Financing',
  reason: 'Reason for selling',
  condition: 'Condition',
  squareFeet: 'Square feet',
  yearBuilt: 'Year built',
  hasAgent: 'Working with an agent',
  heardFrom: 'Heard about it from',
  budget: 'Budget',
};

/**
 * form_data keys that are not an answer: either the column already shows it
 * (address, message, listing_id) or it is the raw half of a column read above
 * (preApprovalStatus is folded into Financing).
 */
const NOT_AN_ANSWER = new Set([
  'address',
  'message',
  'listing_id',
  'listingId',
  'priceRange',
  'timeline',
  'preApproved',
  'preApprovalStatus',
]);

/** form_data is bounded server-side, but a row is still untrusted input. */
const MAX_VALUE_LENGTH = 200;

export interface LeadAnswer {
  key: string;
  label: string;
  value: string;
}

/** The fields of a lead describeLeadAnswers reads. */
export interface LeadAnswerSource {
  lead_type: string;
  price_range?: string | null;
  timeline?: string | null;
  preapproved?: boolean | null;
  form_data?: Json | null;
}

/** "squareFeet" / "square_feet" → "Square feet". */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

/** The option label a form showed for `value`, searching this type first. */
function optionLabel(leadType: string, key: string, value: string): string | null {
  const own = QUALIFIERS_BY_TYPE[leadType] ?? [];
  const lists = [own, ...Object.values(QUALIFIERS_BY_TYPE).filter((l) => l !== own)];
  for (const list of lists) {
    const field = list.find((f) => f.key === key);
    const match = field?.options?.find(([v]) => v === value);
    if (match) return match[1];
  }
  return null;
}

function displayValue(leadType: string, key: string, raw: unknown): string | null {
  let text: string;
  if (typeof raw === 'boolean') {
    text = raw ? 'Yes' : 'No';
  } else if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    text = key === 'yearBuilt' ? String(raw) : raw.toLocaleString('en-US');
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    text = optionLabel(leadType, key, trimmed) ?? trimmed;
  } else if (Array.isArray(raw)) {
    const parts = raw.filter(
      (v): v is string | number => typeof v === 'string' || typeof v === 'number'
    );
    if (parts.length === 0) return null;
    text = parts.join(', ');
  } else {
    // Nested objects are refused by submit-lead's sanitiser; never render one.
    return null;
  }
  return text.length > MAX_VALUE_LENGTH ? `${text.slice(0, MAX_VALUE_LENGTH)}…` : text;
}

function asRecord(value: Json | null | undefined): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Everything the visitor told the agent beyond name, contact details, message
 * and address, labelled and in the order the form asked it.
 */
export function describeLeadAnswers(lead: LeadAnswerSource): LeadAnswer[] {
  const formData = asRecord(lead.form_data);
  const answers: LeadAnswer[] = [];
  const push = (key: string, raw: unknown) => {
    const value = displayValue(lead.lead_type, key, raw);
    if (value !== null) answers.push({ key, label: AGENT_LABELS[key] ?? humanizeKey(key), value });
  };

  push('priceRange', lead.price_range);
  push('timeline', lead.timeline);

  // The four-way answer says more than the boolean: a cash buyer and someone
  // who needs a lender introduction are different conversations.
  const status = formData.preApprovalStatus;
  if (typeof status === 'string' && status.trim()) {
    push('preApproved', status);
  } else if (typeof lead.preapproved === 'boolean') {
    answers.push({
      key: 'preApproved',
      label: AGENT_LABELS.preApproved,
      value: lead.preapproved ? 'Pre-approved' : 'Not pre-approved',
    });
  }

  // Known keys in the form's own order, then anything else the row carries.
  const ordered = (QUALIFIERS_BY_TYPE[lead.lead_type] ?? []).map((f) => f.key);
  const keys = [
    ...ordered.filter((k) => k in formData),
    ...Object.keys(formData).filter((k) => !ordered.includes(k)),
  ];
  for (const key of keys) {
    if (NOT_AN_ANSWER.has(key)) continue;
    push(key, formData[key]);
  }

  return answers;
}

// Lives in its own module so the Leads list does not load this whole schema
// for one label (US-476). Re-exported for existing callers.
export { leadAddressLabel } from './leadAddressLabel';
