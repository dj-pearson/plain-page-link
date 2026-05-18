import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const signUp = vi.fn();
const clearError = vi.fn();
let storeState: Record<string, unknown>;

vi.mock('@/stores/useAuthStore', () => ({
  useAuthStore: () => storeState,
}));

vi.mock('@/hooks/useUsernameCheck', () => ({
  useUsernameCheck: () => ({
    checkUsername: vi.fn(),
    isChecking: false,
    error: null,
    isAvailable: true,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

import Register from './Register';

describe('Register page', () => {
  beforeEach(() => {
    signUp.mockReset();
    storeState = {
      signUp,
      signInWithGoogle: vi.fn(),
      signInWithApple: vi.fn(),
      isLoading: false,
      error: null,
      clearError,
      user: null,
      session: null,
    };
  });

  it('renders the registration form', () => {
    renderWithProviders(<Register />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    renderWithProviders(<Register />);
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    await waitFor(() =>
      expect(
        screen.getByText('You must agree to the terms to create an account')
      ).toBeInTheDocument()
    );
    expect(signUp).not.toHaveBeenCalled();
  });

  it('calls signUp with the form values on valid submit', async () => {
    signUp.mockResolvedValue(undefined);
    renderWithProviders(<Register />);

    await userEvent.type(screen.getByLabelText('Username'), 'johndoe');
    await userEvent.type(screen.getByLabelText('Full Name'), 'John Doe');
    await userEvent.type(screen.getByLabelText('Email address'), 'john@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPass1!xyz');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'StrongPass1!xyz');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith(
        'john@example.com',
        'StrongPass1!xyz',
        'johndoe',
        'John Doe'
      )
    );
  });
});
