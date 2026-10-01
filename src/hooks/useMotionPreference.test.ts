/** US-236: the hook had no consumer and ignored the site's own widget. */
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMotionPreference } from './useMotionPreference';
import { mockReducedMotion } from '@/test/reducedMotion';

afterEach(() => {
  mockReducedMotion(false);
  document.documentElement.classList.remove('a11y-reduced-motion');
});

describe('useMotionPreference', () => {
  it('animates by default', () => {
    mockReducedMotion(false);
    expect(renderHook(() => useMotionPreference()).result.current.shouldAnimate).toBe(true);
  });

  it('honours the OS setting', () => {
    mockReducedMotion(true);
    expect(renderHook(() => useMotionPreference()).result.current.shouldAnimate).toBe(false);
  });

  it("honours the accessibility widget's switch, including a change after mount", async () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useMotionPreference());
    expect(result.current.shouldAnimate).toBe(true);
    act(() => document.documentElement.classList.add('a11y-reduced-motion'));
    await waitFor(() => expect(result.current.shouldAnimate).toBe(false));
    act(() => document.documentElement.classList.remove('a11y-reduced-motion'));
    await waitFor(() => expect(result.current.shouldAnimate).toBe(true));
  });
});
