import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: vi.fn() }));

import { describeLinkError } from './useLinks';

describe('describeLinkError', () => {
  it('explains a links_url_scheme refusal (US-456)', () => {
    expect(
      describeLinkError({
        code: '23514',
        message: 'new row for relation "links" violates check constraint "links_url_scheme"',
      })
    ).toBe(
      'The link address must be a web address starting with https://, an email (mailto:) or a phone number (tel:).'
    );
  });

  it('shows the message of a PostgREST error object that is not an Error', () => {
    expect(describeLinkError({ message: 'Your Free plan includes 5 links.' })).toBe(
      'Your Free plan includes 5 links.'
    );
  });

  it('shows an Error message, or a fallback', () => {
    expect(describeLinkError(new Error('offline'))).toBe('offline');
    expect(describeLinkError(undefined)).toBe('An error occurred');
  });
});
