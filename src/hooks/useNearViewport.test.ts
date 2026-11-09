import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNearViewport } from './useNearViewport';

describe('useNearViewport (US-516)', () => {
  const original = global.IntersectionObserver;
  let callback: IntersectionObserverCallback | null = null;
  let options: IntersectionObserverInit | undefined;
  const disconnect = vi.fn();

  beforeEach(() => {
    callback = null;
    options = undefined;
    disconnect.mockReset();
    global.IntersectionObserver = vi
      .fn()
      // A function, not an arrow: the hook calls it with `new`.
      .mockImplementation(function (
        cb: IntersectionObserverCallback,
        opts?: IntersectionObserverInit
      ) {
        callback = cb;
        options = opts;
        return { observe: vi.fn(), unobserve: vi.fn(), disconnect };
      }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    global.IntersectionObserver = original;
  });

  const fire = (isIntersecting: boolean) =>
    act(() => callback!([{ isIntersecting } as IntersectionObserverEntry], {} as never));

  it('is false until the element comes near, then stays true', () => {
    const el = document.createElement('div');
    const { result } = renderHook(() => useNearViewport(el, '400px'));

    expect(result.current).toBe(false);
    expect(options?.rootMargin).toBe('400px');

    fire(false);
    expect(result.current).toBe(false);

    fire(true);
    expect(result.current).toBe(true);
    expect(disconnect).toHaveBeenCalled();
  });

  it('waits for the element before observing', () => {
    const { result, rerender } = renderHook(({ el }) => useNearViewport(el), {
      initialProps: { el: null as Element | null },
    });
    expect(callback).toBeNull();
    expect(result.current).toBe(false);

    rerender({ el: document.createElement('div') });
    expect(callback).not.toBeNull();
  });

  it('answers true at once where IntersectionObserver does not exist', () => {
    // @ts-expect-error simulating a browser without the API
    delete global.IntersectionObserver;
    const { result } = renderHook(() => useNearViewport(document.createElement('div')));
    expect(result.current).toBe(true);
  });
});
