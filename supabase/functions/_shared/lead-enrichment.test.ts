import { describe, it, expect } from 'vitest';
import { buildEnrichment, generateEnrichToken, hashEnrichToken, ENRICH_TOKEN_RE } from './lead-enrichment.ts';

describe('lead enrichment (US-228)', () => {
  it('writes only qualifier columns and form answers', () => {
    const { columns, formData, errors } = buildEnrichment({
      price_range: '500k-750k',
      timeline: '1-3-months',
      preapproved: true,
      // Not step two's to change:
      user_id: 'someone-else',
      encrypted_email: 'x',
      status: 'converted',
      form_data: { bedrooms: '3', propertyType: 'condo' },
    });
    expect(errors).toEqual([]);
    expect(columns).toEqual({ price_range: '500k-750k', timeline: '1-3-months', preapproved: true });
    expect(formData).toEqual({ bedrooms: '3', propertyType: 'condo' });
  });

  it('rejects wrong types', () => {
    expect(buildEnrichment({ preapproved: 'yes' }).errors).toContain('Pre-approval status must be a boolean');
    expect(buildEnrichment({ message: 'x'.repeat(2001) }).errors.length).toBe(1);
  });

  it('tokens are 256-bit hex; the stored form is a hash', async () => {
    const t = generateEnrichToken();
    expect(t).toMatch(ENRICH_TOKEN_RE);
    expect(await hashEnrichToken(t)).not.toBe(t);
  });
});
