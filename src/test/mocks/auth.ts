import type { Session, User } from '@supabase/supabase-js';

export const mockAuthenticatedUser: User = {
  id: '11111111-1111-1111-1111-111111111111',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Jane Doe' },
  aud: 'authenticated',
  email: 'jane.doe@example.com',
  phone: '',
  created_at: '2026-01-01T00:00:00.000Z',
  confirmed_at: '2026-01-01T00:00:00.000Z',
  email_confirmed_at: '2026-01-01T00:00:00.000Z',
  last_sign_in_at: '2026-03-01T00:00:00.000Z',
  role: 'authenticated',
  updated_at: '2026-03-01T00:00:00.000Z',
  identities: [],
  is_anonymous: false,
};

export const mockAdminUser: User = {
  ...mockAuthenticatedUser,
  id: '22222222-2222-2222-2222-222222222222',
  email: 'admin@example.com',
  user_metadata: { full_name: 'Admin User', role: 'admin' },
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockAuthenticatedUser,
};

/** Represents an unauthenticated state. */
export const mockUnauthenticated = {
  user: null as User | null,
  session: null as Session | null,
};
