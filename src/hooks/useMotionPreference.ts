/**
 * useMotionPreference Hook
 * Detects user's motion preference for accessible animations
 * Respects prefers-reduced-motion media query
 */

import { useState, useEffect } from 'react';

export type MotionPreference = 'no-preference' | 'reduce';

interface MotionPreferenceResult {
  prefersReducedMotion: boolean;
  motionPreference: MotionPreference;
  shouldAnimate: boolean;
}

/**
 * Hook to detect user's motion preference
 * Returns whether animations should be reduced for accessibility
 */
export function useMotionPreference(): MotionPreferenceResult {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Legacy Safari
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  return {
    prefersReducedMotion,
    motionPreference: prefersReducedMotion ? 'reduce' : 'no-preference',
    shouldAnimate: !prefersReducedMotion,
  };
}

/**
 * Returns animation duration based on motion preference
 * @param normalDuration - Duration in ms when animations are enabled
 * @param reducedDuration - Duration in ms when reduced motion is preferred (default: 0)
 */
export function useAnimationDuration(normalDuration: number, reducedDuration: number = 0): number {
  const { prefersReducedMotion } = useMotionPreference();
  return prefersReducedMotion ? reducedDuration : normalDuration;
}

/**
 * Returns animation config object for Framer Motion based on motion preference
 */
export function useMotionConfig() {
  const { prefersReducedMotion } = useMotionPreference();

  if (prefersReducedMotion) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
    };
  }

  return {
    initial: true,
    animate: true,
    exit: true,
    transition: { duration: 0.3 },
  };
}
