/**
 * A stable serialisation of the parts of a page that get persisted (US-116).
 *
 * PageBuilder's autosave effect depended on `isSaving`, which savePage itself
 * flips true and then false — so every save re-ran the effect, which scheduled
 * another save. The editor wrote to the database and toasted "Page saved
 * successfully" every three seconds for as long as it was open, whether or not
 * anything had changed.
 *
 * Comparing this against the last saved value is what makes autosave fire on
 * an actual edit instead of on its own completion.
 *
 * `updatedAt` and `createdAt` are excluded deliberately: they change on every
 * save and would make every page look dirty forever, which is the same loop by
 * another route.
 */
import type { PageConfig } from '@/types/pageBuilder';

export function pageSnapshot(page: PageConfig | null): string {
  if (!page) return '';
  return JSON.stringify({
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    blocks: page.blocks,
    theme: page.theme,
    seo: page.seo,
    published: page.published,
  });
}
