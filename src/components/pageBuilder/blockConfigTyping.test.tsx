/**
 * US-363: BlockRenderer and BlockSettings cast every config `as any` and
 * routed on block.type. They now narrow on the config's own tag through
 * blockConfigOf, which re-tags a jsonb config that lacks `type` (or carries a
 * stale one) from block.type, so saved pages keep rendering as before.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlockRenderer } from './BlockRenderer';
import { BlockSettings } from './BlockSettings';
import { blockConfigOf, type PageBlock } from '@/types/pageBuilder';

/** A block as it may come back from the jsonb column: config shape untrusted. */
const stored = (type: PageBlock['type'], config: unknown): PageBlock =>
  JSON.parse(JSON.stringify({ id: 'b1', type, order: 0, visible: true, config })) as PageBlock;

describe('blockConfigOf (US-363)', () => {
  it('returns the config untouched when its tag matches the block', () => {
    const block = stored('text', {
      type: 'text',
      content: 'Hi',
      align: 'left',
      fontSize: 'medium',
    });
    expect(blockConfigOf(block)).toBe(block.config);
  });

  it('tags a config saved without a type from block.type', () => {
    const config = blockConfigOf(stored('text', { content: 'Hi', align: 'left' }));
    expect(config).toMatchObject({ type: 'text', content: 'Hi', align: 'left' });
  });

  it('lets block.type win when the stored tag disagrees, as routing always did', () => {
    expect(blockConfigOf(stored('spacer', { type: 'text', height: 40 })).type).toBe('spacer');
  });

  it('degrades a missing or non-object config to just the tag', () => {
    expect(blockConfigOf(stored('divider', null))).toEqual({ type: 'divider' });
    expect(blockConfigOf(stored('divider', 'oops'))).toEqual({ type: 'divider' });
  });
});

describe('BlockRenderer narrowing (US-363)', () => {
  it('renders a block whose saved config has no type tag', () => {
    render(
      <BlockRenderer
        block={stored('text', { content: 'Serving Austin since 2012', align: 'center' })}
      />
    );
    expect(screen.getByText('Serving Austin since 2012')).toBeInTheDocument();
  });

  it('still reports an unknown block type instead of throwing', () => {
    const block = stored('text', {});
    render(<BlockRenderer block={{ ...block, type: 'mystery' as PageBlock['type'] }} />);
    expect(screen.getByText(/unknown block type: mystery/i)).toBeInTheDocument();
  });
});

describe('BlockSettings narrowing (US-363)', () => {
  it('shows the hero form for an untagged hero config and patches only its field', () => {
    const onUpdate = vi.fn();
    render(
      <BlockSettings
        block={stored('hero', { headline: 'Old', layout: 'centered', height: 'medium' })}
        onUpdate={onUpdate}
      />
    );
    fireEvent.change(screen.getByLabelText('Headline'), { target: { value: 'New headline' } });
    expect(onUpdate).toHaveBeenCalledWith({ headline: 'New headline' });
  });

  it('updates one gallery image by id and leaves the others alone', () => {
    const onUpdate = vi.fn();
    render(
      <BlockSettings
        block={stored('gallery', {
          type: 'gallery',
          layout: 'grid',
          columns: 3,
          images: [
            { id: 'a', url: 'https://cdn.test/a.jpg', alt: 'A' },
            { id: 'b', url: 'https://cdn.test/b.jpg', alt: 'B' },
          ],
        })}
        onUpdate={onUpdate}
      />
    );
    fireEvent.change(screen.getByDisplayValue('https://cdn.test/b.jpg'), {
      target: { value: 'https://cdn.test/b2.jpg' },
    });
    expect(onUpdate).toHaveBeenCalledWith({
      images: [
        { id: 'a', url: 'https://cdn.test/a.jpg', alt: 'A' },
        { id: 'b', url: 'https://cdn.test/b2.jpg', alt: 'B' },
      ],
    });
  });

  it('updates a manual testimonial field by id', () => {
    const onUpdate = vi.fn();
    render(
      <BlockSettings
        block={stored('testimonial', {
          type: 'testimonial',
          source: 'manual',
          layout: 'grid',
          testimonials: [{ id: 't1', name: 'Dana', content: 'Great agent', rating: 5 }],
        })}
        onUpdate={onUpdate}
      />
    );
    fireEvent.change(screen.getByDisplayValue('Dana'), { target: { value: 'Dana R.' } });
    expect(onUpdate).toHaveBeenCalledWith({
      testimonials: [{ id: 't1', name: 'Dana R.', content: 'Great agent', rating: 5 }],
    });
  });
});
