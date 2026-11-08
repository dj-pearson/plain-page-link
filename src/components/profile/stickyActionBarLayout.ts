/**
 * Geometry of the mobile Contact button on /:username (US-660, from US-649).
 *
 * The button is fixed at 1.5rem plus the bottom safe-area inset, is 56px
 * (3.5rem) tall, and is shown at every width below xl (1280px). Everything that
 * has to stay clear of it is derived from these numbers, so they cannot drift
 * apart again: the content used to reserve 96px below 640px (8px short on an
 * iPhone with a 34px home indicator) and only 32px from 640 to 1279px, so the
 * button covered the compliance footer on tablets.
 */

/** Distance from the bottom of the viewport to the button, in rem. */
export const CONTACT_BUTTON_OFFSET_REM = 1.5;
/** The button's height (min-h-[56px]), in rem. */
export const CONTACT_BUTTON_HEIGHT_REM = 3.5;
/** Space between the button and the quick-actions panel above it, in rem. */
export const QUICK_ACTIONS_GAP_REM = 1;
/** Space between the button and the end of the page content, in rem. */
export const CONTENT_GAP_REM = 1.5;

const INSET = 'env(safe-area-inset-bottom)';

/** `bottom` of the Contact button itself. */
export const CONTACT_BUTTON_BOTTOM = `calc(${CONTACT_BUTTON_OFFSET_REM}rem + ${INSET})`;

/** `bottom` of the expanded quick-actions panel: above the button at any inset. */
export const QUICK_ACTIONS_PANEL_BOTTOM = `calc(${
  CONTACT_BUTTON_OFFSET_REM + CONTACT_BUTTON_HEIGHT_REM + QUICK_ACTIONS_GAP_REM
}rem + ${INSET})`;

/**
 * Bottom padding for the page content column: the button's top edge plus
 * CONTENT_GAP_REM at every width the button is shown, and the ordinary 2rem
 * from xl, where the side panel replaces it. Written out literally so Tailwind
 * generates it; stickyActionBarLayout.test.ts holds it to the numbers above.
 */
export const STICKY_BAR_CONTENT_CLEARANCE =
  'pb-[calc(6.5rem+env(safe-area-inset-bottom))] xl:pb-8';
