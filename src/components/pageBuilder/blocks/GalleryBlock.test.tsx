/**
 * US-245: the public gallery's tiles were click-only <div>s and the lightbox
 * was a hand-rolled overlay — no dialog role, no title, Escape did nothing,
 * focus was not trapped or returned, and the close/prev/next buttons were
 * bare icons with no accessible name. The contact block's select had no id,
 * so its <Label htmlFor> pointed at nothing.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryBlock } from './GalleryBlock';
import { ContactBlock } from './ContactBlock';
import type { ContactBlockConfig, GalleryBlockConfig } from '@/types/pageBuilder';

const gallery: GalleryBlockConfig = {
  type: 'gallery',
  title: 'Recent work',
  layout: 'grid',
  columns: 3,
  images: [
    { id: 'a', url: 'https://example.com/a.jpg', alt: 'Kitchen', caption: 'Remodelled kitchen' },
    { id: 'b', url: 'https://example.com/b.jpg', alt: 'Backyard' },
    { id: 'c', url: 'https://example.com/c.jpg', alt: '' },
  ],
};

describe('GalleryBlock (US-245)', () => {
  it('renders every tile as a named button', () => {
    render(<GalleryBlock config={gallery} />);
    expect(screen.getByRole('button', { name: 'Open photo 1 of 3: Kitchen' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open photo 2 of 3: Backyard' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open photo 3 of 3' })).toBeInTheDocument();
  });

  it('does not make tiles interactive in the editor', () => {
    render(<GalleryBlock config={gallery} isEditing />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('opens a titled dialog from the keyboard with named close/prev/next controls', async () => {
    const user = userEvent.setup();
    render(<GalleryBlock config={gallery} />);

    const tile = screen.getByRole('button', { name: /Open photo 1 of 3/ });
    tile.focus();
    await user.keyboard('{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'Photo 1 of 3: Kitchen' });
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
    expect(dialog).toHaveAccessibleDescription('Remodelled kitchen');
  });

  it('moves between photos with the buttons and the arrow keys', async () => {
    const user = userEvent.setup();
    render(<GalleryBlock config={gallery} />);
    await user.click(screen.getByRole('button', { name: /Open photo 1 of 3/ }));

    await user.click(await screen.findByRole('button', { name: 'Next photo' }));
    expect(screen.getByRole('dialog', { name: 'Photo 2 of 3: Backyard' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog', { name: 'Photo 3 of 3' })).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('dialog', { name: 'Photo 1 of 3: Kitchen' })).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('dialog', { name: 'Photo 3 of 3' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(screen.getByRole('dialog', { name: 'Photo 2 of 3: Backyard' })).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the tile that opened it', async () => {
    const user = userEvent.setup();
    render(<GalleryBlock config={gallery} />);
    const tile = screen.getByRole('button', { name: /Open photo 2 of 3/ });
    await user.click(tile);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(tile).toHaveFocus());
  });
});

describe('ContactBlock select (US-245)', () => {
  it('labels the select trigger through its <Label htmlFor>', () => {
    const config: ContactBlockConfig = {
      type: 'contact',
      title: 'Get in touch',
      submitButtonText: 'Send',
      successMessage: 'Thanks',
      fields: [
        {
          id: 'timeline',
          type: 'select',
          label: 'Timeline',
          placeholder: 'Choose one',
          required: false,
          options: ['Now', 'Later'],
        },
      ],
    };
    render(<ContactBlock config={config} />);
    expect(screen.getByRole('combobox', { name: 'Timeline' })).toHaveAttribute('id', 'timeline');
  });
});
