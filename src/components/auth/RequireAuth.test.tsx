import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { mockSession } from '@/test/mocks/auth';

const getSession = vi.fn();
const onAuthStateChange = vi.fn((_callback: unknown) => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: (cb: unknown) => onAuthStateChange(cb),
    },
  },
}));

// Mock the auth store so the MFA, onboarding and admin gates can be driven
// directly (and so its transitive imports aren't pulled into the test
// environment).
interface AuthState {
  requiresMFA: boolean;
  mfaVerified: boolean;
  profile: { onboarding_completed_at: string | null } | null;
  role: string | null;
}
let authState: AuthState = {
  requiresMFA: false,
  mfaVerified: false,
  profile: { onboarding_completed_at: '2026-01-01T00:00:00Z' },
  role: null,
};
vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: (selector: (s: AuthState) => unknown) => selector(authState),
}));

import RequireAuth from './RequireAuth';

const renderAt = (path: string, requireAdmin = false) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<RequireAuth requireAdmin={requireAdmin} />}>
          <Route path="/dashboard" element={<div>Protected content</div>} />
          <Route path="/admin" element={<div>Admin content</div>} />
        </Route>
        <Route path="/auth/login" element={<div>Login page</div>} />
        <Route path="/auth/mfa" element={<div>MFA challenge</div>} />
        <Route path="/onboarding/wizard" element={<div>Onboarding wizard</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('RequireAuth', () => {
  beforeEach(() => {
    getSession.mockReset();
    onAuthStateChange.mockClear();
    localStorage.clear();
    authState = {
      requiresMFA: false,
      mfaVerified: false,
      profile: { onboarding_completed_at: '2026-01-01T00:00:00Z' },
      role: null,
    };
  });

  it('shows a loading state while checking the session', () => {
    getSession.mockReturnValue(new Promise(() => {}));
    renderAt('/dashboard');
    expect(screen.getByText('Verifying session...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /auth/login', async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated users', async () => {
    getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument());
  });

  it('saves the attempted route before redirecting', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('Login page')).toBeInTheDocument());
    expect(localStorage.getItem('lastVisitedRoute')).toBe('/dashboard');
  });

  it('redirects to the MFA challenge when a verified session still has MFA pending', async () => {
    authState = { ...authState, requiresMFA: true, mfaVerified: false };
    getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('MFA challenge')).toBeInTheDocument());
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children once MFA is verified', async () => {
    authState = { ...authState, requiresMFA: true, mfaVerified: true };
    getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument());
  });

  it('sends a first-run agent to the wizard, whatever route they asked for', async () => {
    // The gate US-108 moved here so it covers OAuth signups too, not just the
    // password path in Login.tsx.
    authState = { ...authState, profile: { onboarding_completed_at: null } };
    getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('Onboarding wizard')).toBeInTheDocument());
  });

  it('does not bounce an established agent while the profile is still loading', async () => {
    authState = { ...authState, profile: null };
    getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
    renderAt('/dashboard');
    await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument());
  });

  describe('requireAdmin', () => {
    // This replaces SecureRoute, whose only use anywhere was `requireAdmin`.
    it('waits while the role is still unknown rather than refusing', async () => {
      authState = { ...authState, role: null };
      getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      renderAt('/admin', true);
      await waitFor(() => expect(screen.queryByText('Admin content')).not.toBeInTheDocument());
      expect(screen.queryByText(/admin access required/i)).not.toBeInTheDocument();
    });

    it('refuses a non-admin, in place rather than by redirecting', async () => {
      authState = { ...authState, role: 'user' };
      getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      renderAt('/admin', true);
      await waitFor(() => expect(screen.getByText(/admin access required/i)).toBeInTheDocument());
      expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
    });

    it('lets an admin through', async () => {
      authState = { ...authState, role: 'admin' };
      getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      renderAt('/admin', true);
      await waitFor(() => expect(screen.getByText('Admin content')).toBeInTheDocument());
    });

    it('does not gate an ordinary route on the role', async () => {
      authState = { ...authState, role: 'user' };
      getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      renderAt('/dashboard');
      await waitFor(() => expect(screen.getByText('Protected content')).toBeInTheDocument());
    });
  });
});
