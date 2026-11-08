/**
 * US-464: the sticky contact bar, the main conversion surface on /:username,
 * painted each action in its own stock hue (purple Email, indigo Home Value,
 * …) whatever theme the agent chose, and its panels carried both a border and
 * a wide shadow. Its colours now come from the theme's --primary only.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { PublicProfile } from '@/types/profile';

vi.mock('@/lib/analyticsEvents', () => ({ trackContactTap: vi.fn() }));

import { StickyActionBar } from './StickyActionBar';

const profile = {
  id: 'p1',
  username: 'jane',
  full_name: 'Jane Doe',
  phone: '5555550100',
  sms_enabled: true,
  email_display: 'jane@example.com',
} as unknown as PublicProfile;

const STOCK_HUES = /\b(?:hover:)?bg-(?:purple|indigo|blue|green|orange|violet)-\d{3}\b/;

function renderAll() {
  return render(
    <StickyActionBar profile={profile} onScheduleShowing={() => {}} onGetHomeValue={() => {}} />
  );
}

function classesIn(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>('[class]')].map((el) => el.className);
}

describe('StickyActionBar colours', () => {
  it('renders no fixed stock-hue classes, with the expanded mobile panel open', () => {
    const { container } = renderAll();
    fireEvent.click(screen.getByRole('button', { name: 'Open quick actions' }));
    const offenders = classesIn(container).filter((c) => STOCK_HUES.test(c));
    expect(offenders).toEqual([]);
  });

  it('fills the first action with the theme primary and tints the rest from it', () => {
    renderAll();
    // Desktop panel is always rendered (hidden below xl by CSS only).
    const call = screen.getAllByRole('button', { name: 'Call' })[0];
    expect(call.className).toContain('bg-primary');
    expect(call.className).toContain('text-primary-foreground');
    for (const label of ['Text', 'Email', 'Schedule', 'Home Value']) {
      const btn = screen.getAllByRole('button', { name: label })[0];
      expect(btn.className).toContain('bg-primary/10');
      expect(btn.className).not.toContain('text-white');
    }
  });

  it('gives each panel one elevation: a shadow, not a border as well', () => {
    const { container } = renderAll();
    fireEvent.click(screen.getByRole('button', { name: 'Open quick actions' }));
    const panels = [...container.querySelectorAll<HTMLElement>('[class*="shadow-"]')].filter(
      (el) => el.tagName === 'DIV'
    );
    expect(panels.length).toBe(2);
    for (const panel of panels) {
      expect(panel.className.split(/\s+/)).not.toContain('border');
    }
  });

  it('marks action buttons type="button" so they never submit a surrounding form', () => {
    renderAll();
    for (const btn of screen.getAllByRole('button', { name: 'Email' })) {
      expect(btn.getAttribute('type')).toBe('button');
    }
  });
});
