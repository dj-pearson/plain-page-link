/**
 * US-412: a lazily loaded dialog joins the tree on its first open and stays
 * there, so its chunk is fetched on use but a close still animates out.
 */
import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMountOnFirstOpen } from './useMountOnFirstOpen';

describe('useMountOnFirstOpen', () => {
  it('is not mounted until the dialog first opens', () => {
    const { result } = renderHook(({ open }) => useMountOnFirstOpen(open), {
      initialProps: { open: false },
    });
    expect(result.current.mounted).toBe(false);
  });

  it('mounts in the render that opens it, and stays mounted after it closes', () => {
    const { result, rerender } = renderHook(({ open }) => useMountOnFirstOpen(open), {
      initialProps: { open: false },
    });
    rerender({ open: true });
    expect(result.current.mounted).toBe(true);
    rerender({ open: false });
    expect(result.current.mounted).toBe(true);
  });

  it('is mounted from the start when it starts open', () => {
    const { result } = renderHook(() => useMountOnFirstOpen(true));
    expect(result.current.mounted).toBe(true);
  });

  it('unmount puts a closed dialog back out of the tree, and the next open mounts it again', () => {
    const { result, rerender } = renderHook(({ open }) => useMountOnFirstOpen(open), {
      initialProps: { open: true },
    });
    rerender({ open: false });
    act(() => result.current.unmount());
    expect(result.current.mounted).toBe(false);
    rerender({ open: true });
    expect(result.current.mounted).toBe(true);
  });
});
