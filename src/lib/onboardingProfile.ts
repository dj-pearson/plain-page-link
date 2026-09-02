/**
 * Turns what the onboarding wizard collected into a `profiles` update.
 *
 * Extracted from OnboardingWizardPage so it can be tested. It was inline and
 * typed `any`, which is exactly how US-108 happened: the wizard set
 * `profileUpdates.city`, and `profiles` has no city column — the real one is
 * `service_cities` (jsonb). PostgREST rejects an update naming an unknown
 * column, so the whole statement failed and the agent's name, title, bio,
 * phone, avatar, theme AND onboarding_completed_at were lost together. The
 * agent saw "Failed to save your information" and was routed back into the
 * wizard on every login afterwards.
 *
 * The return type is derived from the generated row, so an invented column is
 * now a compile error rather than a run-time rejection. It is `Partial<Profile>`
 * rather than `TablesUpdate<'profiles'>` so the result can go straight to
 * useAuthStore.updateProfile — the store has to end up holding the saved row,
 * or ProtectedRoute's first-run gate sends the agent it just onboarded back
 * into the wizard.
 */
import type { Profile } from '@/types/profile';

export interface OnboardingProfileInput {
  fullName?: string;
  title?: string;
  bio?: string;
  phone?: string;
  /** Free text, e.g. "Austin, TX". */
  location?: string;
  /** A DEFAULT_THEMES id. */
  templateChoice?: string | null;
  avatarUrl?: string | null;
  completedAt?: string;
}

/**
 * Splits "Austin, TX" into a service city and a licence state.
 *
 * A location with no comma is still a city worth keeping — the previous code
 * required `parts.length >= 2` and dropped anything else on the floor.
 */
export function parseOnboardingLocation(location: string): {
  city?: string;
  state?: string;
} {
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return { city: parts[0], state: parts[1] };
}

export function buildOnboardingProfileUpdate(input: OnboardingProfileInput): Partial<Profile> {
  const updates: Partial<Profile> = {};

  if (input.fullName) updates.full_name = input.fullName;
  if (input.title) updates.title = input.title;
  if (input.bio) updates.bio = input.bio;
  if (input.phone) updates.phone = input.phone;

  if (input.location) {
    const { city, state } = parseOnboardingLocation(input.location);
    // service_cities is jsonb, not a `city` text column.
    if (city) updates.service_cities = [city];
    if (state) updates.license_state = state;
  }

  if (input.avatarUrl) updates.avatar_url = input.avatarUrl;
  if (input.templateChoice) updates.theme = input.templateChoice;

  // Always set, so the wizard is not shown again.
  updates.onboarding_completed_at = input.completedAt ?? new Date().toISOString();

  return updates;
}
