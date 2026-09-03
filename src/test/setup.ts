import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver — a real class, not vi.fn().mockImplementation(...).
// Radix primitives construct it with `new`, and a vi.fn whose implementation
// has been cleared by a resetAllMocks in some earlier suite returns undefined
// from `new`, which surfaces much later as "... is not a constructor" inside
// whichever component happens to open a popover (US-102).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Web Storage.
//
// jsdom 27 under vitest 4 gives us a window with no localStorage or
// sessionStorage at all, and every suite that touches storage died on
// "Cannot read properties of undefined (reading 'clear')" in its own beforeEach.
// That silently disabled the whole of RequireAuth.test.tsx - thirteen tests
// covering the session, MFA, onboarding and admin gates, which is to say the
// tests that should have caught the login flow dead-ending in the onboarding
// wizard - plus the storage-backed cases in errorHandler, analyticsEvents and
// useProfileTracking.
//
// An in-memory Storage is enough: nothing here needs persistence across files,
// and a plain object keeps each file isolated.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  if (!window[name]) {
    const storage = new MemoryStorage();
    Object.defineProperty(window, name, { value: storage, writable: true, configurable: true });
    Object.defineProperty(globalThis, name, { value: storage, writable: true, configurable: true });
  }
}
