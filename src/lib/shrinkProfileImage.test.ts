/**
 * US-591: avatars and brokerage logos are downscaled in the browser before
 * they are stored, because the public profile is otherwise served the
 * uploaded original (often several MB) for a 128px box.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  AVATAR_SHRINK,
  LOGO_SHRINK,
  candidateTypes,
  renameForType,
  renderAvatarVariant,
  scaledSize,
  variantSize,
  shouldReplace,
  shrinkProfileImage,
} from './shrinkProfileImage';

describe('scaledSize', () => {
  it('fits the longest side to maxSide, keeping the aspect ratio', () => {
    expect(scaledSize(4000, 3000, 800)).toEqual({ width: 800, height: 600 });
    expect(scaledSize(3000, 4000, 800)).toEqual({ width: 600, height: 800 });
  });

  it('never upscales', () => {
    expect(scaledSize(300, 200, 800)).toEqual({ width: 300, height: 200 });
    expect(scaledSize(800, 800, 800)).toEqual({ width: 800, height: 800 });
  });

  it('keeps an extreme logo at least 1px tall', () => {
    expect(scaledSize(10000, 5, 400)).toEqual({ width: 400, height: 1 });
  });
});

describe('variantSize (US-604)', () => {
  it('fits the SHORT side, which is what fills an object-cover circle', () => {
    expect(variantSize(600, 800, 256)).toEqual({ width: 256, height: 341 });
    expect(variantSize(800, 600, 256)).toEqual({ width: 341, height: 256 });
  });

  it('never upscales', () => {
    expect(variantSize(200, 300, 256)).toEqual({ width: 200, height: 300 });
  });

  it('caps the long side of a panorama at three times the short side', () => {
    expect(variantSize(8000, 800, 256)).toEqual({ width: 768, height: 77 });
  });
});

describe('candidateTypes', () => {
  it('stores a photo as JPEG (emails, crawlers) but keeps a logo transparent', () => {
    expect(candidateTypes(true)).toEqual(['image/jpeg']);
    expect(candidateTypes(false)).toEqual(['image/webp']);
    expect(AVATAR_SHRINK.opaque).toBe(true);
    expect(LOGO_SHRINK.opaque).toBe(false);
  });
});

describe('shouldReplace', () => {
  const original = new Blob([new Uint8Array(1000)], { type: 'image/jpeg' });

  it('takes a smaller blob of the requested type', () => {
    const webp = new Blob([new Uint8Array(100)], { type: 'image/webp' });
    expect(shouldReplace(original, webp, 'image/webp')).toBe(true);
  });

  it('refuses the PNG toBlob silently falls back to for an unsupported type', () => {
    const png = new Blob([new Uint8Array(100)], { type: 'image/png' });
    expect(shouldReplace(original, png, 'image/webp')).toBe(false);
  });

  it('keeps the original when the re-encode is not smaller', () => {
    const big = new Blob([new Uint8Array(2000)], { type: 'image/webp' });
    expect(shouldReplace(original, big, 'image/webp')).toBe(false);
  });
});

describe('renameForType', () => {
  it('swaps the extension to match the stored type', () => {
    expect(renameForType('me.jpeg', 'image/webp')).toBe('me.webp');
    expect(renameForType('logo.png', 'image/jpeg')).toBe('logo.jpg');
    expect(renameForType('noext', 'image/webp')).toBe('noext.webp');
  });
});

describe('shrinkProfileImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const bigPhoto = () => new File([new Uint8Array(50_000)], 'me.jpg', { type: 'image/jpeg' });

  /** A canvas whose toBlob answers with `answer(type)`. */
  function stubCanvas(answer: (type: string) => Blob | null) {
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ fillRect: vi.fn(), drawImage }),
      toBlob: (cb: (b: Blob | null) => void, type: string) => cb(answer(type)),
    };
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
      tag === 'canvas' ? canvas : realCreate(tag)) as typeof document.createElement);
    return { canvas, drawImage };
  }

  function stubBitmap(width: number, height: number) {
    const close = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width, height, close }))
    );
    return close;
  }

  it('returns the original where the browser cannot draw images', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    const file = bigPhoto();
    expect(await shrinkProfileImage(file, AVATAR_SHRINK)).toBe(file);
  });

  it('stores a downscaled JPEG named to match', async () => {
    const close = stubBitmap(4000, 3000);
    const { canvas, drawImage } = stubCanvas((type) => new Blob([new Uint8Array(4_000)], { type }));

    const out = await shrinkProfileImage(
      new File([new Uint8Array(50_000)], 'me.png', { type: 'image/png' }),
      AVATAR_SHRINK
    );

    expect(out.type).toBe('image/jpeg');
    expect(out.name).toBe('me.jpg');
    expect(out.size).toBe(4_000);
    expect([canvas.width, canvas.height]).toEqual([800, 600]);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 800, 600);
    expect(close).toHaveBeenCalled();
  });

  it('never stores a photo as WebP, which Outlook and some crawlers cannot show', async () => {
    stubBitmap(4000, 3000);
    const requested: string[] = [];
    stubCanvas((type) => {
      requested.push(type);
      return new Blob([new Uint8Array(5_000)], { type });
    });

    const out = await shrinkProfileImage(bigPhoto(), AVATAR_SHRINK);
    expect(requested).toEqual(['image/jpeg']);
    expect(out.type).toBe('image/jpeg');
  });

  it('keeps the original photo where JPEG cannot be encoded', async () => {
    stubBitmap(4000, 3000);
    stubCanvas(() => new Blob([new Uint8Array(9_000)], { type: 'image/png' }));
    const file = bigPhoto();
    expect(await shrinkProfileImage(file, AVATAR_SHRINK)).toBe(file);
  });

  it('keeps a logo as uploaded rather than flatten its transparency to JPEG', async () => {
    stubBitmap(2000, 500);
    stubCanvas((type) =>
      type === 'image/webp'
        ? new Blob([new Uint8Array(9_000)], { type: 'image/png' })
        : new Blob([new Uint8Array(100)], { type })
    );
    const logo = new File([new Uint8Array(50_000)], 'logo.png', { type: 'image/png' });

    expect(await shrinkProfileImage(logo, LOGO_SHRINK)).toBe(logo);
  });

  it('returns the original when decoding fails', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('decode failed');
      })
    );
    const file = bigPhoto();
    expect(await shrinkProfileImage(file, AVATAR_SHRINK)).toBe(file);
  });

  describe('renderAvatarVariant (US-604)', () => {
    it('renders a 256px-short-side WebP', async () => {
      const close = stubBitmap(600, 800);
      const { canvas, drawImage } = stubCanvas((type) => new Blob([new Uint8Array(900)], { type }));

      const out = await renderAvatarVariant(bigPhoto(), 256);
      expect(out?.type).toBe('image/webp');
      expect([canvas.width, canvas.height]).toEqual([256, 341]);
      expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 256, 341);
      expect(close).toHaveBeenCalled();
    });

    it('gives null where WebP cannot be encoded, so no companion is claimed', async () => {
      stubBitmap(600, 800);
      stubCanvas(() => new Blob([new Uint8Array(900)], { type: 'image/png' }));
      expect(await renderAvatarVariant(bigPhoto(), 256)).toBeNull();
    });

    it('gives null where the browser cannot draw images', async () => {
      vi.stubGlobal('createImageBitmap', undefined);
      expect(await renderAvatarVariant(bigPhoto(), 256)).toBeNull();
    });
  });
});
