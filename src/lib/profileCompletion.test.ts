import { describe, expect, it } from 'vitest';
import {
  buildCompletionSteps,
  nextCompletionStep,
  profileTabFromSearch,
  type CompletionProfile,
} from './profileCompletion';

const done: CompletionProfile = {
  avatar_url: 'https://cdn.example.com/a.jpg',
  bio: 'x'.repeat(60),
  phone: '555-0100',
  email_display: null,
  theme: 'modern',
  brokerage_logo: 'https://cdn.example.com/logo.png',
  service_cities: ['Austin'],
  service_zip_codes: [],
  is_published: true,
};
const counts = { listings: 1, testimonials: 1, links: 1 };

const step = (profile: CompletionProfile, id: string) =>
  buildCompletionSteps(profile, counts).find((s) => s.id === id);

describe('buildCompletionSteps', () => {
  it('is all complete for a finished, published profile', () => {
    expect(buildCompletionSteps(done, counts).every((s) => s.completed)).toBe(true);
  });

  it('counts the publish state; only true is live', () => {
    expect(step({ ...done, is_published: false }, 'publish')?.completed).toBe(false);
    expect(step({ ...done, is_published: null }, 'publish')?.completed).toBe(false);
    expect(step(done, 'publish')?.link).toBe('/dashboard/settings#publish');
  });

  it('counts the brokerage logo, ignoring blanks', () => {
    expect(step({ ...done, brokerage_logo: null }, 'brokerage-logo')?.completed).toBe(false);
    expect(step({ ...done, brokerage_logo: '  ' }, 'brokerage-logo')?.completed).toBe(false);
    expect(step(done, 'brokerage-logo')?.link).toBe('/dashboard/profile?tab=professional');
  });

  it('counts service areas from cities or ZIP codes', () => {
    const none = { ...done, service_cities: [], service_zip_codes: null };
    expect(step(none, 'service-areas')?.completed).toBe(false);
    expect(step({ ...none, service_zip_codes: ['78701'] }, 'service-areas')?.completed).toBe(true);
    expect(step({ ...none, service_cities: ['Austin'] }, 'service-areas')?.completed).toBe(true);
  });

  it('an unpublished but otherwise finished page is not 100%', () => {
    const steps = buildCompletionSteps({ ...done, is_published: false }, counts);
    expect(steps.filter((s) => s.completed).length).toBe(steps.length - 1);
  });
});

describe('nextCompletionStep', () => {
  it('suggests photo, bio and contact before publishing', () => {
    const fresh: CompletionProfile = { ...done, avatar_url: null, is_published: false };
    expect(nextCompletionStep(buildCompletionSteps(fresh, counts))?.id).toBe('avatar');
  });

  it('suggests publishing ahead of medium and low steps', () => {
    const steps = buildCompletionSteps(
      { ...done, is_published: false, brokerage_logo: null },
      { listings: 0, testimonials: 0, links: 0 }
    );
    expect(nextCompletionStep(steps)?.id).toBe('publish');
  });
});

describe('profileTabFromSearch', () => {
  it('reads a known tab and falls back to basic', () => {
    expect(profileTabFromSearch('?tab=service')).toBe('service');
    expect(profileTabFromSearch('?tab=nope')).toBe('basic');
    expect(profileTabFromSearch('')).toBe('basic');
  });
});
