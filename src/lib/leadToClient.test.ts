import { describe, it, expect } from 'vitest';

import { relationshipForLead, splitName } from './leadToClient';

describe('splitName', () => {
  it('keeps everything but the last word as the first name', () => {
    expect(splitName('Mary Ann Smith')).toEqual({ first_name: 'Mary Ann', last_name: 'Smith' });
  });

  it('treats a single word as a first name', () => {
    expect(splitName('  Cher ')).toEqual({ first_name: 'Cher', last_name: null });
  });
});

describe('relationshipForLead', () => {
  it('maps what the form said to where they are', () => {
    expect(relationshipForLead('buyer')).toBe('active_buyer');
    expect(relationshipForLead('open_house')).toBe('active_buyer');
    expect(relationshipForLead('valuation')).toBe('active_seller');
    expect(relationshipForLead('contact')).toBe('prospect');
  });
});
