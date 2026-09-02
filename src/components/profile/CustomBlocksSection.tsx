import { BlockRenderer } from '@/components/pageBuilder/BlockRenderer';
import type { PageBlock } from '@/types/pageBuilder';

interface CustomBlocksSectionProps {
  /** The active page's blocks, straight from the jsonb column. */
  blocks: unknown;
  /** The profile the page belongs to — blocks that fetch their own data need it. */
  userId: string;
  /** The page's title, used as the section heading when it has one. */
  title?: string | null;
}

/**
 * A page-builder page, rendered as a section of the agent's profile (US-116).
 *
 * It used to be the whole public page: FullProfilePage queried custom_pages on
 * every view and, if the agent had any active published page, replaced the
 * entire profile with `<Navigate to="/p/<slug>">`. So an agent who opened the
 * page builder to try it out silently took their listings, their testimonials,
 * their contact buttons and their lead capture off the public web — and the
 * only way back was to find and deactivate the page.
 *
 * One public surface: /:username is the profile, and a page built in the page
 * builder is extra content within it. That also means the blocks inherit the
 * profile's theme, header, tracking and social metadata rather than needing a
 * second set of each.
 *
 * The blocks arrive as jsonb, so nothing about their shape is guaranteed; a row
 * that is not a list of blocks renders nothing rather than throwing on the
 * public page.
 */
export function CustomBlocksSection({ blocks, userId, title }: CustomBlocksSectionProps) {
  const list: PageBlock[] = Array.isArray(blocks) ? (blocks as PageBlock[]) : [];

  const visible = list
    .filter((block) => block && typeof block === 'object' && block.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (visible.length === 0) return null;

  return (
    <section
      id="custom-blocks"
      className="w-full max-w-3xl mx-auto px-4 py-8 scroll-mt-16 sm:scroll-mt-20"
      aria-label={title || 'More from this agent'}
    >
      <div className="flex flex-col gap-8">
        {visible.map((block) => (
          <div key={block.id} data-block-type={block.type}>
            <BlockRenderer block={block} isEditing={false} userId={userId} />
          </div>
        ))}
      </div>
    </section>
  );
}
