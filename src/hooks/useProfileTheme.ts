/**
 * The agent's theme on their public pages — the profile and each listing page
 * (US-275) — so moving from one to the other does not change colours.
 *
 * Moved out of FullProfilePage unchanged.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { applyTheme, getCurrentTheme, type ThemeConfig } from '@/lib/themes';
import { logger } from '@/lib/logger';

/**
 * Apply `theme` (a JSON string, a preset name, or an object) and return the
 * resolved config, or null until there is one.
 */
export function useProfileTheme(theme: unknown): ThemeConfig | null {
  const [activeTheme, setActiveTheme] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    if (!theme) return;
    try {
      if (typeof theme === 'string') {
        // Only parse what looks like JSON (starts with { or [).
        if (theme.trim().startsWith('{') || theme.trim().startsWith('[')) {
          setActiveTheme(JSON.parse(theme) as ThemeConfig);
          applyTheme(theme);
        } else {
          // A preset NAME, which is what the onboarding wizard stores (US-108).
          // getCurrentTheme falls back to 'modern' for an unknown name rather
          // than leaving the page unstyled.
          const preset = getCurrentTheme(theme);
          setActiveTheme(preset);
          applyTheme(JSON.stringify(preset));
        }
      } else {
        setActiveTheme(theme as ThemeConfig);
        applyTheme(JSON.stringify(theme));
      }
    } catch (e) {
      logger.error('Failed to apply profile theme', e as Error);
    }
  }, [theme]);

  return activeTheme;
}

/**
 * The <main> style of a public page. applyTheme writes only --theme-*;
 * Tailwind's bg-primary / text-primary-foreground read --primary, so they are
 * re-pointed here, on the public pages alone, to get the agent's colour rather
 * than the dashboard navy (US-247). Fallback is the 'modern' preset's #2563eb.
 */
export const PROFILE_MAIN_STYLE = {
  backgroundColor: `hsl(var(--theme-background, 217 33% 97%))`,
  color: `hsl(var(--theme-text, 222 47% 11%))`,
  '--primary': 'var(--theme-primary, 221 83% 53%)',
  '--primary-foreground': 'var(--theme-primary-foreground, 0 0% 100%)',
} as CSSProperties;
