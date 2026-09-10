/**
 * The declared size of the social image must be the size of the file
 * (US-174).
 *
 * Four components had hardcoded 1200x630 next to an image that is 1536x1024.
 * Nothing compared them, because one is markup and the other is a PNG, and no
 * test in the repo had ever opened the PNG. This one does: the width and height
 * live in the IHDR chunk at a fixed offset, so reading them needs no image
 * library.
 */
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SOCIAL_IMAGE, isDefaultSocialImage } from './og-image';

const PUBLIC = join(process.cwd(), 'public');

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): { width: number; height: number } {
  const buffer = readFileSync(file);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(buffer.subarray(0, 8).equals(signature), `${file} is not a PNG`).toBe(true);
  expect(buffer.subarray(12, 16).toString('ascii'), 'first chunk should be IHDR').toBe('IHDR');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

describe('the default social image', () => {
  const file = join(PUBLIC, DEFAULT_SOCIAL_IMAGE.path.replace(/^\//, ''));

  it('exists where the config says it does', () => {
    expect(() => statSync(file)).not.toThrow();
  });

  it('is the size the config declares', () => {
    const actual = pngSize(file);
    expect(
      actual,
      'og:image:width and og:image:height are read by every unfurl to reserve ' +
        'layout before the image loads. Update DEFAULT_SOCIAL_IMAGE to match the ' +
        'file, or replace the file to match it.'
    ).toEqual({ width: DEFAULT_SOCIAL_IMAGE.width, height: DEFAULT_SOCIAL_IMAGE.height });
  });

  it('is large enough for a large-image card on every platform', () => {
    // X, Facebook and LinkedIn all fall back to a small square card below
    // roughly 300px; Google's large-image rich result wants 1200 or more.
    expect(DEFAULT_SOCIAL_IMAGE.width).toBeGreaterThanOrEqual(1200);
    expect(DEFAULT_SOCIAL_IMAGE.height).toBeGreaterThanOrEqual(630);
  });

  it('has alt text that describes the image rather than repeating the page title', () => {
    expect(DEFAULT_SOCIAL_IMAGE.alt.length).toBeGreaterThan(40);
    expect(DEFAULT_SOCIAL_IMAGE.alt).not.toMatch(/\|/); // a title, not a description
  });
});

describe('isDefaultSocialImage', () => {
  it('recognises the default against any origin', () => {
    expect(isDefaultSocialImage('https://agentbio.net/Cover.png')).toBe(true);
    expect(isDefaultSocialImage('https://preview.pages.dev/Cover.png')).toBe(true);
    expect(isDefaultSocialImage('/Cover.png')).toBe(true);
  });

  it('does not claim to know the size of somebody else’s image', () => {
    expect(isDefaultSocialImage('https://cdn.example.com/article-hero.jpg')).toBe(false);
    expect(isDefaultSocialImage('https://agentbio.net/uploads/Cover.png')).toBe(false);
    expect(isDefaultSocialImage(null)).toBe(false);
    expect(isDefaultSocialImage(undefined)).toBe(false);
    expect(isDefaultSocialImage('')).toBe(false);
  });
});
