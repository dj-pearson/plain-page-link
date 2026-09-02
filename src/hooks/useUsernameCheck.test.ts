/**
 * US-117: "Username is available" was answered by a query that could not see
 * the rows that matter.
 *
 * useUsernameCheck asked PostgREST directly, and since 20260808000002 the
 * public SELECT policy on `profiles` is scoped to published rows — so a
 * username held by an unpublished profile (every account that has not
 * published yet, including every account mid-signup) came back as no row and
 * the field said the name was free. The insert then failed on the unique index
 * and the agent saw a generic error naming no field.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const { rpcMock, fromMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: (fn: string, args: unknown) => rpcMock(fn, args),
    from: (table: string) => {
      fromMock(table);
      throw new Error('useUsernameCheck must not query profiles directly');
    },
  },
}));

import { useUsernameCheck } from './useUsernameCheck';

const AGENT = '11111111-1111-1111-1111-111111111111';

describe('useUsernameCheck', () => {
  beforeEach(() => {
    rpcMock.mockReset();
    fromMock.mockReset();
    vi.useFakeTimers();
  });

  const run = async (
    hook: ReturnType<typeof renderHook<ReturnType<typeof useUsernameCheck>, unknown>>,
    username: string
  ) => {
    act(() => {
      hook.result.current.checkUsername(username);
    });
    // The check is debounced by 500ms. waitFor is deliberately not used here:
    // it schedules its own timers, which fake timers then never run.
    await act(async () => {
      vi.advanceTimersByTime(600);
      // Let the awaited rpc() promise and the setState after it settle.
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  it('asks the SECURITY DEFINER RPC, not the profiles table', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });
    const hook = renderHook(() => useUsernameCheck(AGENT));

    await run(hook, 'NewName');

    expect(fromMock).not.toHaveBeenCalled();
    expect(rpcMock).toHaveBeenCalledWith('check_username_available', {
      _username: 'newname',
      _current_user_id: AGENT,
    });
  });

  it('omits the current user at signup, where there is nobody to exclude', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });
    const hook = renderHook(() => useUsernameCheck());

    await run(hook, 'newname');

    // undefined, which JSON drops, so the parameter falls back to its default.
    expect(rpcMock).toHaveBeenCalledWith('check_username_available', {
      _username: 'newname',
      _current_user_id: undefined,
    });
  });

  it('reports a name held by an unpublished profile as taken', async () => {
    // The RPC sees the row; the direct query did not.
    rpcMock.mockResolvedValue({ data: false, error: null });
    const hook = renderHook(() => useUsernameCheck(AGENT));

    await run(hook, 'hiddenagent');

    expect(hook.result.current.isAvailable).toBe(false);
    expect(hook.result.current.error).toBe('Username is already taken');
  });

  it('reports a free name as available', async () => {
    rpcMock.mockResolvedValue({ data: true, error: null });
    const hook = renderHook(() => useUsernameCheck(AGENT));

    await run(hook, 'freename');

    expect(hook.result.current.isAvailable).toBe(true);
    expect(hook.result.current.error).toBeNull();
  });

  it('does not call the RPC for a name the format rules already reject', async () => {
    const hook = renderHook(() => useUsernameCheck(AGENT));

    await run(hook, 'a');

    expect(rpcMock).not.toHaveBeenCalled();
    expect(hook.result.current.isAvailable).toBe(false);
  });

  it('treats a failed check as not-available rather than as a green light', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'network down' } });
    const hook = renderHook(() => useUsernameCheck(AGENT));

    await run(hook, 'somename');

    expect(hook.result.current.isAvailable).toBe(false);
    expect(hook.result.current.error).toBe('Failed to check username availability');
  });
});
