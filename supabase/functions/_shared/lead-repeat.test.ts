import { describe, it, expect } from 'vitest';
import { mergeRepeatEnquiry, MERGED_MESSAGE_MAX, MESSAGE_SEPARATOR } from './lead-repeat.ts';

const LISTING_A = '11111111-1111-4111-8111-111111111111';
const LISTING_B = '22222222-2222-4222-8222-222222222222';

describe('mergeRepeatEnquiry (US-513)', () => {
  it('keeps the first message when the visitor writes again', () => {
    const { update, activity } = mergeRepeatEnquiry(
      { message: 'Can I see 12 Main St on Saturday?', listing_id: null, form_data: null },
      { message: 'Also, is 40 Oak Ave still available?' }
    );
    expect(update.message).toBe(
      `Can I see 12 Main St on Saturday?${MESSAGE_SEPARATOR}Also, is 40 Oak Ave still available?`
    );
    expect(activity).toMatchObject({
      activity_type: 'form_submission',
      title: 'Enquired again',
      content: 'Also, is 40 Oak Ave still available?',
    });
  });

  it('logs nothing and changes nothing for an identical resubmission', () => {
    const earlier = { message: 'Hello there', listing_id: LISTING_A, form_data: { bedrooms: '3' } };
    const { update, activity } = mergeRepeatEnquiry(earlier, {
      message: '  Hello there ',
      listing_id: LISTING_A,
      form_data: { bedrooms: '3' },
    });
    expect(activity).toBeNull();
    expect(update.message).toBe('Hello there');
    expect(update.form_data).toEqual({ bedrooms: '3' });
    expect(update).not.toHaveProperty('listing_id');
  });

  it('does not append a message already stored as one of the earlier parts', () => {
    const stored = `First question${MESSAGE_SEPARATOR}Second question`;
    const { update, activity } = mergeRepeatEnquiry(
      { message: stored, listing_id: null, form_data: null },
      { message: 'First question' }
    );
    expect(update.message).toBe(stored);
    expect(activity).toBeNull();
  });

  it('treats a short reply contained inside a longer earlier message as new', () => {
    const { update, activity } = mergeRepeatEnquiry(
      { message: 'Is it available? Thanks', listing_id: null, form_data: null },
      { message: 'Thanks' }
    );
    expect(update.message).toBe(`Is it available? Thanks${MESSAGE_SEPARATOR}Thanks`);
    expect(activity?.content).toBe('Thanks');
  });

  it('keeps the earlier message when the repeat has none', () => {
    const { update, activity } = mergeRepeatEnquiry(
      { message: 'Original', listing_id: null, form_data: null },
      { message: undefined }
    );
    expect(update.message).toBe('Original');
    expect(activity).toBeNull();
  });

  it('takes the new message when the lead had none', () => {
    const { update } = mergeRepeatEnquiry({ message: null, listing_id: null, form_data: null }, { message: 'Hi' });
    expect(update.message).toBe('Hi');
  });

  it('bounds the stored history but puts the full new message on the timeline', () => {
    const earlierMessage = 'a'.repeat(MERGED_MESSAGE_MAX - 10);
    const incoming = 'b'.repeat(1500);
    const { update, activity } = mergeRepeatEnquiry(
      { message: earlierMessage, listing_id: null, form_data: null },
      { message: incoming }
    );
    expect(update.message).toHaveLength(MERGED_MESSAGE_MAX);
    expect(update.message?.startsWith(earlierMessage)).toBe(true);
    expect(update.message?.endsWith('…')).toBe(true);
    expect(activity?.content).toBe(incoming);
  });

  it('keeps the listing the lead arrived with and names the new one on the timeline', () => {
    const { update, activity } = mergeRepeatEnquiry(
      { message: 'About A', listing_id: LISTING_A, form_data: null },
      { message: 'About A', listing_id: LISTING_B, listing_address: '40 Oak Ave' }
    );
    expect(update).not.toHaveProperty('listing_id');
    expect(activity?.content).toBe('Asked about 40 Oak Ave');
    expect(activity?.metadata).toMatchObject({ repeat_enquiry: true, listing_id: LISTING_B });
  });

  it('fills in the listing when the lead had none', () => {
    const { update, activity } = mergeRepeatEnquiry(
      { message: null, listing_id: null, form_data: null },
      { listing_id: LISTING_B }
    );
    expect(update.listing_id).toBe(LISTING_B);
    expect(activity?.content).toBe('Asked about another listing');
  });

  it('merges form answers and lists the ones that changed', () => {
    const { update, activity } = mergeRepeatEnquiry(
      { message: null, listing_id: null, form_data: { bedrooms: '3', condition: 'good' } },
      { form_data: { bedrooms: '4', condition: 'good', yearBuilt: '1990' }, source: 'website' }
    );
    expect(update.form_data).toEqual({ bedrooms: '4', condition: 'good', yearBuilt: '1990' });
    expect(activity?.content).toBe('Updated answers: bedrooms, yearBuilt');
    expect(activity?.metadata).toMatchObject({ changed_answers: ['bedrooms', 'yearBuilt'], source: 'website' });
  });
});
