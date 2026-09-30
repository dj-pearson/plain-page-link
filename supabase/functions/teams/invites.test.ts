import { describe, it, expect } from 'vitest';
import { generateInviteToken, hashInviteToken, inviteAcceptUrl, INVITE_TOKEN_RE } from './invites.ts';

describe('team invite tokens (US-226)', () => {
  it('are 256-bit hex and unique', () => {
    const a = generateInviteToken();
    const b = generateInviteToken();
    expect(a).toMatch(INVITE_TOKEN_RE);
    expect(a).not.toBe(b);
  });

  it('are stored as a stable SHA-256 that is not the token', async () => {
    const t = generateInviteToken();
    const h = await hashInviteToken(t);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).not.toBe(t);
    expect(await hashInviteToken(t)).toBe(h);
  });

  it('link to the accept page with the team and token', () => {
    const url = new URL(inviteAcceptUrl('https://agentbio.net', 'team-1', 'abc'));
    expect(url.pathname).toBe('/team/accept');
    expect(url.searchParams.get('team')).toBe('team-1');
    expect(url.searchParams.get('token')).toBe('abc');
  });
});
