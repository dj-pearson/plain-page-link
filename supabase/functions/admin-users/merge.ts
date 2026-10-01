/**
 * Joins auth users with their profile, role and subscription for the admin
 * Users panel (US-231). Pure, for vitest.
 */

export interface AuthUserLike {
  id: string;
  email?: string | null;
  created_at: string;
  last_sign_in_at?: string | null;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  username: string | null;
  full_name: string | null;
  role: string;
  plan_name: string | null;
  subscription_status: string | null;
  stripe_customer_id: string | null;
}

export interface AdminUserStats {
  total: number;
  /** Signed in during the last 7 days — real activity, not profiles.updated_at. */
  active7d: number;
  active24h: number;
  admins: number;
  subscribed: number;
}

export function mergeUsers(
  users: AuthUserLike[],
  profiles: { id: string; username?: string | null; full_name?: string | null }[],
  roles: { user_id: string; role: string }[],
  subs: { user_id: string; plan_name?: string | null; status?: string | null; stripe_customer_id?: string | null }[]
): AdminUserRow[] {
  const profileBy = new Map(profiles.map((p) => [p.id, p]));
  const adminIds = new Set(roles.filter((r) => r.role === 'admin').map((r) => r.user_id));
  const subBy = new Map(subs.map((s) => [s.user_id, s]));
  return users.map((u) => {
    const p = profileBy.get(u.id);
    const s = subBy.get(u.id);
    return {
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      username: p?.username ?? null,
      full_name: p?.full_name ?? null,
      role: adminIds.has(u.id) ? 'admin' : 'user',
      plan_name: s?.plan_name ?? null,
      subscription_status: s?.status ?? null,
      stripe_customer_id: s?.stripe_customer_id ?? null,
    };
  });
}

export function searchUsers(rows: AdminUserRow[], term: string | undefined): AdminUserRow[] {
  const t = term?.trim().toLowerCase();
  if (!t) return rows;
  return rows.filter(
    (r) =>
      r.email?.toLowerCase().includes(t) ||
      r.username?.toLowerCase().includes(t) ||
      r.full_name?.toLowerCase().includes(t) ||
      r.id.toLowerCase().startsWith(t)
  );
}

export function userStats(rows: AdminUserRow[], now: Date = new Date()): AdminUserStats {
  const since = (days: number) => now.getTime() - days * 86_400_000;
  const signedInSince = (ms: number) => (r: AdminUserRow) =>
    !!r.last_sign_in_at && new Date(r.last_sign_in_at).getTime() >= ms;
  return {
    total: rows.length,
    active7d: rows.filter(signedInSince(since(7))).length,
    active24h: rows.filter(signedInSince(since(1))).length,
    admins: rows.filter((r) => r.role === 'admin').length,
    subscribed: rows.filter((r) => r.subscription_status === 'active' || r.subscription_status === 'past_due').length,
  };
}
