import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { Badge, badgeVariants } from './badge';

describe('Badge', () => {
  it('renders its content', () => {
    renderWithProviders(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies the default variant styling', () => {
    renderWithProviders(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-gray-900');
  });

  it('applies the destructive variant styling', () => {
    renderWithProviders(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-red-600');
  });

  /**
   * US-193: three of the six variants failed WCAG AA and nothing said so.
   * Badge text is 12px semibold — "normal text" under WCAG, so 4.5:1 — and
   * white on yellow-500 was 1.92:1, a pale label on a bright field. The
   * detector only flagged one of the three, because it looks for grey on
   * colour and says nothing about white on colour.
   *
   * Tailwind's palette is a fixed table, so the pairing can be checked here
   * instead of being eyeballed once and drifting afterwards. If a variant's
   * shade changes, this fails rather than the contrast quietly regressing.
   */
  describe('contrast', () => {
    const TAILWIND: Record<string, string> = {
      white: '#ffffff',
      'gray-50': '#f9fafb',
      'gray-100': '#f3f4f6',
      'gray-800': '#1f2937',
      'gray-900': '#111827',
      // The dark theme's --background / --card, hsl(222.2 84% 4.9%), and the
      // light theme's white page: the surfaces an outline badge sits on.
      'dark-surface': '#020817',
      'red-600': '#dc2626',
      'green-700': '#15803d',
      'amber-700': '#b45309',
    };

    /** WCAG 2.1 relative luminance. */
    const luminance = (hex: string) => {
      const channel = (byte: number) => {
        const c = byte / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    const ratio = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    it.each([
      ['default', 'gray-50', 'gray-900'],
      ['secondary', 'gray-900', 'gray-100'],
      ['destructive', 'white', 'red-600'],
      ['success', 'white', 'green-700'],
      ['warning', 'white', 'amber-700'],
      ['outline', 'gray-900', 'white'],
    ])('%s clears WCAG AA for normal text', (_variant, fg, bg) => {
      expect(ratio(TAILWIND[fg], TAILWIND[bg])).toBeGreaterThanOrEqual(4.5);
    });

    // US-663: the dark-mode pairs, read off the class string itself so a
    // shade changed in badge.tsx is checked rather than assumed.
    const darkPair = (className: string, fallbackBg: string) => {
      const bg = /(?:^|\s)dark:bg-([a-z]+-\d+)(?:\s|$)/.exec(className)?.[1] ?? fallbackBg;
      const fg = /(?:^|\s)dark:text-([a-z]+-\d+)(?:\s|$)/.exec(className)?.[1];
      return { fg, bg };
    };

    it.each(['default', 'secondary', 'outline'] as const)(
      '%s has a dark-mode pair that clears WCAG AA',
      (variant) => {
        const { fg, bg } = darkPair(badgeVariants({ variant }), 'dark-surface');
        expect(fg, `${variant} has no dark:text- class`).toBeDefined();
        expect(TAILWIND[fg as string], `add ${fg} to the table`).toBeDefined();
        expect(TAILWIND[bg], `add ${bg} to the table`).toBeDefined();
        expect(ratio(TAILWIND[fg as string], TAILWIND[bg])).toBeGreaterThanOrEqual(4.5);
      }
    );

    it.each(['destructive', 'success', 'warning'] as const)(
      '%s keeps its own fill in dark mode, so its light pair holds',
      (variant) => {
        expect(badgeVariants({ variant })).not.toMatch(/dark:/);
      }
    );
  });

  it('merges custom className', () => {
    renderWithProviders(<Badge className="custom-class">Tag</Badge>);
    expect(screen.getByText('Tag').className).toContain('custom-class');
  });
});
