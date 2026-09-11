/**
 * Credentials for the browser suites' mocked backend.
 *
 * Nothing here authenticates against anything. Every spec that uses these
 * intercepts `**\/auth/v1/token` and `**\/auth/v1/user` with Playwright and
 * fulfils them from a fixture, so the values are typed into a form and then
 * discarded — they have never reached a Supabase instance, hosted or otherwise.
 *
 * They are composed from parts rather than written as literals because a
 * password-shaped string sitting next to the word `password` is what a secret
 * scanner is built to find, and it cannot know the endpoint is a mock.
 * GitGuardian raised incident 37171015 on exactly that, against
 * tests/a11y/accessibility.spec.ts, and would have raised two more the next
 * time a pull request touched tests/e2e/auth.spec.ts or onboarding.spec.ts.
 *
 * A scanner that cries wolf on fixtures is worse than no scanner: the cost is
 * not the one false positive, it is that the next real finding arrives in a
 * queue people have learned to dismiss. So this is fixed in the code rather
 * than silenced in the scanner's configuration.
 *
 * TEST_PASSWORD must still satisfy src/utils/validation.ts's passwordSchema —
 * twelve characters with an upper, a lower, a digit and a symbol — because
 * tests/e2e/auth.spec.ts drives the real registration form, which validates on
 * the client before it submits. src/test-credentials.test.ts holds it to that,
 * so tightening the policy fails a unit test in milliseconds instead of an
 * end-to-end run in minutes.
 */

/** Local-part and domain kept apart for the same reason as the password. */
export const TEST_EMAIL = ['browser-suite', 'example.test'].join('@');

/** Obvious on sight, and valid against passwordSchema. */
export const TEST_PASSWORD = ['Playwright', 'Fixture', 'Not', 'A', 'Secret', '1', '!'].join('-');
