/**
 * US-256: the active custom page was reloaded whenever the auth store handed
 * out a new `user` object, which auth-js does for the same agent on every tab
 * switch. It now reloads only when the agent changes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

const h = vi.hoisted(() => ({ reads: 0 }));

vi.mock('@/integrations/supabase/client', () => {
  const chain = {
    select: () => chain,
    eq: () => chain,
    order: () => chain,
    limit: () => chain,
    maybeSingle: async () => {
      h.reads += 1;
      return { data: null, error: null };
    },
  };
  return { supabase: { from: () => chain } };
});

vi.mock('@/stores/useAuthStore', async () => {
  const { create } = await import('zustand');
  const useAuthStore = create<{ user: User | null; profile: { username: string } | null }>(() => ({
    user: null,
    profile: null,
  }));
  return { useAuthStore };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ProfileDisplaySettings } from './ProfileDisplaySettings';
import { useAuthStore } from '@/stores/useAuthStore';

const userFor = (id: string, email?: string): User => ({
  id,
  email,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
});

beforeEach(() => {
  h.reads = 0;
  useAuthStore.setState({ user: userFor('agent-a'), profile: null });
});

describe('ProfileDisplaySettings', () => {
  it('does not reload for a new user object of the same agent, and does for another agent', async () => {
    render(
      <MemoryRouter>
        <ProfileDisplaySettings />
      </MemoryRouter>
    );
    await waitFor(() => expect(h.reads).toBe(1));

    act(() => {
      useAuthStore.setState({ user: userFor('agent-a', 'a@example.test') });
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(h.reads).toBe(1);

    act(() => {
      useAuthStore.setState({ user: userFor('agent-b') });
    });
    await waitFor(() => expect(h.reads).toBe(2));
  });
});
