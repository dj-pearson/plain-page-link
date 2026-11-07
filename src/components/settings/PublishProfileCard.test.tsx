/**
 * US-265: profiles.is_published gated the whole public page and no screen
 * could change it.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';

const { profileMock, mutateMock, toastMock } = vi.hoisted(() => ({
  profileMock: vi.fn(),
  mutateMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    profile: profileMock(),
    updateProfile: { mutate: mutateMock, isPending: false },
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: toastMock }) }));

import { PublishProfileCard } from './PublishProfileCard';

beforeEach(() => {
  profileMock.mockReset();
  mutateMock.mockReset();
  toastMock.mockReset();
});

describe('PublishProfileCard', () => {
  it('renders nothing until the profile has loaded', () => {
    profileMock.mockReturnValue(null);
    const { container } = renderWithProviders(<PublishProfileCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows a live page as live, with a link to view it', () => {
    profileMock.mockReturnValue({ username: 'janedoe', is_published: true });
    renderWithProviders(<PublishProfileCard />);

    expect(screen.getByRole('switch', { name: 'Page is live' })).toBeChecked();
    expect(screen.getByRole('link', { name: /View your page/ })).toHaveAttribute(
      'href',
      '/janedoe'
    );
  });

  it('treats a NULL is_published as unpublished and offers a preview', () => {
    profileMock.mockReturnValue({ username: 'janedoe', is_published: null });
    renderWithProviders(<PublishProfileCard />);

    expect(screen.getByRole('switch', { name: 'Page is live' })).not.toBeChecked();
    expect(screen.getByText(/Not published/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Preview as visitor/ })).toHaveAttribute(
      'href',
      '/janedoe'
    );
  });

  it('publishes in one tap', async () => {
    profileMock.mockReturnValue({ username: 'janedoe', is_published: false });
    renderWithProviders(<PublishProfileCard />);

    await userEvent.click(screen.getByRole('switch', { name: 'Page is live' }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock.mock.calls[0][0]).toEqual({ is_published: true });
  });

  it('asks before unpublishing, and saves nothing if the agent keeps it live', async () => {
    profileMock.mockReturnValue({ username: 'janedoe', is_published: true });
    renderWithProviders(<PublishProfileCard />);

    await userEvent.click(screen.getByRole('switch', { name: 'Page is live' }));
    expect(await screen.findByRole('alertdialog')).toHaveTextContent(/Unpublish your page\?/);
    expect(mutateMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Keep it live' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(mutateMock).not.toHaveBeenCalled();
  });

  it('unpublishes once confirmed, and refreshes the cached public page', async () => {
    profileMock.mockReturnValue({ username: 'janedoe', is_published: true });
    const { queryClient } = renderWithProviders(<PublishProfileCard />);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await userEvent.click(screen.getByRole('switch', { name: 'Page is live' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Unpublish' }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    const [updates, callbacks] = mutateMock.mock.calls[0];
    expect(updates).toEqual({ is_published: false });

    callbacks.onSuccess();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['public-profile'] });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Your page is unpublished' })
    );
  });

  it('says the page is unchanged when the save fails', async () => {
    profileMock.mockReturnValue({ username: 'janedoe', is_published: false });
    renderWithProviders(<PublishProfileCard />);

    await userEvent.click(screen.getByRole('switch', { name: 'Page is live' }));
    mutateMock.mock.calls[0][1].onError(new Error('boom'));

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Could not save', variant: 'destructive' })
    );
  });
});
