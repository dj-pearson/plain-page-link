/**
 * Authorization guards on the six edge functions US-119 was about.
 *
 * These are SOURCE assertions, not live probes, and the difference matters:
 * there is no Deno runtime and no Supabase instance in CI or in a sandbox, so
 * nothing here proves the deployed function refuses a request. What they do
 * prove is that the guard is still in the file — which is the failure mode that
 * actually happens, someone deleting a check while changing something else.
 *
 * The behavioural half lives where the logic is pure and testable:
 *   _shared/validation.test.ts   the webhook allow-list
 *   src/lib/webhookUrl.test.ts   the same list, client side
 *   src/lib/pii.test.ts          the client never sends ciphertext to be opened
 *   scripts/verify-schema.mjs    audit redaction, per-address lockout, the CHECK
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FUNCTIONS = join(process.cwd(), 'supabase/functions');
const read = (name: string) => readFileSync(join(FUNCTIONS, name, 'index.ts'), 'utf8');

test.describe('Edge function authorization (US-119)', () => {
  test('test-article-webhook: admin only, guarded fetch, no echoed body', () => {
    const source = read('test-article-webhook');

    // It was completely unauthenticated, POSTed to a body-supplied URL, and
    // returned the response body — an internal read primitive on a network that
    // reaches postgres-meta, Kong and GoTrue.
    expect(source, 'must require an admin').toContain('requireAdmin');
    expect(source, 'must use the SSRF guard').toContain('safeFetch');
    expect(source, 'must check the destination allow-list').toContain('isValidWebhookUrl');
    expect(source, 'must not fetch unguarded').not.toMatch(/\bawait fetch\(/);
    expect(source, 'must not return the response body').not.toContain('responseBody');
    expect(source, 'must not read the response body at all').not.toContain('response.text()');
  });

  test('publish-article-to-social: guards the stored webhook before fetching it', () => {
    const source = read('publish-article-to-social');

    expect(source).toContain('isValidWebhookUrl');
    expect(source).toContain('safeFetch');
    expect(source, 'must not fetch the stored URL unguarded').not.toMatch(
      /await fetch\(webhook\.webhook_url/
    );
  });

  test('send-welcome-email: the address comes from the account, not the body', () => {
    const source = read('send-welcome-email');

    // It took `to`, `full_name` and `username` from an unauthenticated body: an
    // AgentBio-branded relay from noreply@agentbio.net to any address.
    expect(source, 'must authenticate the caller').toContain('requireAuth');
    expect(source, 'must read the address from auth.users').toContain(
      'supabase.auth.admin.getUserById'
    );
    expect(source, 'must not send to a body-supplied address').not.toContain('to: data.email');
    expect(source).not.toMatch(/data\.username/);
  });

  test('login-security: rate limited, and it never trusts a body userId', () => {
    const source = read('login-security');

    expect(source, 'must rate limit by address').toContain('checkRateLimitDb');
    expect(source, 'must resolve the caller from the JWT').toContain('callerId');
    // register_session inserted a user_sessions row for whatever userId the
    // body named, and record_attempt attributed failures to any account. The
    // assertion is about where the value COMES FROM, not what it is called:
    // `user_id: userId` is still in the insert and is now safe, because userId
    // is assigned from the JWT rather than destructured from the body.
    expect(source, 'register_session must not read userId from the body').not.toMatch(
      /const \{[^}]*\buserId\b[^}]*\} = body as RegisterSessionRequest/
    );
    expect(source, 'the session owner must come from the JWT').toContain(
      'const userId = callerId;'
    );
    expect(source, 'a recorded attempt must not be attributed to a body-supplied user').not.toMatch(
      /p_user_id:\s*userId\s*\|\|/
    );
  });

  test('execute-workflow: refuses an execution the caller does not own', () => {
    const source = read('execute-workflow');

    // It loaded workflow_executions with the service-role client and never
    // compared user.id, so any authenticated user could run anyone's workflow.
    expect(source).toContain('workflow.user_id !== user.id');
  });

  test('submit-lead: guards the agent-controlled Zapier URL', () => {
    const source = read('submit-lead');

    expect(source).toContain('isValidWebhookUrl(zapierWebhookUrl)');
    expect(source).toContain('safeFetch(zapierWebhookUrl');
    expect(source, 'must not fetch it unguarded').not.toMatch(/await fetch\(zapierWebhookUrl/);
  });

  test('pii-crypto: decrypts by row id, never a caller-supplied ciphertext', () => {
    const source = read('pii-crypto');

    // `decrypt` took up to 200 arbitrary ciphertexts and returned plaintext to
    // any valid JWT — and audit_logs held a copy of every ciphertext ever
    // written for `leads`.
    expect(source, 'the raw decrypt op must be gone').not.toMatch(/op !== 'decrypt'/);
    expect(source).toContain("op === 'decrypt_leads'");
    expect(source).toContain("op === 'decrypt_profile'");
    expect(source, 'must scope reads to the caller').toContain(".eq('user_id', user.id)");
  });
});
