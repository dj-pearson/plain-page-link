/**
 * US-602: Overview's status pills coloured every status past 'contacted'
 * green (a lost lead read as a win), showed the raw value, and had no dark
 * variant. These hold the grouping and the contrast of each tone.
 */
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen } from '@/test/test-utils';
import { LEAD_STATUSES } from '@/lib/leadStatus';
import { LEAD_STATUS_TONE_CLASSES, LeadStatusPill, leadStatusTone } from './LeadStatusPill';

describe('leadStatusTone', () => {
  it.each([
    ['new', 'new'],
    ['contacted', 'in_progress'],
    ['qualified', 'in_progress'],
    ['nurturing', 'in_progress'],
    ['converted', 'won'],
    ['closed', 'won'],
    ['lost', 'lost'],
  ])('%s reads as %s', (status, tone) => {
    expect(leadStatusTone(status)).toBe(tone);
  });

  it('gives every status in the vocabulary a tone', () => {
    for (const { value } of LEAD_STATUSES) {
      expect(LEAD_STATUS_TONE_CLASSES[leadStatusTone(value)]).toBeTruthy();
    }
  });

  it('treats a missing status as new and an unknown one as in progress', () => {
    expect(leadStatusTone(null)).toBe('new');
    expect(leadStatusTone(undefined)).toBe('new');
    expect(leadStatusTone('something-else')).toBe('in_progress');
  });
});

describe('LeadStatusPill', () => {
  it('shows the label, not the stored value', () => {
    renderWithProviders(<LeadStatusPill status="nurturing" />);
    expect(screen.getByText('Nurturing')).toBeInTheDocument();
  });

  it('does not colour a lost lead like a win', () => {
    renderWithProviders(<LeadStatusPill status="lost" />);
    const pill = screen.getByText('Lost');
    expect(pill).toHaveAttribute('data-tone', 'lost');
    expect(pill.className).not.toContain('green');
  });

  it('pairs every coloured tone with a dark-mode surface and text', () => {
    for (const tone of ['new', 'in_progress', 'won'] as const) {
      const classes = LEAD_STATUS_TONE_CLASSES[tone];
      expect(classes).toMatch(/dark:bg-/);
      expect(classes).toMatch(/dark:text-/);
    }
    // The lost tone uses theme tokens, which switch with the theme already.
    expect(LEAD_STATUS_TONE_CLASSES.lost).toBe('bg-muted text-muted-foreground');
  });

  describe('contrast', () => {
    const TAILWIND: Record<string, string> = {
      'blue-100': '#dbeafe',
      'blue-800': '#1e40af',
      'blue-950': '#172554',
      'blue-200': '#bfdbfe',
      'amber-100': '#fef3c7',
      'amber-800': '#92400e',
      'amber-950': '#451a03',
      'amber-200': '#fde68a',
      'green-100': '#dcfce7',
      'green-800': '#166534',
      'green-950': '#052e16',
      'green-200': '#bbf7d0',
    };

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

    /** The light and dark (text, surface) pairs a tone's class string declares. */
    const pairs = (classes: string) => {
      const pick = (re: RegExp) => classes.match(re)?.[1] ?? '';
      return [
        [pick(/(?:^|\s)text-([a-z]+-\d+)/), pick(/(?:^|\s)bg-([a-z]+-\d+)/)],
        [pick(/dark:text-([a-z]+-\d+)/), pick(/dark:bg-([a-z]+-\d+)/)],
      ] as const;
    };

    it.each(['new', 'in_progress', 'won'] as const)(
      '%s clears WCAG AA in light and dark',
      (tone) => {
        for (const [fg, bg] of pairs(LEAD_STATUS_TONE_CLASSES[tone])) {
          expect(TAILWIND[fg], fg).toBeDefined();
          expect(TAILWIND[bg], bg).toBeDefined();
          expect(ratio(TAILWIND[fg], TAILWIND[bg])).toBeGreaterThanOrEqual(4.5);
        }
      }
    );
  });
});
