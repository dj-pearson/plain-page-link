/**
 * Team invite tokens (US-226). Pure, so vitest can hold the contract.
 *
 * The raw token travels only in the emailed link; team_members stores its
 * SHA-256, because the roster is readable by every member of the team.
 */

export function generateInviteToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashInviteToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export function inviteAcceptUrl(siteUrl: string, teamId: string, token: string): string {
  const url = new URL('/team/accept', siteUrl);
  url.searchParams.set('team', teamId);
  url.searchParams.set('token', token);
  return url.toString();
}

export const INVITE_TOKEN_RE = /^[0-9a-f]{64}$/;
