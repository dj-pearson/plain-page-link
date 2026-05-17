import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { mockSession } from '@/test/mocks/auth';

const getSession = vi.fn();
const onAuthStateChange = vi.fn(() => ({
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

import ProtectedRoute from './ProtectedRoute';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/auth/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ProtectedRoute', () => {
  beforeEach(() => {
    getSession.mockReset();
    onAuthStateChange.mockClear();
    localStorage.clear();
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
});
