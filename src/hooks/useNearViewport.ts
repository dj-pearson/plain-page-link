import { useEffect, useState } from 'react';

/**
 * Whether an element has come within `rootMargin` of the viewport, latched:
 * once true it stays true, so content mounted on approach is never unmounted
 * again by scrolling away.
 *
 * Used to mount a below-the-fold section, and fetch its chunk, only when the
 * reader scrolls towards it (US-516). The margin is generous so the section is
 * normally in place before it is on screen.
 *
 * Pass the element through a callback ref (`useState` setter) rather than a
 * ref object, so the observer attaches when the element actually exists.
 *
 * Where IntersectionObserver is missing (very old browsers, some embedded
 * webviews) this answers true at once: the section loads with the page, as it
 * did before, rather than never.
 */
export function useNearViewport(element: Element | null, rootMargin = '600px'): boolean {
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (near || !element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element, near, rootMargin]);

  return near;
}
