import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const signIn = vi.fn();
const clearError = vi.fn();
let storeState: Record<string, unknown>;

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => storeState,
}));

vi.mock('@/hooks/useLoginSecurity', () => ({
  checkLoginThrottle: vi.fn().mockResolvedValue({ blocked: false }),
  recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
  formatBlockedUntil: vi.fn(() => '15 minutes'),
  getDeviceFingerprint: vi.fn(() => 'device-fp'),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

import Login from './Login';

describe('Login page', () => {
  beforeEach(() => {
    signIn.mockReset();
    clearError.mockReset();
    storeState = {
      signIn,
      signInWithGoogle: vi.fn(),
      signInWithApple: vi.fn(),
      isLoading: false,
      error: null,
      clearError,
      user: null,
    };
  });

  it('renders the login form', () => {
    renderWithProviders(<Login />);
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    renderWithProviders(<Login />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(screen.getByText('Password is required')).toBeInTheDocument());
    expect(signIn).not.toHaveBeenCalled();
  });

  it('calls signIn with normalized credentials on valid submit', async () => {
    signIn.mockResolvedValue(undefined);
    renderWithProviders(<Login />);
    await userEvent.type(screen.getByLabelText('Email address'), '  Jane@Example.com  ');
    await userEvent.type(screen.getByLabelText('Password'), 'secret-password');
    await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(signIn).toHaveBeenCalledWith('jane@example.com', 'secret-password'));
  });

  it('shows an error message when the store reports an error', () => {
    storeState.error = 'Invalid login credentials';
    renderWithProviders(<Login />);
    expect(screen.getByText('Login Failed')).toBeInTheDocument();
  });
});
