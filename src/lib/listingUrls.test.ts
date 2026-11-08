import { describe, it, expect } from 'vitest';
import {
  describeListingSaveError,
  normalizeVirtualTourUrl,
  VIRTUAL_TOUR_URL_MESSAGE,
} from './listingUrls';

const FALLBACK = 'Failed to update listing. Please try again.';

describe('normalizeVirtualTourUrl (US-517)', () => {
  it('keeps an empty value empty', () => {
    expect(normalizeVirtualTourUrl('')).toEqual({ value: '' });
    expect(normalizeVirtualTourUrl('   ')).toEqual({ value: '' });
    expect(normalizeVirtualTourUrl(undefined)).toEqual({ value: '' });
  });

  it('adds https:// to a bare host', () => {
    expect(normalizeVirtualTourUrl('my.matterport.com/show/?m=abc')).toEqual({
      value: 'https://my.matterport.com/show/?m=abc',
    });
  });

  it('keeps an http(s) address', () => {
    expect(normalizeVirtualTourUrl(' https://tour.example.com/x ')).toEqual({
      value: 'https://tour.example.com/x',
    });
  });

  it.each(['javascript:x', 'java\tscript:alert(1)', 'data:text/html,hi', 'mailto:a@b.co', '/x'])(
    'refuses %j with the sentence the database refusal maps to',
    (raw) => {
      expect(normalizeVirtualTourUrl(raw)).toEqual({ error: VIRTUAL_TOUR_URL_MESSAGE });
    }
  );

  it('uses the wording the story asks for', () => {
    expect(VIRTUAL_TOUR_URL_MESSAGE).toBe(
      'The virtual tour link must be a full web address starting with https://.'
    );
  });
});

describe('describeListingSaveError (US-517)', () => {
  it('names the field for a listings_virtual_tour_url_scheme refusal', () => {
    const error = {
      code: '23514',
      message:
        'new row for relation "listings" violates check constraint "listings_virtual_tour_url_scheme"',
    };
    expect(describeListingSaveError(error, FALLBACK)).toBe(VIRTUAL_TOUR_URL_MESSAGE);
  });

  it('passes on a plan-limit message, which is written for the agent', () => {
    const error = {
      code: '23514',
      message: 'Your plan allows 5 active listings.',
      details: 'plan_limit:listings',
    };
    expect(describeListingSaveError(error, FALLBACK)).toBe('Your plan allows 5 active listings.');
  });

  it('falls back for anything else', () => {
    expect(describeListingSaveError(new Error('fetch failed'), FALLBACK)).toBe(FALLBACK);
    expect(describeListingSaveError(null, FALLBACK)).toBe(FALLBACK);
  });
});
