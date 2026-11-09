/**
 * US-498: validateUsername without zod.
 *
 * usernameValidation.ts was the only module on the Settings route that
 * imported zod, so the route downloaded form-vendor (23.4 KB gzip) to check a
 * username. The rules are now plain checks. These tests hold them to the zod
 * schema they replaced, message for message, and keep zod out of the module.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import {
  containsProfanity,
  isReservedUsername,
  usernameError,
  validateUsername,
} from './usernameValidation';

// The schema exactly as it was before US-498.
const oldSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
  .refine((username) => !containsProfanity(username), 'Username contains inappropriate language')
  .refine((username) => !isReservedUsername(username), 'This username is reserved');

const oldValidate = (username: string): { valid: boolean; error?: string } => {
  const result = oldSchema.safeParse(username);
  return result.success ? { valid: true } : { valid: false, error: result.error.errors[0].message };
};

const CASES = [
  '',
  'a',
  'ab',
  'abc',
  'jane-doe',
  'jane_doe_99',
  'JaneDoe',
  'a'.repeat(30),
  'a'.repeat(31),
  'a b',
  'ab cdefghijklmnopqrstuvwxyz0123456789',
  'é',
  'jané',
  'admin',
  'Admin',
  'settings',
  'listing',
  'unsubscribe',
  'open-house',
  'classic', // contains "ass": the substring check is deliberate and kept
  'hello',
  'hell',
  '!!',
  'x!',
  '   ',
  'jane.doe',
  'shit!',
  'ad',
];

describe('validateUsername', () => {
  it.each(CASES)('matches the old zod schema for %j', (input) => {
    expect(validateUsername(input)).toEqual(oldValidate(input));
  });

  it('accepts an ordinary username', () => {
    expect(validateUsername('jane-doe')).toEqual({ valid: true });
    expect(usernameError('jane-doe')).toBeNull();
  });

  it('reports the first rule broken, in the order the schema checked them', () => {
    // Too short and not matching the pattern: length is reported.
    expect(validateUsername('!')).toEqual({
      valid: false,
      error: 'Username must be at least 3 characters',
    });
    // Bad characters and profane: the pattern is reported.
    expect(validateUsername('shit!')).toEqual({
      valid: false,
      error: 'Username can only contain letters, numbers, hyphens, and underscores',
    });
    expect(validateUsername('admin')).toEqual({
      valid: false,
      error: 'This username is reserved',
    });
  });

  it('does not throw on a non-string reaching it from untyped code', () => {
    expect(validateUsername(undefined as unknown as string)).toEqual({
      valid: false,
      error: 'Invalid username',
    });
  });
});

describe('usernameValidation.ts imports', () => {
  it('does not import zod, so the Settings route does not download form-vendor', () => {
    const source = readFileSync(resolve(__dirname, 'usernameValidation.ts'), 'utf8');
    expect(source).not.toMatch(/from\s+['"]zod['"]/);
    expect(source).not.toMatch(/from\s+['"]react-hook-form['"]/);
    expect(source).not.toMatch(/from\s+['"]@hookform\//);
  });
});
