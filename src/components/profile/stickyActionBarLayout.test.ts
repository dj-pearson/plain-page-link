/**
 * US-660 (from US-649): the mobile Contact button on /:username covered the end
 * of the page. The content reserved pb-24 (96px) below 640px and sm:pb-8 (32px)
 * from 640px, but the button is shown up to xl (1280px) and its top edge sits
 * at 80px plus the home-indicator inset (34px on most iPhones). The expanded
 * quick-actions panel was at bottom-20 (80px), touching the button with no
 * inset and relying on padding for the rest.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTACT_BUTTON_BOTTOM,
  CONTACT_BUTTON_HEIGHT_REM,
  CONTACT_BUTTON_OFFSET_REM,
  CONTENT_GAP_REM,
  QUICK_ACTIONS_GAP_REM,
  QUICK_ACTIONS_PANEL_BOTTOM,
  STICKY_BAR_CONTENT_CLEARANCE,
} from './stickyActionBarLayout';

const SRC = resolve(__dirname, '../..');
const read = (path: string) => readFileSync(resolve(SRC, path), 'utf8');

/** The rem term of `calc(<n>rem + env(safe-area-inset-bottom))`, or null. */
function remPlusInset(value: string): number | null {
  const m = value.replace(/\s+/g, '').match(/^calc\(([\d.]+)rem\+env\(safe-area-inset-bottom\)\)$/);
  return m ? Number(m[1]) : null;
}

const buttonTopRem = CONTACT_BUTTON_OFFSET_REM + CONTACT_BUTTON_HEIGHT_REM;

describe('mobile Contact button geometry (US-660)', () => {
  it('places the button and the panel relative to the safe-area inset', () => {
    expect(remPlusInset(CONTACT_BUTTON_BOTTOM)).toBe(CONTACT_BUTTON_OFFSET_REM);
    // Both include the inset, so the gap between them is the same on every device.
    expect(remPlusInset(QUICK_ACTIONS_PANEL_BOTTOM)).toBe(buttonTopRem + QUICK_ACTIONS_GAP_REM);
    expect(QUICK_ACTIONS_GAP_REM).toBeGreaterThan(0);
  });

  it('reserves the button top plus a gap, with the inset, at every width below xl', () => {
    const tokens = STICKY_BAR_CONTENT_CLEARANCE.split(/\s+/);
    const base = tokens.find((t) => t.startsWith('pb-['));
    expect(base).toBeDefined();
    const rem = remPlusInset(base!.slice('pb-['.length, -1).replace(/\+/g, ' + '));
    expect(rem).toBe(buttonTopRem + CONTENT_GAP_REM);
    expect(rem).toBe(6.5);

    // The only override is at xl, where the side panel replaces the button.
    // An sm: or md: / lg: bottom padding would bring back the tablet overlap.
    const overrides = tokens.filter((t) => t !== base && /^[a-z0-9]+:(?:p|py|pb)-/.test(t));
    expect(overrides).toEqual(['xl:pb-8']);
  });

  it('the profile content column uses the clearance and sets no other bottom padding', () => {
    const page = read('pages/public/FullProfilePage.tsx');
    const m = page.match(/className=\{`(container mx-auto[^`]*)`\}/);
    expect(m).not.toBeNull();
    const classes = m![1];
    expect(classes).toContain('${STICKY_BAR_CONTENT_CLEARANCE}');
    const tokens = classes.replace('${STICKY_BAR_CONTENT_CLEARANCE}', '').split(/\s+/);
    // py-* or sm:py-* would set the bottom too and, inside its media query,
    // override the clearance.
    expect(tokens.filter((t) => /^(?:[a-z0-9]+:)?(?:p|py|pb)-/.test(t))).toEqual([]);
  });

  it('the sticky bar takes its positions from the shared geometry', () => {
    const bar = read('components/profile/StickyActionBar.tsx');
    expect(bar).toContain('style={{ bottom: QUICK_ACTIONS_PANEL_BOTTOM }}');
    expect(bar).toContain('style={{ bottom: CONTACT_BUTTON_BOTTOM }}');
    // A Tailwind bottom-* class next to the inline bottom is dead at best and
    // a second, disagreeing source of truth at worst.
    expect(bar).not.toMatch(/'fixed bottom-\d+ right-4/);
    expect(bar).not.toMatch(/"fixed bottom-\d+ left-0/);
  });
});
