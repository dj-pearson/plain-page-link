/**
 * US-238: ForgotPassword's label was not associated with its input, neither
 * page set autocomplete, and ResetPassword's error was not announced or tied
 * to a field.
 */
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const { resetPasswordForEmail, updateUser } = vi.hoisted(() => ({
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { auth: { resetPasswordForEmail, updateUser } },
}));

import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

describe('ForgotPassword', () => {
  it('labels the email field, autocompletes it, and returns focus to it on failure', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
    renderWithProviders(<ForgotPassword />);
    const email = screen.getByLabelText('Email Address');
    expect(email).toHaveAttribute('autocomplete', 'email');
    await userEvent.type(email, 'someone@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset instructions/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(email).toHaveFocus();
    expect(email).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('ResetPassword', () => {
  it('uses new-password autocomplete and focuses the field the error is about', async () => {
    renderWithProviders(<ResetPassword />);
    const pw = screen.getByLabelText('New Password');
    const confirm = screen.getByLabelText('Confirm New Password');
    expect(pw).toHaveAttribute('autocomplete', 'new-password');
    expect(confirm).toHaveAttribute('autocomplete', 'new-password');

    await userEvent.type(pw, 'Abcdefgh1234!');
    await userEvent.type(confirm, 'Abcdefgh1234?');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Passwords don't match");
    await waitFor(() => expect(confirm).toHaveFocus());
    expect(confirm).toHaveAttribute('aria-invalid', 'true');
    expect(updateUser).not.toHaveBeenCalled();
  });
});
