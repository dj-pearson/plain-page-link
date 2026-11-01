/**
 * When an agent's 3D profile theme may start its Three.js background (US-260).
 *
 * The three themed backgrounds (particles, gradient mesh, floating geometry)
 * used to lazy-load the moment the profile rendered, so every visitor to a 3D
 * theme downloaded the three-vendor chunk (~218 KB gzipped) in competition with
 * the agent's photo and contact buttons, and then animated it forever - even
 * for a visitor whose OS asked for reduced motion, or whose browser asked to
 * save data. The background is decoration behind content at 20-30% opacity;
 * none of that is worth paying for first.
 *
 * So:
 *   - prefers-reduced-motion or Save-Data: never. The static gradient the lazy
 *     wrappers already draw as a Suspense fallback is shown instead, and the
 *     three chunk is never requested.
 *   - otherwise: only after the window `load` event AND the browser's next idle
 *     period, so the 3D chunk is fetched after everything the visitor came for.
 *
 * Deliberately free of any three/R3F import: this module is on the profile's
 * critical path, the 3D components are not.
 */
import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Device-pixel-ratio cap for the 3D backgrounds' Canvas: sharp enough at 20-30% opacity, a quarter of the fill of DPR 3. */
export const BACKGROUND_CANVAS_DPR: [number, number] = [1, 1.5];

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function prefersSaveData(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.connection?.saveData === true;
}

/** True when a decorative 3D background must not load at all. */
export function shouldSkip3D(): boolean {
  return prefersReducedMotion() || prefersSaveData();
}

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Run `cb` once the page has loaded and the main thread is idle. Returns a
 * cancel function.
 */
function afterLoadAndIdle(cb: () => void): () => void {
  const w = window as IdleWindow;
  let idleHandle: number | undefined;
  let timeoutHandle: number | undefined;
  let cancelled = false;

  const scheduleIdle = () => {
    if (cancelled) return;
    if (typeof w.requestIdleCallback === 'function') {
      idleHandle = w.requestIdleCallback(cb, { timeout: 3000 });
    } else {
      // Safari has no requestIdleCallback; "a moment after load" is all this
      // needs to mean.
      timeoutHandle = window.setTimeout(cb, 1500);
    }
  };

  if (document.readyState === 'complete') {
    scheduleIdle();
  } else {
    window.addEventListener('load', scheduleIdle, { once: true });
  }

  return () => {
    cancelled = true;
    window.removeEventListener('load', scheduleIdle);
    if (idleHandle !== undefined) w.cancelIdleCallback?.(idleHandle);
    if (timeoutHandle !== undefined) window.clearTimeout(timeoutHandle);
  };
}

/**
 * Whether the 3D background may mount now. False on first render, false for
 * good under reduced motion or Save-Data, true only after load + idle. If the
 * visitor turns reduced motion on while the page is open, it goes back to
 * false and the Canvas unmounts.
 */
export function useDeferred3D(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelSchedule: (() => void) | undefined;
    const evaluate = () => {
      cancelSchedule?.();
      cancelSchedule = undefined;
      if (shouldSkip3D()) {
        setReady(false);
        return;
      }
      cancelSchedule = afterLoadAndIdle(() => setReady(true));
    };

    evaluate();

    const mql =
      typeof window.matchMedia === 'function' ? window.matchMedia(REDUCED_MOTION_QUERY) : null;
    mql?.addEventListener?.('change', evaluate);

    return () => {
      cancelSchedule?.();
      mql?.removeEventListener?.('change', evaluate);
    };
  }, []);

  return ready;
}

/**
 * The Canvas `frameloop` for a decorative background: 'always' while the tab
 * is visible, 'never' while it is hidden, so a backgrounded tab stops
 * rendering instead of spinning the GPU.
 */
export function useBackgroundFrameloop(): 'always' | 'never' {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden'
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible ? 'always' : 'never';
}
