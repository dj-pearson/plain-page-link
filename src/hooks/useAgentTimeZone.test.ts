/**
 * US-631: a failed read of profiles.timezone is reported as an error, never as
 * "no zone saved", so nothing offers to save the device zone over a stored one.
 * TimeZonePrompt and useNotificationPreferences key off isKnown, which this
 * holds false on a failed read.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from '@/test/test-utils';

const fetchOwnProfile = vi.fn();
vi.mock('@/lib/ownProfile', () => ({ fetchOwnProfile: () => fetchOwnProfile() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: <T>(select: (s: { user: { id: string } }) => T) =>
    select({ user: { id: 'user-1' } }),
}));

import { useAgentTimeZone } from './useAgentTimeZone';

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(QueryClientProvider, { client: createTestQueryClient() }, children);

describe('useAgentTimeZone', () => {
  beforeEach(() => fetchOwnProfile.mockReset());

  it('reports a failed read as an error, not as an unset zone', async () => {
    fetchOwnProfile.mockResolvedValue({ data: null, error: new Error('network down') });
    const { result } = renderHook(() => useAgentTimeZone(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isKnown).toBe(false);
    expect(result.current.timeZone).toBeNull();
  });

  it('a successful read of NULL is known and unset', async () => {
    fetchOwnProfile.mockResolvedValue({ data: { timezone: null }, error: null });
    const { result } = renderHook(() => useAgentTimeZone(), { wrapper });
    await waitFor(() => expect(result.current.isKnown).toBe(true));
    expect(result.current.isError).toBe(false);
    expect(result.current.timeZone).toBeNull();
  });

  it('returns the stored zone', async () => {
    fetchOwnProfile.mockResolvedValue({ data: { timezone: 'Europe/London' }, error: null });
    const { result } = renderHook(() => useAgentTimeZone(), { wrapper });
    await waitFor(() => expect(result.current.timeZone).toBe('Europe/London'));
  });
});
