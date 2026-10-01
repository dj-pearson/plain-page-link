import { describe, it, expect } from 'vitest';
import { normalizeOtp } from './otp';

describe('normalizeOtp', () => {
  it.each([
    ['123 456', '123456'],
    ['123-456', '123456'],
    [' 123456 ', '123456'],
    ['1234567', '123456'],
    ['12a3', '123'],
  ])('%j → %j', (raw, code) => expect(normalizeOtp(raw)).toBe(code));
});
