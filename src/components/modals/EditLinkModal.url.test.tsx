/**
 * US-268: the link forms accepted any non-empty string as a URL. They now use
 * the same rule the public profile renders with, and save the normalised value.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditLinkModal } from './EditLinkModal';
import type { Link } from '@/hooks/useLinks';

const existing = {
  id: 'l1',
  title: 'My site',
  url: 'https://example.com',
  icon: 'link',
  is_active: true,
  position: 1,
} as unknown as Link;

const setup = () => {
  const onSave = vi.fn();
  render(<EditLinkModal open onOpenChange={vi.fn()} link={existing} onSave={onSave} />);
  return { onSave, url: screen.getByLabelText(/URL/) };
};

describe('EditLinkModal URL validation', () => {
  it('refuses a javascript: URL and does not save', async () => {
    const user = userEvent.setup();
    const { onSave, url } = setup();
    await user.clear(url);
    await user.type(url, 'javascript:alert(1)');
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(await screen.findByText(/Enter a web address/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a bare host with https:// in front', async () => {
    const user = userEvent.setup();
    const { onSave, url } = setup();
    await user.clear(url);
    await user.type(url, 'zillow.com/profile/jane');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][1]).toMatchObject({ url: 'https://zillow.com/profile/jane' });
  });
});
