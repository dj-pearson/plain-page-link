/**
 * US-116: PageBuilder's autosave effect depended on `isSaving`, which savePage
 * flips true and then false — so every save re-ran the effect, which scheduled
 * another save. The editor wrote to the database and toasted "Page saved
 * successfully" every three seconds for as long as it was open.
 *
 * The comparison that breaks the loop is this snapshot, so this is where the
 * loop is pinned down: a save must not change it, and an edit must.
 */
import { describe, it, expect } from 'vitest';
import { pageSnapshot } from './pageSnapshot';
import type { PageConfig } from '@/types/pageBuilder';

const page = (overrides: Partial<PageConfig> = {}): PageConfig =>
  ({
    id: '00000000-0000-4000-8000-0000000000c3',
    userId: '11111111-1111-1111-1111-111111111111',
    slug: 'spring-listings',
    title: 'Spring Listings',
    description: 'What I have on right now',
    blocks: [{ id: 'b1', type: 'text', order: 0, visible: true, config: { content: 'Hi' } }],
    theme: { name: 'Default', preset: 'modern' },
    seo: { title: 'Spring Listings' },
    published: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }) as unknown as PageConfig;

describe('pageSnapshot', () => {
  it('is stable across a save, which is what stops autosave retriggering itself', () => {
    const before = pageSnapshot(page());
    // A save stamps updatedAt. If the snapshot included it, the page would look
    // dirty the instant it was saved — the same loop by another route.
    const after = pageSnapshot(page({ updatedAt: new Date('2026-06-01T12:00:00Z') }));
    expect(after).toBe(before);
  });

  it('changes for every edit the agent can make', () => {
    const base = pageSnapshot(page());
    expect(pageSnapshot(page({ title: 'Summer Listings' }))).not.toBe(base);
    expect(pageSnapshot(page({ slug: 'summer-listings' }))).not.toBe(base);
    expect(pageSnapshot(page({ description: 'Changed' }))).not.toBe(base);
    expect(pageSnapshot(page({ published: true }))).not.toBe(base);
    expect(
      pageSnapshot(
        page({
          blocks: [{ id: 'b1', type: 'text', order: 0, visible: true, config: { content: 'Bye' } }],
        } as Partial<PageConfig>)
      )
    ).not.toBe(base);
    expect(pageSnapshot(page({ theme: { name: 'Bold' } } as Partial<PageConfig>))).not.toBe(base);
  });

  it('is empty for no page, so the effect has nothing to act on', () => {
    expect(pageSnapshot(null)).toBe('');
  });
});
