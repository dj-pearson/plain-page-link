import type { Profile } from '@/types/database';

/**
 * Every column on `profiles`, not a convenient subset.
 *
 * `Profile` now derives from the generated row type, so a fixture that omits a
 * column is a compile error rather than a test that silently exercises a shape
 * production never produces.
 */

export const mockProfile: Profile = {
  id: '11111111-1111-1111-1111-111111111111',
  username: 'janedoe',
  full_name: 'Jane Doe',
  bio: 'Top-producing real estate agent serving the metro area.',
  avatar_url: 'https://example.com/avatars/jane.jpg',
  theme: 'default',

  // Professional
  title: 'Broker Associate',
  license_number: 'RE-000123',
  license_state: 'UT',
  brokerage_name: 'Metro Realty Group',
  brokerage_logo: null,
  years_experience: 8,
  specialties: ['Residential', 'First-time buyers'],
  certifications: ['ABR'],
  service_cities: ['Salt Lake City'],
  service_zip_codes: ['84101'],

  // Contact
  phone: '+15555550123',
  sms_enabled: true,
  email_display: 'jane@example.com',
  calendly_url: null,
  zapier_webhook_url: null,

  // Social
  instagram_url: null,
  facebook_url: null,
  linkedin_url: null,
  tiktok_url: null,
  youtube_url: null,
  zillow_url: null,
  realtor_com_url: null,
  website_url: null,

  // Page + SEO
  seo_title: null,
  seo_description: null,
  og_image: null,
  custom_css: null,
  custom_domain: null,
  is_published: true,

  // Denormalised counters
  view_count: 0,
  lead_count: 0,
  link_click_count: 0,

  notification_preferences: {},
  onboarding_completed_at: null,
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
