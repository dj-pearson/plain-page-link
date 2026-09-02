/**
 * US-108: the wizard's template step was mandatory and changed nothing.
 *
 * Two of its four ids — 'luxury' and 'coastal' — are not themes; the real ids
 * are 'luxe' and 'ocean'. The id is stored verbatim in profiles.theme and
 * looked up with getCurrentTheme, so those two silently resolved to the
 * fallback. On top of that FullProfilePage skipped preset names entirely
 * ("It's just a theme name like default, skip applying"), so all four did.
 *
 * This is the check that would have caught it: an id that is not a real theme
 * fails here rather than on a stranger's public page.
 */
import { describe, it, expect } from 'vitest';
import { ONBOARDING_TEMPLATES } from './OnboardingWizard';
import { DEFAULT_THEMES, getCurrentTheme } from '@/lib/themes';

describe('ONBOARDING_TEMPLATES', () => {
  const themeIds = new Set(DEFAULT_THEMES.map((t) => t.id));

  it.each(ONBOARDING_TEMPLATES.map((t) => [t.id, t.name]))(
    'template %s (%s) is a real theme id',
    (id) => {
      expect(themeIds.has(id as string)).toBe(true);
    }
  );

  it('resolves each template to the theme the agent picked, not the fallback', () => {
    const fallback = getCurrentTheme('definitely-not-a-theme');
    for (const template of ONBOARDING_TEMPLATES) {
      const resolved = getCurrentTheme(template.id);
      expect(resolved.id).toBe(template.id);
      // 'modern' is itself a template, so only the others must differ from the
      // fallback — the point is that an unknown id and a real one are not the
      // same outcome.
      if (template.id !== fallback.id) {
        expect(resolved.id).not.toBe(fallback.id);
      }
    }
  });

  it('offers a distinct choice per card', () => {
    const ids = ONBOARDING_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
