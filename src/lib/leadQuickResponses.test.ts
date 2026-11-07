import { describe, it, expect } from 'vitest';
import { QUICK_RESPONSES, fillQuickResponse, quickResponseHref } from './leadQuickResponses';

describe('fillQuickResponse', () => {
  const intro = QUICK_RESPONSES.find((r) => r.id === 'intro')!.template;

  it('greets by first name and names what the agent helps with', () => {
    expect(fillQuickResponse(intro, { name: 'Dana Q. Buyer', lead_type: 'buyer' })).toBe(
      "Hi Dana, thank you for reaching out! I'd love to help you find your next home. When would be a good time to chat?"
    );
  });

  it('does not tell a valuation lead it will sell their property', () => {
    expect(fillQuickResponse(intro, { name: 'Eve', lead_type: 'valuation' })).toContain(
      'help you understand what your home is worth'
    );
    expect(fillQuickResponse(intro, { name: 'Eve', lead_type: 'contact' })).toContain(
      'help you with your real estate plans'
    );
  });

  it('replaces every placeholder and falls back when there is no name', () => {
    expect(fillQuickResponse('{name} / {name}', { name: '  ', lead_type: 'seller' })).toBe(
      'there / there'
    );
  });
});

describe('quickResponseHref', () => {
  it('builds a mailto with an encoded subject and body', () => {
    expect(
      quickResponseHref('email', { email: 'a+b@example.com', phone: null }, 'Hi & bye', 'Re: 1')
    ).toBe('mailto:a%2Bb@example.com?subject=Re%3A%201&body=Hi%20%26%20bye');
  });

  it('builds an sms link with only dialable characters', () => {
    expect(quickResponseHref('sms', { email: null, phone: '+1 (555) 010-2030' }, 'Hi', '')).toBe(
      'sms:+15550102030?&body=Hi'
    );
  });

  it('returns null when the lead has no address for that channel', () => {
    expect(quickResponseHref('email', { email: null, phone: '555' }, 'x', 'y')).toBeNull();
    expect(quickResponseHref('sms', { email: 'a@b.c', phone: null }, 'x', 'y')).toBeNull();
  });
});
