/**
 * US-237: the profile editor.
 *
 *   - It re-hydrated the form on every new `profile` object. An avatar upload
 *     invalidated the query, the refetch produced one, and every field the
 *     agent had typed but not saved was reset.
 *   - When the phone could not be decrypted, the form was given the stored
 *     ciphertext; a save then encrypted it again.
 *   - A failed save said "Failed to update profile. Please try again." whatever
 *     the reason, there was no save button within reach on a phone, and
 *     leaving with unsaved edits said nothing.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor, fireEvent } from '@/test/test-utils';
import { mockProfile } from '@/test/fixtures/profile';

const { profileMock, mutateAsync, uploadAvatar } = vi.hoisted(() => ({
  profileMock: vi.fn(),
  mutateAsync: vi.fn(),
  uploadAvatar: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({ useProfile: () => profileMock() }));
vi.mock('@/hooks/useAvatarUpload', () => ({
  useAvatarUpload: () => ({ uploadAvatar, uploading: false }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

import Profile from './Profile';

const NEW_AVATAR = 'https://example.com/avatars/new.jpg';

function hookState(profile: Record<string, unknown>) {
  return {
    profile,
    isLoading: false,
    updateProfile: { mutateAsync, isPending: false },
  };
}

function fullNameInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[name="full_name"]');
  if (!input) throw new Error('full_name input not rendered');
  return input;
}

describe('Profile editor', () => {
  beforeEach(() => {
    mutateAsync.mockReset().mockResolvedValue({ id: mockProfile.id });
    uploadAvatar.mockReset().mockResolvedValue(NEW_AVATAR);
    profileMock.mockReturnValue(hookState({ ...mockProfile, phoneUnavailable: false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('hydrates from the server once', () => {
    it('keeps unsaved edits when the profile query refetches', async () => {
      const user = userEvent.setup();
      const { container, rerender } = renderWithProviders(<Profile />);
      const name = fullNameInput(container);
      expect(name.value).toBe('Jane Doe');

      await user.clear(name);
      await user.type(name, 'Jane Q. Doe');

      // A refetch hands the page a new object (different server values even).
      profileMock.mockReturnValue(
        hookState({ ...mockProfile, full_name: 'Server Name', phoneUnavailable: false })
      );
      rerender(<Profile />);

      expect(fullNameInput(container).value).toBe('Jane Q. Doe');
    });

    it('an avatar upload changes avatar_url only and keeps the other edits', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<Profile />);
      const name = fullNameInput(container);
      await user.clear(name);
      await user.type(name, 'Typed Before Upload');

      const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
      if (!fileInput) throw new Error('file input not rendered');
      await user.upload(fileInput, new File(['x'], 'me.png', { type: 'image/png' }));

      await waitFor(() =>
        expect(screen.getByAltText('Profile').getAttribute('src')).toBe(NEW_AVATAR)
      );
      expect(fullNameInput(container).value).toBe('Typed Before Upload');

      // The upload saved avatar_url itself; the typed name is still unsaved,
      // and a save sends it along with the new avatar.
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);
      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync.mock.calls[0][0]).toMatchObject({
        full_name: 'Typed Before Upload',
        avatar_url: NEW_AVATAR,
      });
    });
  });

  describe('a phone that could not be decrypted', () => {
    it('is left out of the save when the agent did not type a new one', async () => {
      profileMock.mockReturnValue(
        hookState({ ...mockProfile, phone: null, phoneUnavailable: true })
      );
      const { container } = renderWithProviders(<Profile />);

      fireEvent.submit(container.querySelector('form') as HTMLFormElement);
      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      const payload = mutateAsync.mock.calls[0][0] as Record<string, unknown>;
      expect('phone' in payload).toBe(false);
      expect('username' in payload).toBe(false);
      expect(payload.full_name).toBe('Jane Doe');
    });

    it('is saved when it was decrypted', async () => {
      const { container } = renderWithProviders(<Profile />);
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);
      await waitFor(() => expect(mutateAsync).toHaveBeenCalledTimes(1));
      expect(mutateAsync.mock.calls[0][0]).toMatchObject({ phone: mockProfile.phone });
    });
  });

  describe('a failed save', () => {
    it('shows a plan-limit refusal inline, in the trigger’s words, with the upgrade path', async () => {
      mutateAsync.mockRejectedValue({
        code: '23514',
        message: 'Your Free plan includes 5 links. Upgrade to add more.',
        details: 'plan_limit:links',
      });
      const { container } = renderWithProviders(<Profile />);
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Your Free plan includes 5 links. Upgrade to add more.');
      expect(alert).not.toHaveTextContent('Your profile was not saved');
      expect(screen.getByRole('link', { name: 'See plans' })).toHaveAttribute(
        'href',
        '/dashboard/subscription'
      );
    });

    it('shows the real reason for any other failure', async () => {
      mutateAsync.mockRejectedValue({ message: 'value too long for type character varying(160)' });
      const { container } = renderWithProviders(<Profile />);
      fireEvent.submit(container.querySelector('form') as HTMLFormElement);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('value too long for type character varying(160)');
      expect(screen.queryByRole('link', { name: 'See plans' })).not.toBeInTheDocument();
    });
  });

  it('has a save button in the mobile bar', () => {
    renderWithProviders(<Profile />);
    // One in the header (md and up), one in the bar (below md).
    expect(screen.getAllByRole('button', { name: /save changes/i })).toHaveLength(2);
    expect(screen.getByText('All changes saved')).toBeInTheDocument();
  });

  describe('leaving with unsaved changes', () => {
    it('warns on unload only once something has changed', async () => {
      const user = userEvent.setup();
      const { container } = renderWithProviders(<Profile />);

      const clean = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(clean);
      expect(clean.defaultPrevented).toBe(false);

      await user.type(fullNameInput(container), '!');
      const dirty = new Event('beforeunload', { cancelable: true });
      window.dispatchEvent(dirty);
      expect(dirty.defaultPrevented).toBe(true);
    });

    it('asks before following an in-app link, and stays when the agent cancels', async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      const { container } = renderWithProviders(<Profile />);
      await user.type(fullNameInput(container), '!');

      const link = document.createElement('a');
      link.href = '/dashboard/listings';
      link.textContent = 'Listings';
      document.body.appendChild(link);
      try {
        const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
        link.dispatchEvent(click);
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(click.defaultPrevented).toBe(true);
      } finally {
        link.remove();
      }
    });
  });
});
