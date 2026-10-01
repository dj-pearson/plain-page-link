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

/** The accessibility widget's own switch (accessibility-widget.tsx). */
const WIDGET_CLASS = 'a11y-reduced-motion';

function osPrefersReduced(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function widgetPrefersReduced(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains(WIDGET_CLASS);
}

/**
 * Whether to animate: no if the OS asks for reduced motion OR the site's
 * accessibility widget does.
 *
 * US-236: this hook existed with no consumer, and it watched only the media
 * query — so the widget's "Reduce motion" switch stopped CSS animations (the
 * index.css rule) and nothing driven by JavaScript: the WebGL theme
 * backgrounds, the GSAP shimmer, the carousel. Both sources are observed now.
 */
export function useMotionPreference(): MotionPreferenceResult {
  const [os, setOs] = useState<boolean>(osPrefersReduced);
  const [widget, setWidget] = useState<boolean>(widgetPrefersReduced);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setOs(event.matches);
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

  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => setWidget(widgetPrefersReduced()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const prefersReducedMotion = os || widget;
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
