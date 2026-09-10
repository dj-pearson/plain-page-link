import { describe, expect, it } from 'vitest';
import { userFacingError } from './userFacingError';

const opts = { subject: 'link', fallback: 'Failed to add link. Please try again.' };

describe('userFacingError', () => {
  it('passes through a message written for a person', () => {
    // This is the one US-199 was about: validateReviewData says exactly what is
    // wrong and the page printed "Please try again" instead.
    expect(userFacingError(new Error('Review must be between 1 and 2000 characters'), opts)).toBe(
      'Review must be between 1 and 2000 characters'
    );
  });

  it('reads a Supabase error object as well as an Error', () => {
    expect(userFacingError({ message: 'That URL is not allowed.' }, opts)).toBe(
      'That URL is not allowed.'
    );
    expect(userFacingError({ error: { message: 'Too many submissions.' } }, opts)).toBe(
      'Too many submissions.'
    );
  });

  it('translates a database code into what it means for what they were doing', () => {
    expect(userFacingError({ code: '23505' }, opts)).toBe('That link already exists.');
    expect(userFacingError({ code: '42501' }, { ...opts, subject: 'listing' })).toBe(
      'You do not have permission to change this listing.'
    );
    expect(userFacingError({ code: 'PGRST116' }, opts)).toBe(
      'That link could not be found. It may have been deleted.'
    );
  });

  it('prefers the code over the raw text, which names the schema', () => {
    const pgError = {
      code: '23505',
      message: 'duplicate key value violates unique constraint "links_user_id_position_key"',
    };
    const shown = userFacingError(pgError, opts);
    expect(shown).toBe('That link already exists.');
    expect(shown).not.toContain('links_user_id_position_key');
  });

  it.each([
    ['a Supabase transport failure', 'Edge Function returned a non-2xx status code'],
    ['a network failure', 'Failed to fetch'],
    ['a Safari network failure', 'Load failed'],
    ['a leaked constraint name', 'new row violates check constraint "links_url_check"'],
    ['a leaked relation name', 'relation "public.links" does not exist'],
    ['a serialised object', '{"hint":null,"details":null}'],
  ])('does not show %s', (_why, message) => {
    expect(userFacingError(new Error(message), opts)).toBe(opts.fallback);
  });

  it('does not show a wall of text as if it were a sentence', () => {
    expect(userFacingError(new Error('x'.repeat(400)), opts)).toBe(opts.fallback);
  });

  it('always has something to say', () => {
    expect(userFacingError(undefined, opts)).toBe(opts.fallback);
    expect(userFacingError(null, opts)).toBe(opts.fallback);
    expect(userFacingError({}, opts)).toBe(opts.fallback);
    expect(userFacingError(new Error('   '), opts)).toBe(opts.fallback);
  });
});
