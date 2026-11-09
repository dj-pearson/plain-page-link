import { describe, it, expect } from 'vitest';
import {
  generateInviteToken,
  hashInviteToken,
  inviteAcceptUrl,
  INVITE_TOKEN_RE,
  INVITE_LIMITS,
  MAX_TEAMS_PER_OWNER,
  MAX_TEAM_NAME_LENGTH,
  isInvitableEmail,
  leaveTeamRefusal,
  normaliseTeamName,
  teamNameForEmail,
} from './invites.ts';

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

describe('team invite abuse limits (US-259)', () => {
  it('cap invites per sender per day and per recipient, failing closed', () => {
    expect(INVITE_LIMITS.perSender).toEqual({ maxRequests: 20, windowSeconds: 86400, failClosed: true });
    expect(INVITE_LIMITS.perRecipient.failClosed).toBe(true);
    expect(INVITE_LIMITS.perRecipient.maxRequests).toBeLessThanOrEqual(3);
    expect(INVITE_LIMITS.perRecipient.windowSeconds).toBeGreaterThanOrEqual(86400);
  });

  it('one team per owner (TeamPage reads it with maybeSingle)', () => {
    expect(MAX_TEAMS_PER_OWNER).toBe(1);
  });

  it('accepts a single plain address only', () => {
    expect(isInvitableEmail('jane@example.com')).toBe(true);
    expect(isInvitableEmail('not-an-email')).toBe(false);
    expect(isInvitableEmail('a@b.com, c@d.com')).toBe(false);
    expect(isInvitableEmail('Jane <jane@example.com>')).toBe(false);
    expect(isInvitableEmail('x'.repeat(250) + '@example.com')).toBe(false);
    expect(isInvitableEmail(42)).toBe(false);
  });

  it('team names are trimmed, collapsed and length-capped', () => {
    expect(normaliseTeamName('  The   Smith\nGroup ')).toBe('The Smith Group');
    expect(normaliseTeamName('x'.repeat(200))).toHaveLength(MAX_TEAM_NAME_LENGTH);
    expect(normaliseTeamName('   ')).toBe('');
    expect(normaliseTeamName(undefined)).toBe('');
  });

  it('strip links from the team name before it goes into an email', () => {
    const cases: Array<[string, string]> = [
      ['Smith Group', 'Smith Group'],
      ['Claim your prize at https://evil.example/win now', 'Claim your prize at now'],
      ['Visit www.evil.example', 'Visit'],
      ['Go to evil-site.com/login', 'Go to'],
      ['Bit.ly/x free money', 'free money'],
      ['hxxp://evil.example', ''],
    ];
    for (const [input, out] of cases) expect(teamNameForEmail(input), input).toBe(out || 'their team');
    for (const [input] of cases) {
      expect(teamNameForEmail(input)).not.toMatch(/https?:|www\.|\.(com|example|ly)\b|:\/\//i);
    }
  });
});

describe('leaveTeamRefusal (US-430)', () => {
  it('lets a member whose row was removed leave', () => {
    expect(leaveTeamRefusal({ teamExists: true, isOwner: false, rowsRemoved: 1 })).toBeNull();
  });

  it('refuses the owner with a conflict', () => {
    expect(leaveTeamRefusal({ teamExists: true, isOwner: true, rowsRemoved: 0 })).toMatchObject({
      code: 'OWNER_CANNOT_LEAVE',
      status: 409,
    });
  });

  it('answers 404 for a missing team or a caller with no accepted row', () => {
    expect(leaveTeamRefusal({ teamExists: false, isOwner: false, rowsRemoved: 0 })?.status).toBe(404);
    expect(leaveTeamRefusal({ teamExists: true, isOwner: false, rowsRemoved: 0 })).toMatchObject({
      code: 'NOT_FOUND',
      status: 404,
    });
  });
});
