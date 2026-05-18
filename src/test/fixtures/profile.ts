import type { Profile } from '@/types/database';

export const mockProfile: Profile = {
  id: '11111111-1111-1111-1111-111111111111',
  username: 'janedoe',
  full_name: 'Jane Doe',
  bio: 'Top-producing real estate agent serving the metro area.',
  avatar_url: 'https://example.com/avatars/jane.jpg',
  theme: 'default',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
};

export const mockAdminProfile: Profile = {
  ...mockProfile,
  id: '22222222-2222-2222-2222-222222222222',
  username: 'adminuser',
  full_name: 'Admin User',
  bio: 'Platform administrator.',
};

export const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  ...mockProfile,
  ...overrides,
});
