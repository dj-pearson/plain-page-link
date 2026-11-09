import { describe, it, expect } from 'vitest';
import {
  buildEnrichment,
  enrichmentUpdate,
  generateEnrichToken,
  hashEnrichToken,
  ENRICH_TOKEN_RE,
} from './lead-enrichment.ts';
import { MESSAGE_SEPARATOR } from './lead-repeat.ts';

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

describe('enrichmentUpdate (US-565)', () => {
  const stepOne = { message: 'Can I see 12 Main St on Saturday?', form_data: { source_page: 'listing' } };

  it('appends a step-two message to the step-one message, never replacing it', () => {
    const update = enrichmentUpdate(stepOne, buildEnrichment({ message: 'We are pre-approved to 600k.' }));
    expect(update.message).toBe(`Can I see 12 Main St on Saturday?${MESSAGE_SEPARATOR}We are pre-approved to 600k.`);
  });

  it('takes the step-two message as-is when step one left none', () => {
    const update = enrichmentUpdate({ message: null, form_data: null }, buildEnrichment({ message: 'Hello' }));
    expect(update.message).toBe('Hello');
  });

  it('does not write message at all when step two sent none or repeated it', () => {
    expect(enrichmentUpdate(stepOne, buildEnrichment({ timeline: 'asap' }))).not.toHaveProperty('message');
    expect(
      enrichmentUpdate(stepOne, buildEnrichment({ message: '  Can I see 12 Main St on Saturday? ' }))
    ).not.toHaveProperty('message');
  });

  it('still sets the qualifiers and merges form answers', () => {
    const update = enrichmentUpdate(
      stepOne,
      buildEnrichment({ price_range: '500k-750k', preapproved: true, form_data: { bedrooms: '3' } })
    );
    expect(update).toEqual({
      price_range: '500k-750k',
      preapproved: true,
      form_data: { source_page: 'listing', bedrooms: '3' },
    });
  });
});
