import { describe, it, expect } from 'vitest';
import { missingAltText } from './pageBuilderAlt';
import type { PageBlock, BlockConfig } from '@/types/pageBuilder';

const block = (config: BlockConfig, order = 0, visible = true): PageBlock => ({ id: `b${order}`, type: config.type, order, visible, config });
const image = (over: Record<string, unknown> = {}) =>
  ({ type: 'image', imageUrl: '/a.jpg', alt: '', size: 'medium', ...over }) as BlockConfig;

describe('missingAltText', () => {
  it('flags an image with no alt, or with the old placeholder', () => {
    expect(missingAltText([block(image())])).toEqual(['Block 1: image needs a description']);
    expect(missingAltText([block(image({ alt: 'Image' }))])).toHaveLength(1);
  });

  it('accepts a described image or a decorative one', () => {
    expect(missingAltText([block(image({ alt: 'Agent at an open house' }))])).toEqual([]);
    expect(missingAltText([block(image({ decorative: true }))])).toEqual([]);
  });

  it('a linked image cannot be decorative — its alt is the link name', () => {
    expect(missingAltText([block(image({ decorative: true, link: 'https://x.test' }))])).toEqual([
      'Block 1: a linked image needs a description',
    ]);
  });

  it('checks each gallery photo, ignoring empty slots and hidden blocks', () => {
    const gallery = {
      type: 'gallery',
      layout: 'grid',
      columns: 3,
      images: [
        { id: '1', url: '/1.jpg', alt: 'Gallery image' },
        { id: '2', url: '/2.jpg', alt: 'Pool at dusk' },
        { id: '3', url: '/3.jpg', alt: '', decorative: true },
        { id: '4', url: '', alt: '' },
      ],
    } as BlockConfig;
    expect(missingAltText([block(image({ alt: 'ok' }), 0), block(gallery, 1)])).toEqual([
      'Block 2: gallery photo 1 needs a description',
    ]);
    expect(missingAltText([block(gallery, 0, false)])).toEqual([]);
  });
});
