/**
 * US-256: auth-js re-emits the session (SIGNED_IN, TOKEN_REFRESHED) on every
 * tab switch. Theme reloaded the saved theme whenever the `user` object
 * changed, so an agent who picked a colour, glanced at another tab and came
 * back found the colour reset to the saved one.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

const h = vi.hoisted(() => ({
  themeReads: 0,
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => {
            h.themeReads += 1;
            return { data: { theme: 'classic' }, error: null };
          },
        }),
      }),
    }),
  },
}));

vi.mock('@/stores/useAuthStore', async () => {
  const { create } = await import('zustand');
  const useAuthStore = create<{ user: { id: string; email?: string } | null }>(() => ({
    user: { id: 'agent-a' },
  }));
  return { useAuthStore };
});

vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock('@/hooks/useSubscriptionLimits', () => ({
  useSubscriptionLimits: () => ({ subscription: { plan_name: 'pro' } }),
}));
vi.mock('@/hooks/usePlanUsage', () => ({ usePlanUsage: () => ({ hasFeature: () => true }) }));
vi.mock('@/components/UpgradeModal', () => ({ UpgradeModal: () => null }));
vi.mock('@/components/theme/SavedThemesManager', () => ({ SavedThemesManager: () => null }));
vi.mock('@/components/dashboard/ThemeCard', () => ({ ThemeCard: () => null }));
vi.mock('@/lib/themes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/themes')>();
  return { ...actual, applyTheme: vi.fn() };
});
// Radix tabs render only the active panel; the colour pickers live in another.
vi.mock('@/components/ui/tabs', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { Tabs: Pass, TabsList: Pass, TabsTrigger: Pass, TabsContent: Pass };
});
vi.mock('@/components/dashboard/ColorPicker', () => ({
  ColorPicker: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => <input aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />,
}));

import Theme from './Theme';
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
  h.themeReads = 0;
  useAuthStore.setState({ user: userFor('agent-a') });
});

describe('Theme', () => {
  it('keeps an unsaved colour when the same agent is re-emitted as a new user object', async () => {
    render(<Theme />);
    await waitFor(() => expect(h.themeReads).toBe(1));

    const primary = screen.getByLabelText('Primary Color') as HTMLInputElement;
    fireEvent.change(primary, { target: { value: '#ff0000' } });
    expect(primary.value).toBe('#ff0000');

    // What a tab switch used to do: same id, fresh object.
    act(() => {
      useAuthStore.setState({ user: userFor('agent-a', 'a@example.test') });
    });
    await new Promise((r) => setTimeout(r, 0));

    expect(h.themeReads).toBe(1);
    expect((screen.getByLabelText('Primary Color') as HTMLInputElement).value).toBe('#ff0000');
  });

  it('reloads the saved theme for a different agent', async () => {
    render(<Theme />);
    await waitFor(() => expect(h.themeReads).toBe(1));

    act(() => {
      useAuthStore.setState({ user: userFor('agent-b') });
    });

    await waitFor(() => expect(h.themeReads).toBe(2));
  });
});
