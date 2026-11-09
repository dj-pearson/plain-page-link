/**
 * Render an uploaded headshot as the square PNG home-screen icons the
 * per-profile manifest lists (US-481; see avatarAppIcon.ts).
 *
 * Browser only. Throws when the browser cannot decode or draw the image; the
 * caller treats the icons as optional and keeps the upload regardless.
 */
import { APP_ICON_SIZES, headshotSquare, type AppIconSize } from '@/lib/avatarAppIcon';

/** Home-screen launchers fill transparency with black; a photo should not. */
const BACKGROUND = '#ffffff';

const MIN_SOURCE_SIDE = 144;

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas produced no image'))),
      'image/png'
    );
  });
}

export async function renderAppIcons(source: Blob): Promise<Map<AppIconSize, Blob>> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    throw new Error('This browser cannot draw images');
  }
  // EXIF orientation applied, so a phone photo taken upright is not on its side.
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const { sx, sy, side } = headshotSquare(bitmap.width, bitmap.height);
    // Chrome will not use an icon under 144px; blown up that far a photo is a
    // blur, and the platform icon is the better home-screen tile.
    if (side < MIN_SOURCE_SIDE) throw new Error('Image is too small for an app icon');

    const icons = new Map<AppIconSize, Blob>();
    for (const size of APP_ICON_SIZES) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('No 2D canvas');
      context.fillStyle = BACKGROUND;
      context.fillRect(0, 0, size, size);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
      icons.set(size, await canvasToPng(canvas));
    }
    return icons;
  } finally {
    bitmap.close();
  }
}
