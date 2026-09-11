/**
 * The browser suites' fixture password must satisfy the real password policy.
 *
 * tests/e2e/auth.spec.ts drives the actual registration form, which validates
 * with src/utils/validation.ts's passwordSchema on the client before it
 * submits. So a fixture that does not meet the policy does not fail loudly — it
 * fails as a form that never submits, in an end-to-end run, minutes later, with
 * a timeout for a message.
 *
 * Holding it here means tightening the policy breaks a millisecond of unit test
 * instead, and says exactly why.
 */
import { describe, it, expect } from 'vitest';
import { passwordSchema, emailSchema } from '@/utils/validation';
import { TEST_EMAIL, TEST_PASSWORD } from '../tests/support/credentials';

describe('browser-suite fixture credentials', () => {
  it('satisfies the password policy the registration form enforces', () => {
    const result = passwordSchema.safeParse(TEST_PASSWORD);
    expect(
      result.success,
      `TEST_PASSWORD no longer meets passwordSchema: ${result.success ? '' : result.error.issues.map((i) => i.message).join('; ')}`
    ).toBe(true);
  });

  it('uses an address the login form will accept', () => {
    expect(emailSchema.safeParse(TEST_EMAIL).success).toBe(true);
  });

  it('reads as a fixture rather than a credential', () => {
    // The point of composing these is that a secret scanner cannot tell a
    // mocked endpoint from a real one, so the value itself has to say so.
    // GitGuardian incident 37171015 was raised on the literal this replaced.
    expect(TEST_PASSWORD.toLowerCase()).toContain('fixture');
    expect(TEST_PASSWORD.toLowerCase()).toContain('not-a-secret');
    expect(TEST_EMAIL).toMatch(/\.test$/);
  });
});
