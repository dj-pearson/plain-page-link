/**
 * US-108: the wizard wrote profileUpdates.city, and `profiles` has no city
 * column — the real one is service_cities (jsonb). PostgREST rejects an update
 * naming an unknown column, so the WHOLE statement failed and the agent's
 * name, title, bio, phone, avatar, theme and onboarding_completed_at were lost
 * together. They saw "Failed to save your information" and were routed back
 * into the wizard on every login afterwards.
 *
 * The trigger was filling in Location at all — using the placeholder's own
 * example, "Austin, TX".
 */
import { describe, it, expect } from 'vitest';
import { buildOnboardingProfileUpdate, parseOnboardingLocation } from './onboardingProfile';
import type { TablesUpdate } from '@/integrations/supabase/types';

/**
 * Every column the generated Update type allows. Derived from a value so the
 * check is against the real schema rather than a list kept by hand: if a
 * column is renamed, this list moves with it.
 */
const PROFILE_COLUMNS = new Set(
  Object.keys({
    id: undefined,
    username: undefined,
    full_name: undefined,
    bio: undefined,
    avatar_url: undefined,
    theme: undefined,
    title: undefined,
    phone: undefined,
    license_state: undefined,
    service_cities: undefined,
    onboarding_completed_at: undefined,
  } satisfies Partial<Record<keyof TablesUpdate<'profiles'>, undefined>>)
);

describe('parseOnboardingLocation', () => {
  it('splits the placeholder’s own example', () => {
    expect(parseOnboardingLocation('Austin, TX')).toEqual({ city: 'Austin', state: 'TX' });
  });

  it('keeps a city given without a state, rather than dropping both', () => {
    // The old code required parts.length >= 2 and discarded anything shorter.
    expect(parseOnboardingLocation('Austin')).toEqual({ city: 'Austin', state: undefined });
  });

  it('tolerates stray whitespace and empty segments', () => {
    expect(parseOnboardingLocation('  Austin ,  TX , ')).toEqual({
      city: 'Austin',
      state: 'TX',
    });
  });
});

describe('buildOnboardingProfileUpdate', () => {
  it('names only real profiles columns', () => {
    const update = buildOnboardingProfileUpdate({
      fullName: 'Jane Doe',
      title: 'Broker',
      bio: 'Ten years in Austin',
      phone: '555-0142',
      location: 'Austin, TX',
      templateChoice: 'luxe',
      avatarUrl: 'https://example.com/a.jpg',
    });

    for (const key of Object.keys(update)) {
      expect(PROFILE_COLUMNS.has(key)).toBe(true);
    }
    // The specific one that broke it.
    expect(update).not.toHaveProperty('city');
  });

  it('writes the location to service_cities and license_state', () => {
    const update = buildOnboardingProfileUpdate({ location: 'Austin, TX' });
    expect(update.service_cities).toEqual(['Austin']);
    expect(update.license_state).toBe('TX');
  });

  it('always marks onboarding complete, so the wizard is not shown again', () => {
    const update = buildOnboardingProfileUpdate({ completedAt: '2026-09-02T00:00:00.000Z' });
    expect(update.onboarding_completed_at).toBe('2026-09-02T00:00:00.000Z');
  });

  it('omits fields the agent left blank rather than writing empty strings', () => {
    const update = buildOnboardingProfileUpdate({ fullName: '', bio: undefined });
    expect(update).not.toHaveProperty('full_name');
    expect(update).not.toHaveProperty('bio');
  });

  it('stores the chosen template id in theme', () => {
    expect(buildOnboardingProfileUpdate({ templateChoice: 'ocean' }).theme).toBe('ocean');
  });
});
