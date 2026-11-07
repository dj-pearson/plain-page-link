import { describe, it, expect } from 'vitest';
import {
  BUYER_QUALIFIERS,
  SELLER_QUALIFIERS,
  VALUATION_QUALIFIERS,
  describeLeadAnswers,
  humanizeKey,
  leadAddressLabel,
} from './leadFormSchema';
import { splitFormData } from './leadSubmission';

const asMap = (answers: { label: string; value: string }[]) =>
  Object.fromEntries(answers.map((a) => [a.label, a.value]));

describe('describeLeadAnswers', () => {
  it('shows a buyer’s columns and form_data under the labels the form offered', () => {
    const answers = describeLeadAnswers({
      lead_type: 'buyer',
      price_range: '500k-750k',
      timeline: '1-3-months',
      preapproved: true,
      form_data: { propertyType: 'condo', bedrooms: '3', preApprovalStatus: 'cash' },
    });
    expect(answers.map((a) => a.label)).toEqual([
      'Price range',
      'Timeline',
      'Financing',
      'Property type',
      'Bedrooms',
    ]);
    expect(asMap(answers)).toEqual({
      'Price range': '$500k - $750k',
      Timeline: '1-3 months',
      Financing: 'Cash buyer',
      'Property type': 'Condo/Townhouse',
      Bedrooms: '3 Beds',
    });
  });

  it('every question the buyer, seller and valuation forms ask reaches the agent', () => {
    for (const [leadType, qualifiers] of [
      ['buyer', BUYER_QUALIFIERS],
      ['seller', SELLER_QUALIFIERS],
      ['valuation', VALUATION_QUALIFIERS],
    ] as const) {
      // Answer every question with its first option (or a number), split it
      // exactly as submitLead does, and read it back.
      const data: Record<string, unknown> = {};
      for (const q of qualifiers) {
        data[q.key] = q.options ? q.options[0][0] : q.kind === 'number' ? '1999' : 'free text';
      }
      const { columns, formData } = splitFormData(data);
      const answers = describeLeadAnswers({
        lead_type: leadType,
        price_range: (columns.price_range as string) ?? null,
        timeline: (columns.timeline as string) ?? null,
        preapproved: (columns.preapproved as boolean) ?? null,
        form_data: formData as Record<string, string>,
      });
      // message is a column the modal shows on its own.
      const expected = qualifiers.filter((q) => q.key !== 'message').length;
      expect(answers, leadType).toHaveLength(expected);
      for (const q of qualifiers) {
        if (q.key === 'message' || !q.options) continue;
        expect(
          answers.map((a) => a.value),
          `${leadType}.${q.key}`
        ).toContain(q.options[0][1]);
      }
    }
  });

  it('labels a seller’s timeline from the seller form, not the buyer one', () => {
    const answers = describeLeadAnswers({
      lead_type: 'seller',
      timeline: 'just-exploring',
      form_data: { reason: 'relocation', bathrooms: '2.5' },
    });
    expect(asMap(answers)).toMatchObject({
      Timeline: 'Just exploring',
      'Reason for selling': 'Relocation',
      Bathrooms: '2.5',
    });
  });

  it('falls back to the boolean when the four-way answer was not kept', () => {
    expect(asMap(describeLeadAnswers({ lead_type: 'open_house', preapproved: false }))).toEqual({
      Financing: 'Not pre-approved',
    });
  });

  it('shows open-house answers, booleans as Yes/No', () => {
    const answers = describeLeadAnswers({
      lead_type: 'open_house',
      timeline: '0-3 months',
      form_data: { hasAgent: false, heardFrom: 'Zillow' },
    });
    expect(asMap(answers)).toEqual({
      Timeline: '0-3 months',
      'Working with an agent': 'No',
      'Heard about it from': 'Zillow',
    });
  });

  it('still shows a key no form declares, under a readable label', () => {
    const answers = describeLeadAnswers({
      lead_type: 'contact',
      form_data: { lot_size: '0.5 acres', schoolDistrict: 'Lincoln' },
    });
    expect(asMap(answers)).toEqual({ 'Lot size': '0.5 acres', 'School district': 'Lincoln' });
  });

  it('skips what the modal shows elsewhere, empties, and anything nested', () => {
    const answers = describeLeadAnswers({
      lead_type: 'buyer',
      form_data: {
        address: '1 Main St',
        message: 'hi',
        listing_id: 1,
        bedrooms: '',
        nested: { a: 1 },
        list: [],
      },
    });
    expect(answers).toEqual([]);
  });

  it('caps a long value', () => {
    const [answer] = describeLeadAnswers({
      lead_type: 'contact',
      form_data: { note: 'x'.repeat(500) },
    });
    expect(answer.value.length).toBeLessThanOrEqual(201);
  });

  it('tolerates form_data that is not an object', () => {
    expect(describeLeadAnswers({ lead_type: 'buyer', form_data: 'oops' })).toEqual([]);
    expect(describeLeadAnswers({ lead_type: 'buyer', form_data: null })).toEqual([]);
  });
});

describe('humanizeKey', () => {
  it.each([
    ['squareFeet', 'Square feet'],
    ['lot_size', 'Lot size'],
    ['move-in-date', 'Move in date'],
  ])('%s → %s', (key, label) => expect(humanizeKey(key)).toBe(label));
});

describe('leadAddressLabel', () => {
  it('says a buyer with a listing asked about it, and a seller gave their own home', () => {
    expect(leadAddressLabel({ lead_type: 'buyer', listing_id: 'l1' })).toBe('Asked about');
    expect(leadAddressLabel({ lead_type: 'contact', listing_id: 'l1' })).toBe('Asked about');
    expect(leadAddressLabel({ lead_type: 'seller', listing_id: null })).toBe('Their property');
    expect(leadAddressLabel({ lead_type: 'valuation' })).toBe('Their property');
    expect(leadAddressLabel({ lead_type: 'buyer', listing_id: null })).toBeNull();
  });
});
