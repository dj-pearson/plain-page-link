/**
 * Slugs for page-builder pages (US-116).
 *
 * `custom_pages` has a UNIQUE (user_id, slug) constraint, and PageList created
 * every page with `slug = profile.username`. So an agent's second page failed
 * on custom_pages_user_id_slug_key and the editor said "Failed to save page",
 * with no indication that the name was the problem and no slug field to change
 * it in — PageBuilder's meta editor only ever exposed the title.
 */

/** Reserved words a page slug must not take, because a route already owns them. */
const RESERVED_SLUGS = new Set([
  'auth',
  'admin',
  'dashboard',
  'onboarding',
  'blog',
  'features',
  'for',
  'tools',
  'legal',
  'pricing',
  'about',
  'contact',
  'help',
  'support',
  'api',
  'assets',
  'p',
  'review',
  'new',
  'edit',
]);

export const SLUG_MAX_LENGTH = 60;

/**
 * Normalise free text into a URL-safe slug.
 *
 * Returns '' for input that contains nothing usable, so callers can fall back
 * rather than producing a slug of bare hyphens.
 */
export function slugify(input: string): string {
  return (
    input
      .normalize('NFKD')
      // Strip combining marks, so "Peña" becomes "pena" rather than "pea".
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, SLUG_MAX_LENGTH)
      .replace(/-+$/g, '')
  );
}

export interface SlugProblem {
  valid: boolean;
  error?: string;
}

/** What the slug editor rejects before a save is attempted. */
export function validateSlug(slug: string, taken: string[] = []): SlugProblem {
  if (!slug) return { valid: false, error: 'A page address is required.' };
  if (slug.length > SLUG_MAX_LENGTH) {
    return { valid: false, error: `Keep it to ${SLUG_MAX_LENGTH} characters or fewer.` };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      error: 'Use lowercase letters, numbers and single hyphens.',
    };
  }
  if (RESERVED_SLUGS.has(slug)) {
    return { valid: false, error: `"${slug}" is reserved. Pick another address.` };
  }
  if (taken.includes(slug)) {
    return { valid: false, error: 'You already have a page at that address.' };
  }
  return { valid: true };
}

/**
 * A slug that does not collide with the agent's existing pages.
 *
 * Suffixes rather than rejects, because this runs when the agent presses
 * "New page" and has not been asked for an address yet. They can change it
 * afterwards in the editor.
 */
export function uniqueSlug(desired: string, taken: string[]): string {
  const base = slugify(desired) || 'page';
  const used = new Set(taken);
  if (!used.has(base) && !RESERVED_SLUGS.has(base)) return base;

  for (let n = 2; n < 1000; n++) {
    const candidate = `${base.slice(0, SLUG_MAX_LENGTH - String(n).length - 1)}-${n}`;
    if (!used.has(candidate) && !RESERVED_SLUGS.has(candidate)) return candidate;
  }
  // A thousand pages with the same name is not a case worth handling neatly,
  // but it must still produce something unique rather than a duplicate.
  return `${base.slice(0, 40)}-${Date.now()}`;
}
