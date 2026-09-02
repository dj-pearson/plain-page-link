/**
 * US-117: the Settings page.
 *
 * Two defects were visible to any agent who opened it, and one was invisible
 * until they opened another page:
 *
 *   - The billing block rendered "Professional - $49/month", a card ending
 *     4242 and "February 15, 2024" as literals, with Manage / Update / View
 *     Invoices buttons that had no handlers. An agent on the free plan read
 *     that they were paying $49 a month.
 *   - It declared its own useQuery on ['profile', user.id] returning the raw
 *     row, while useProfile returns toProfile(data) with the phone decrypted.
 *     Two queryFns under one key is the cache collision US-094 fixed on
 *     ['leads']: whichever mounted first decided the shape the other saw, so
 *     the Profile page could render ciphertext after a visit here.
 *   - Changing the username moved the agent's public address with no warning
 *     that every link already shared would break.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const { profileMock, subscriptionMock, updateMock } = vi.hoisted(() => ({
  profileMock: vi.fn(),
  subscriptionMock: vi.fn(),
  updateMock: vi.fn(),
}));

const USER = { id: '11111111-1111-1111-1111-111111111111', email: 'agent@example.test' };

vi.mock('@/hooks/useProfile', () => ({ useProfile: () => profileMock() }));
vi.mock('@/hooks/useSubscription', () => ({ useSubscription: () => subscriptionMock() }));
vi.mock('@/stores/useAuthStore', () => ({ useAuthStore: () => ({ user: USER }) }));
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({ settings: null, isLoading: false, updateSettings: { mutate: vi.fn() } }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: () => Promise.resolve({ data: true, error: null }),
    from: () => ({
      update: (payload: unknown) => {
        updateMock(payload);
        return {
          eq: () => ({
            select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }),
          }),
        };
      },
    }),
    auth: { updateUser: () => Promise.resolve({ error: null }) },
  },
}));

// Heavy children this page composes; none of them is what these assert.
vi.mock('@/components/settings/ProfileDisplaySettings', () => ({
  ProfileDisplaySettings: () => null,
}));
vi.mock('@/components/settings/SessionManagement', () => ({ SessionManagement: () => null }));
vi.mock('@/components/settings/LeadNotificationPreferences', () => ({
  LeadNotificationPreferences: () => null,
}));
vi.mock('@/components/auth/mfa/NativeMFASettings', () => ({ NativeMFASettings: () => null }));
vi.mock('@/components/settings/AuditLogViewer', () => ({ AuditLogViewer: () => null }));
vi.mock('@/components/settings/GDPRSettings', () => ({ GDPRSettings: () => null }));
vi.mock('@/components/settings/ProfileURLCard', () => ({ ProfileURLCard: () => null }));

import Settings from './Settings';

const PROFILE = {
  id: USER.id,
  username: 'janedoe',
  full_name: 'Jane Doe',
  bio: 'Selling homes.',
  avatar_url: null,
};

describe('Settings billing block', () => {
  beforeEach(() => {
    profileMock.mockReturnValue({ profile: PROFILE, isLoading: false });
    subscriptionMock.mockReturnValue({ subscription: null, isLoading: false });
    updateMock.mockReset();
  });

  it('shows Free to an agent with no subscription, not "$49/month"', async () => {
    renderWithProviders(<Settings />);

    expect(await screen.findByText('Free')).toBeInTheDocument();
    expect(screen.queryByText(/\$49\/month/)).toBeNull();
    // The card number and the billing date were literals too.
    expect(screen.queryByText(/4242/)).toBeNull();
    expect(screen.queryByText(/February 15, 2024/)).toBeNull();
  });

  it('names the real plan when there is one', async () => {
    subscriptionMock.mockReturnValue({
      subscription: {
        plan_name: 'professional',
        status: 'active',
        current_period_end: '2027-02-15T00:00:00.000Z',
        limits: {},
        features: {},
      },
      isLoading: false,
    });

    renderWithProviders(<Settings />);

    expect(await screen.findByText('Professional')).toBeInTheDocument();
  });

  it('links to the subscription page instead of buttons that do nothing', async () => {
    renderWithProviders(<Settings />);

    const link = await screen.findByRole('link', { name: /view plans/i });
    expect(link).toHaveAttribute('href', '/dashboard/subscription');
  });
});

describe('Settings profile query', () => {
  beforeEach(() => {
    profileMock.mockReturnValue({ profile: PROFILE, isLoading: false });
    subscriptionMock.mockReturnValue({ subscription: null, isLoading: false });
    updateMock.mockReset();
  });

  it('reads the profile through useProfile, so there is one shape under one key', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => expect(profileMock).toHaveBeenCalled());
    expect(await screen.findByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('janedoe')).toBeInTheDocument();
  });
});

describe('Settings username change', () => {
  beforeEach(() => {
    profileMock.mockReturnValue({ profile: PROFILE, isLoading: false });
    subscriptionMock.mockReturnValue({ subscription: null, isLoading: false });
    updateMock.mockReset();
  });

  it('warns that shared links will break before moving the address', async () => {
    renderWithProviders(<Settings />);

    const username = await screen.findByDisplayValue('janedoe');
    await userEvent.clear(username);
    await userEvent.type(username, 'janerivers');
    await userEvent.click(screen.getByRole('button', { name: /save profile changes/i }));

    expect(await screen.findByText(/change your public address\?/i)).toBeInTheDocument();
    expect(screen.getByText(/will stop working/i)).toBeInTheDocument();
    // Nothing is written until the agent confirms.
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('saves without asking when the username has not changed', async () => {
    renderWithProviders(<Settings />);

    const fullName = await screen.findByDisplayValue('Jane Doe');
    await userEvent.clear(fullName);
    await userEvent.type(fullName, 'Jane R Doe');
    await userEvent.click(screen.getByRole('button', { name: /save profile changes/i }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    expect(screen.queryByText(/change your public address\?/i)).toBeNull();
  });
});
