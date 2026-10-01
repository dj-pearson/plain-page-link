/**
 * Images on a page-builder page that would publish with no description (US-235).
 *
 * The image block defaulted its alt to "Image" and the gallery to "Gallery
 * image", so a page published with every picture announced by a word that
 * says nothing. Alt is now required unless the agent marks an image decorative.
 */
import type { PageBlock, GalleryBlockConfig, ImageBlockConfig } from '@/types/pageBuilder';

/** The old defaults read as alt text but describe nothing. */
const PLACEHOLDERS = new Set(['image', 'gallery image', 'photo', 'picture']);

const described = (alt: string | undefined) => !!alt?.trim() && !PLACEHOLDERS.has(alt.trim().toLowerCase());

/** One human-readable line per image that needs a description. */
export function missingAltText(blocks: PageBlock[]): string[] {
  const problems: string[] = [];
  const visible = [...blocks].filter((b) => b.visible).sort((a, b) => a.order - b.order);
  visible.forEach((block, i) => {
    const where = `Block ${i + 1}`;
    if (block.config.type === 'image') {
      const c = block.config as ImageBlockConfig;
      if (!c.imageUrl?.trim()) return;
      // A linked image's alt is the link's name, so it cannot be decorative.
      if (c.link?.trim() && !described(c.alt)) problems.push(`${where}: a linked image needs a description`);
      else if (!c.decorative && !described(c.alt)) problems.push(`${where}: image needs a description`);
    }
    if (block.config.type === 'gallery') {
      const c = block.config as GalleryBlockConfig;
      c.images.forEach((img, n) => {
        if (img.url?.trim() && !img.decorative && !described(img.alt)) {
          problems.push(`${where}: gallery photo ${n + 1} needs a description`);
        }
      });
    }
  });
  return problems;
}
