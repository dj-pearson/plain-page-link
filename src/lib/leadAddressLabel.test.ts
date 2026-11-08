import { describe, it, expect } from 'vitest';
import { leadAddressLabel } from './leadAddressLabel';
import { leadAddressLabel as schemaLabel } from './leadFormSchema';

describe('leadAddressLabel copy (US-476)', () => {
  const cases = [
    { lead_type: 'buyer', listing_id: 'l1' },
    { lead_type: 'buyer', listing_id: null },
    { lead_type: 'seller' },
    { lead_type: 'valuation' },
    { lead_type: 'contact', listing_id: 'l2' },
    { lead_type: 'contact' },
  ];
  it('answers exactly as the schema module does', () => {
    for (const c of cases) expect(leadAddressLabel(c)).toBe(schemaLabel(c));
  });
});
