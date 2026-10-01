/**
 * US-236: the hero's shimmer looped forever and its headline followed the
 * mouse, whatever the visitor's reduced-motion setting.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import gsap from 'gsap';
import { HeroSection } from './HeroSection';
import { mockReducedMotion } from '@/test/reducedMotion';

afterEach(() => {
  vi.restoreAllMocks();
  mockReducedMotion(false);
});

const renderHero = () =>
  render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>
  );

describe('HeroSection motion', () => {
  it('under reduced motion: no tweens and no mouse parallax', () => {
    mockReducedMotion(true);
    const to = vi.spyOn(gsap, 'to');
    const listen = vi.spyOn(window, 'addEventListener');
    renderHero();
    expect(to).not.toHaveBeenCalled();
    expect(listen.mock.calls.some(([type]) => type === 'mousemove')).toBe(false);
  });

  it('otherwise the shimmer ends after 5 s instead of repeating forever', () => {
    mockReducedMotion(false);
    const to = vi.spyOn(gsap, 'to');
    renderHero();
    const shimmer = to.mock.calls.find(([, vars]) => (vars as unknown as gsap.TweenVars).backgroundPosition);
    expect(shimmer).toBeDefined();
    const vars = shimmer![1] as unknown as gsap.TweenVars;
    expect(vars.repeat).not.toBe(-1);
    expect((vars.duration as number) * ((vars.repeat as number) + 1)).toBeLessThanOrEqual(5);
  });
});
