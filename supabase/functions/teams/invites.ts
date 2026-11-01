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

// ---------------------------------------------------------------------------
// Abuse limits (US-259)
//
// An invite sends mail from our domain to any address the caller types, with a
// team name the caller chose in the subject and body. Without limits any
// signed-in account could use it to mass-mail strangers ("Claim your refund at
// evil.example") on AgentBio's sending reputation.
// ---------------------------------------------------------------------------

/** Shape of _shared/rate-limiter.ts RateLimitConfig, kept local so this stays pure. */
interface InviteRateLimit {
  maxRequests: number;
  windowSeconds: number;
  failClosed: boolean;
}

export const INVITE_LIMITS: { perSender: InviteRateLimit; perRecipient: InviteRateLimit } = {
  // A brokerage onboarding its agents fits in a day; a spam run does not.
  perSender: { maxRequests: 20, windowSeconds: 24 * 60 * 60, failClosed: true },
  // One address cannot be hammered by re-inviting it, from one team or many.
  perRecipient: { maxRequests: 3, windowSeconds: 24 * 60 * 60, failClosed: true },
};

/** TeamPage reads an owner's team with maybeSingle(), so one is all the UI supports. */
export const MAX_TEAMS_PER_OWNER = 1;

export const MAX_TEAM_NAME_LENGTH = 80;

/** A single plain address: no display name, no list, sane length. */
export function isInvitableEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  return email.length <= 254 && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;".]+$/.test(email);
}

export function normaliseTeamName(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_TEAM_NAME_LENGTH).trim();
}

/**
 * The team name as it may appear in an invitation email: anything a mail
 * client would turn into a link — a URL with any scheme, www.*, or a bare
 * domain such as evil.example/login — is removed, so the name cannot carry a
 * phishing link in our mail.
 */
export function teamNameForEmail(name: string): string {
  const cleaned = normaliseTeamName(name)
    .replace(/[a-z][a-z0-9+.-]*:\/\/\S*/gi, ' ')
    .replace(/\bwww\.\S*/gi, ' ')
    .replace(/\S*[a-z0-9-]\.[a-z]{2,}\b\S*/gi, ' ')
    .replace(/[<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'their team';
}
