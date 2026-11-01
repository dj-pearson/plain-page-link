/**
 * US-260: a 3D profile theme downloaded the three-vendor chunk as soon as the
 * profile rendered, and animated it forever - under prefers-reduced-motion and
 * Save-Data too. useDeferred3D holds it back until load + idle, and for good
 * when the visitor asked for stillness or less data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBackgroundFrameloop, useDeferred3D, BACKGROUND_CANVAS_DPR } from './useDeferred3D';

type Listener = () => void;

let reducedMotion = false;
let mqlListeners: Listener[] = [];
let idleCallbacks: (() => void)[] = [];
let readyState: DocumentReadyState = 'loading';

function installMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return query.includes('reduce') ? reducedMotion : false;
    },
    media: query,
    addEventListener: (_: string, cb: Listener) => mqlListeners.push(cb),
    removeEventListener: (_: string, cb: Listener) => {
      mqlListeners = mqlListeners.filter((l) => l !== cb);
    },
  })) as unknown as typeof window.matchMedia;
}

function setSaveData(value: boolean | undefined) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: value === undefined ? undefined : { saveData: value },
  });
}

beforeEach(() => {
  reducedMotion = false;
  mqlListeners = [];
  idleCallbacks = [];
  readyState = 'loading';
  installMatchMedia();
  setSaveData(undefined);
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => readyState });
  vi.stubGlobal('requestIdleCallback', (cb: () => void) => idleCallbacks.push(cb));
  vi.stubGlobal('cancelIdleCallback', () => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setSaveData(undefined);
});

function fireLoadAndIdle() {
  act(() => {
    readyState = 'complete';
    window.dispatchEvent(new Event('load'));
  });
  act(() => {
    idleCallbacks.splice(0).forEach((cb) => cb());
  });
}

describe('useDeferred3D', () => {
  it('is false at first, and true only after load and then idle', () => {
    const { result } = renderHook(() => useDeferred3D());
    expect(result.current).toBe(false);

    act(() => {
      readyState = 'complete';
      window.dispatchEvent(new Event('load'));
    });
    // Loaded, but the idle period has not come yet.
    expect(result.current).toBe(false);
    expect(idleCallbacks).toHaveLength(1);

    act(() => idleCallbacks.splice(0).forEach((cb) => cb()));
    expect(result.current).toBe(true);
  });

  it('waits only for idle when the page has already loaded', () => {
    readyState = 'complete';
    const { result } = renderHook(() => useDeferred3D());
    expect(result.current).toBe(false);
    act(() => idleCallbacks.splice(0).forEach((cb) => cb()));
    expect(result.current).toBe(true);
  });

  it('stays false under prefers-reduced-motion', () => {
    reducedMotion = true;
    const { result } = renderHook(() => useDeferred3D());
    fireLoadAndIdle();
    expect(result.current).toBe(false);
    expect(idleCallbacks).toHaveLength(0);
  });

  it('stays false under Save-Data', () => {
    setSaveData(true);
    const { result } = renderHook(() => useDeferred3D());
    fireLoadAndIdle();
    expect(result.current).toBe(false);
  });

  it('goes back to false when reduced motion is switched on mid-visit', () => {
    readyState = 'complete';
    const { result } = renderHook(() => useDeferred3D());
    act(() => idleCallbacks.splice(0).forEach((cb) => cb()));
    expect(result.current).toBe(true);

    act(() => {
      reducedMotion = true;
      mqlListeners.forEach((l) => l());
    });
    expect(result.current).toBe(false);
  });

  it('falls back to a timeout where requestIdleCallback is missing (Safari)', () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('requestIdleCallback', undefined);
      readyState = 'complete';
      const { result } = renderHook(() => useDeferred3D());
      expect(result.current).toBe(false);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useBackgroundFrameloop', () => {
  let visibility: DocumentVisibilityState = 'visible';
  beforeEach(() => {
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => visibility,
    });
  });

  it("renders while visible and pauses ('never') while the tab is hidden", () => {
    const { result } = renderHook(() => useBackgroundFrameloop());
    expect(result.current).toBe('always');

    act(() => {
      visibility = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('never');

    act(() => {
      visibility = 'visible';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe('always');
  });
});

describe('BACKGROUND_CANVAS_DPR', () => {
  it('caps the device pixel ratio at 1.5', () => {
    expect(BACKGROUND_CANVAS_DPR).toEqual([1, 1.5]);
  });
});
