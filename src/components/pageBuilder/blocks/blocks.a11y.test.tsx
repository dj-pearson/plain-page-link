/**
 * US-233: page-builder blocks a keyboard could not reach.
 *
 * LinkBlock (card/minimal) and a linked ImageBlock were <div onClick> that set
 * window.location — no focus, no Enter, no link role, no middle-click. The
 * GalleryBlock lightbox was a hand-rolled overlay with no role=dialog, no
 * Escape and no focus trap. These blocks render on every agent's public page.
 */
import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/test-utils';
import { LinkBlock } from './LinkBlock';
import { ImageBlock } from './ImageBlock';
import { GalleryBlock } from './GalleryBlock';

const link = (style: 'button' | 'card' | 'minimal', openInNewTab = false) =>
  ({ type: 'link', title: 'My listings', url: 'https://example.test/l', style, openInNewTab }) as const;

describe('LinkBlock', () => {
  it.each(['button', 'card', 'minimal'] as const)('%s style is a real link', (style) => {
    renderWithProviders(<LinkBlock config={link(style)} />);
    const a = screen.getByRole('link', { name: /My listings/ });
    expect(a).toHaveAttribute('href', 'https://example.test/l');
  });

  it('says when it opens a new tab', () => {
    renderWithProviders(<LinkBlock config={link('card', true)} />);
    const a = screen.getByRole('link', { name: /opens in a new tab/ });
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('is not a link in the editor, and never links a javascript: url', () => {
    const { unmount } = renderWithProviders(<LinkBlock config={link('card')} isEditing />);
    expect(screen.queryByRole('link')).toBeNull();
    unmount();
    renderWithProviders(<LinkBlock config={{ ...link('card'), url: 'javascript:alert(1)' }} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('ImageBlock', () => {
  it('a linked image is a link named by its alt text', () => {
    renderWithProviders(
      <ImageBlock config={{ type: 'image', imageUrl: '/a.jpg', alt: 'Front porch', link: 'https://example.test', size: 'full' }} />
    );
    expect(screen.getByRole('link', { name: /Front porch/ })).toHaveAttribute('href', 'https://example.test');
  });

  it('an unlinked image is not a link', () => {
    renderWithProviders(<ImageBlock config={{ type: 'image', imageUrl: '/a.jpg', alt: 'Front porch', size: 'full' }} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('GalleryBlock lightbox', () => {
  const images = ['Kitchen', 'Garden', 'Pool'].map((alt, i) => ({ id: String(i), url: `/${i}.jpg`, alt }));
  const gallery = { type: 'gallery', images, layout: 'grid', columns: 3 } as const;

  it('thumbnails are named buttons that open a dialog; Escape closes it and focus returns', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryBlock config={gallery} />);
    const thumb = screen.getByRole('button', { name: 'View larger: Garden (2 of 3)' });
    await user.click(thumb);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(thumb).toHaveFocus());
  });

  it('arrow keys move between photos', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GalleryBlock config={gallery} />);
    await user.click(screen.getByRole('button', { name: /View larger: Kitchen/ }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog.querySelector('img')).toHaveAttribute('alt', 'Kitchen');
    await user.keyboard('{ArrowRight}');
    expect(dialog.querySelector('img')).toHaveAttribute('alt', 'Garden');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(dialog.querySelector('img')).toHaveAttribute('alt', 'Pool');
  });

  it('in the editor the thumbnails do not open anything', () => {
    renderWithProviders(<GalleryBlock config={gallery} isEditing />);
    expect(screen.queryByRole('button', { name: /View larger/ })).toBeNull();
  });
});
