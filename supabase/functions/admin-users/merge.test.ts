import { describe, it, expect } from 'vitest';
import { mergeUsers, searchUsers, userStats } from './merge.ts';

const now = new Date('2026-10-01T12:00:00Z');
const users = [
  { id: 'u1', email: 'dana@example.com', created_at: '2026-01-01', last_sign_in_at: '2026-09-30T12:00:00Z' },
  { id: 'u2', email: 'sam@example.com', created_at: '2026-02-01', last_sign_in_at: '2026-08-01T00:00:00Z' },
  { id: 'u3', email: 'admin@example.com', created_at: '2026-03-01', last_sign_in_at: null },
];
const rows = mergeUsers(
  users,
  [{ id: 'u1', username: 'danarivers', full_name: 'Dana Rivers' }],
  [{ user_id: 'u3', role: 'admin' }, { user_id: 'u1', role: 'user' }],
  [{ user_id: 'u1', plan_name: 'professional', status: 'active', stripe_customer_id: 'cus_1' }]
);

describe('admin users (US-231)', () => {
  it('joins profile, role and subscription', () => {
    expect(rows[0]).toMatchObject({ username: 'danarivers', role: 'user', plan_name: 'professional', stripe_customer_id: 'cus_1' });
    expect(rows[2].role).toBe('admin');
  });

  it('searches email, username and name', () => {
    expect(searchUsers(rows, 'rivers').map((r) => r.id)).toEqual(['u1']);
    expect(searchUsers(rows, 'SAM@').map((r) => r.id)).toEqual(['u2']);
    expect(searchUsers(rows, '')).toHaveLength(3);
  });

  it('counts activity by last sign-in, not by profile edits', () => {
    expect(userStats(rows, now)).toEqual({ total: 3, active7d: 1, active24h: 1, admins: 1, subscribed: 1 });
  });
});
