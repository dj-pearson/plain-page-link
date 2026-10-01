import { describe, it, expect } from 'vitest';
import { validateRedirectPath } from './navigation';

describe('validateRedirectPath', () => {
  it('keeps an allowed internal path with its query and hash', () => {
    expect(validateRedirectPath('/dashboard/leads?status=new#top')).toBe('/dashboard/leads?status=new#top');
  });

  it('refuses protocol-relative and absolute URLs', () => {
    expect(validateRedirectPath('//evil.example')).toBe('/dashboard');
    expect(validateRedirectPath('https://evil.example')).toBe('/dashboard');
  });

  it('refuses a backslash anywhere (GHSA-wrjc-x8rr-h8h6, US-223)', () => {
    expect(validateRedirectPath('/\\evil.example')).toBe('/dashboard');
    expect(validateRedirectPath('/dashboard/\\\\evil.example')).toBe('/dashboard');
  });
});
