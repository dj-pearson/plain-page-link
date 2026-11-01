/**
 * US-252: deleting a link and leaving the page brought the link back.
 *
 * The unmount cleanup cleared every pending timer, so a delete the agent never
 * undid was silently cancelled the moment they navigated away inside the 10s
 * window. And `isPendingDeletion` read a ref through a stable callback, so the
 * Links page's memo never re-ran and the row stayed on screen until the timer
 * fired. Pending deletes now flush on unmount and pagehide, and the pending set
 * is state.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const { toastMock } = vi.hoisted(() => {
  const fn = Object.assign(
    vi.fn(() => 'toast-id'),
    {
      success: vi.fn(),
      error: vi.fn(),
      dismiss: vi.fn(),
    }
  );
  return { toastMock: fn };
});
vi.mock('sonner', () => ({ toast: toastMock }));

import { useSoftDelete } from './useSoftDelete';

const item = { id: 'link-1', title: 'Zillow' };

function setup(onDelete = vi.fn(async () => {})) {
  const hook = renderHook(() =>
    useSoftDelete<typeof item>({ onDelete, deleteDelay: 10_000, resourceName: 'link' })
  );
  return { ...hook, onDelete };
}

describe('useSoftDelete (US-252)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks the item pending at once, with a fresh isPendingDeletion', async () => {
    const { result } = setup();
    const before = result.current.isPendingDeletion;
    await act(async () => {
      await result.current.softDelete(item);
    });
    expect(result.current.isPendingDeletion(item.id)).toBe(true);
    expect(result.current.pendingIds.has(item.id)).toBe(true);
    // A memo keyed on isPendingDeletion must recompute, or the row stays visible.
    expect(result.current.isPendingDeletion).not.toBe(before);
  });

  it('deletes once after the delay', async () => {
    const { result, onDelete } = setup();
    await act(async () => {
      await result.current.softDelete(item);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(item.id);
    expect(result.current.isPendingDeletion(item.id)).toBe(false);
  });

  it('Undo cancels the delete and restores the item', async () => {
    const { result, onDelete, unmount } = setup();
    await act(async () => {
      await result.current.softDelete(item);
    });
    act(() => result.current.undoDelete(item.id));
    expect(result.current.isPendingDeletion(item.id)).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    unmount();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('flushes a pending delete on unmount instead of cancelling it', async () => {
    const { result, onDelete, unmount } = setup();
    await act(async () => {
      await result.current.softDelete(item);
    });
    unmount();
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(item.id);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('flushes a pending delete on pagehide, exactly once', async () => {
    const { result, onDelete, unmount } = setup();
    await act(async () => {
      await result.current.softDelete(item);
    });
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000);
    });
    unmount();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
