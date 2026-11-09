/**
 * US-116: setAsActivePage never cleared the other active pages.
 *
 * So an agent who marked a second page active had two rows with
 * is_active = true, and the `.single()` lookups that ask "which page is
 * active?" then failed with PGRST116 — leaving them with neither. savePage also
 * toasted on every call, which is how the autosave loop announced itself every
 * three seconds.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

interface Call {
  table: string;
  op: string;
  payload?: unknown;
  filters: Array<[string, string, unknown]>;
}

// vi.mock factories are hoisted above the module body, so anything they close
// over has to be hoisted with them.
const { calls, toastSuccess, listResult } = vi.hoisted(() => ({
  calls: [] as Call[],
  toastSuccess: vi.fn(),
  // What an awaited (non-single) query resolves to; loadUserPages tests set it.
  listResult: { current: null as null | { data: unknown; error: unknown } },
}));

vi.mock('sonner', () => ({
  toast: { success: toastSuccess, error: vi.fn() },
}));

vi.mock('@/integrations/supabase/client', () => {
  const builder = (call: Call) => {
    const chain: Record<string, unknown> = {};
    for (const method of ['eq', 'neq', 'order', 'limit', 'select']) {
      chain[method] = (...args: unknown[]) => {
        if (method === 'eq' || method === 'neq') {
          call.filters.push([method, String(args[0]), args[1]]);
        }
        return chain;
      };
    }
    // Every terminal resolves to the row being addressed.
    chain.maybeSingle = () => Promise.resolve({ data: { id: 'page-1' }, error: null });
    chain.single = () => Promise.resolve({ data: { id: 'page-1' }, error: null });
    chain.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve(listResult.current ?? { data: [{ id: 'page-1' }], error: null }).then(
        resolve
      );
    return chain;
  };

  return {
    supabase: {
      auth: {
        getUser: () => Promise.resolve({ data: { user: { id: 'agent-1' } }, error: null }),
      },
      from: (table: string) => ({
        select: (...args: unknown[]) => {
          const call: Call = { table, op: 'select', payload: args[0], filters: [] };
          calls.push(call);
          return builder(call);
        },
        update: (payload: unknown) => {
          const call: Call = { table, op: 'update', payload, filters: [] };
          calls.push(call);
          return builder(call);
        },
        insert: (payload: unknown) => {
          const call: Call = { table, op: 'insert', payload, filters: [] };
          calls.push(call);
          return builder(call);
        },
      }),
    },
  };
});

// Auto-population is the network wait inside addBlockToPage. Each call parks
// until the test releases it, so the tests can interleave edits with it.
const { populateQueue } = vi.hoisted(() => ({
  populateQueue: [] as Array<{ config: unknown; release: () => void }>,
}));
vi.mock('@/lib/autoPopulateBlocks', () => ({
  autoPopulateBlockConfig: (config: unknown) =>
    new Promise((resolve) => {
      populateQueue.push({ config, release: () => resolve(config) });
    }),
}));

import { usePageBuilderStore } from './pageBuilderStore';
import { pageSnapshot } from '@/lib/pageSnapshot';
import type { PageConfig } from '@/types/pageBuilder';

describe('setAsActivePage', () => {
  beforeEach(() => {
    calls.length = 0;
    toastSuccess.mockReset();
  });

  it('deactivates the siblings before activating the chosen page', async () => {
    await usePageBuilderStore.getState().setAsActivePage('page-1');

    const updates = calls.filter((c) => c.table === 'custom_pages' && c.op === 'update');
    expect(updates.length).toBe(2);

    const [clear, activate] = updates;
    expect(clear.payload).toEqual({ is_active: false });
    // Scoped to the agent, and excluding the page being activated.
    expect(clear.filters).toContainEqual(['eq', 'user_id', 'agent-1']);
    expect(clear.filters).toContainEqual(['neq', 'id', 'page-1']);

    expect(activate.payload).toEqual({ is_active: true });
    expect(activate.filters).toContainEqual(['eq', 'id', 'page-1']);
    expect(activate.filters).toContainEqual(['eq', 'user_id', 'agent-1']);
  });
});

describe('savePage', () => {
  beforeEach(() => {
    calls.length = 0;
    toastSuccess.mockReset();
    usePageBuilderStore.setState({
      page: {
        id: 'page-1',
        userId: 'agent-1',
        slug: 'spring-listings',
        title: 'Spring Listings',
        description: '',
        blocks: [],
        theme: {},
        seo: {},
        published: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
      } as never,
      lastSavedSnapshot: null,
    });
  });

  it('does not toast — autosave calls it, and announced every background write', async () => {
    await usePageBuilderStore.getState().savePage();
    expect(toastSuccess).not.toHaveBeenCalled();
  });

  it('records the saved snapshot, so autosave stops asking', async () => {
    await usePageBuilderStore.getState().savePage();
    const snapshot = usePageBuilderStore.getState().lastSavedSnapshot;
    expect(snapshot).toBeTruthy();
    expect(snapshot).toContain('spring-listings');
  });

  it('scopes the existence check to the owner', async () => {
    await usePageBuilderStore.getState().savePage();
    const lookup = calls.find((c) => c.table === 'custom_pages' && c.op === 'select');
    expect(lookup?.filters).toContainEqual(['eq', 'id', 'page-1']);
    expect(lookup?.filters).toContainEqual(['eq', 'user_id', 'agent-1']);
  });
});

describe('loadUserPages (US-630)', () => {
  beforeEach(() => {
    calls.length = 0;
    listResult.current = null;
  });

  it('carries is_active through, so the page list can say which page is live', async () => {
    listResult.current = {
      data: [
        {
          id: 'page-1',
          user_id: 'agent-1',
          slug: 'spring',
          title: 'Spring',
          description: null,
          blocks: [],
          theme: {},
          seo: {},
          published: true,
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      error: null,
    };
    const pages = await usePageBuilderStore.getState().loadUserPages();
    expect(pages[0].isActive).toBe(true);
  });

  it('rethrows a failed query instead of answering "no pages"', async () => {
    listResult.current = { data: null, error: new Error('permission denied') };
    await expect(usePageBuilderStore.getState().loadUserPages()).rejects.toThrow(
      'permission denied'
    );
  });
});

// US-671: lost edits and silent failures in the editor.
const basePage = (overrides: Partial<PageConfig> = {}): PageConfig =>
  ({
    id: 'page-1',
    userId: 'agent-1',
    slug: 'spring-listings',
    title: 'Spring Listings',
    description: '',
    blocks: [],
    theme: {},
    seo: {},
    published: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  }) as PageConfig;

/** Let the awaited getUser() inside addBlockToPage settle. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('setPage baseline (US-671)', () => {
  beforeEach(() => usePageBuilderStore.getState().resetBuilder());

  it('treats a page opened from the database as saved, so autosave does not rewrite it', () => {
    const page = basePage();
    usePageBuilderStore.getState().setPage(page, { saved: true });
    expect(usePageBuilderStore.getState().lastSavedSnapshot).toBe(pageSnapshot(page));
  });

  it('treats a page that has never been written as unsaved', () => {
    usePageBuilderStore.getState().setPage(basePage(), { saved: true });
    usePageBuilderStore.getState().setPage(basePage({ id: 'page-2', slug: 'new-page' }));
    // Not the previous page's snapshot carried over.
    expect(usePageBuilderStore.getState().lastSavedSnapshot).toBeNull();
  });

  it('clears the baseline when the editor closes', () => {
    usePageBuilderStore.getState().setPage(basePage(), { saved: true });
    usePageBuilderStore.getState().setPage(null);
    expect(usePageBuilderStore.getState().lastSavedSnapshot).toBeNull();
  });
});

describe('addBlockToPage (US-671)', () => {
  beforeEach(() => {
    populateQueue.length = 0;
    usePageBuilderStore.getState().resetBuilder();
    usePageBuilderStore.getState().setPage(basePage(), { saved: true });
  });

  it('keeps both blocks when a second is added before the first has populated', async () => {
    const store = usePageBuilderStore.getState();
    const first = store.addBlockToPage('text');
    const second = store.addBlockToPage('divider');
    await flush();
    expect(populateQueue).toHaveLength(2);

    populateQueue[0].release();
    await first;
    populateQueue[1].release();
    await second;

    const blocks = usePageBuilderStore.getState().page?.blocks ?? [];
    expect(blocks.map((b) => b.type)).toEqual(['text', 'divider']);
    expect(blocks.map((b) => b.order)).toEqual([0, 1]);
    expect(usePageBuilderStore.getState().selectedBlockId).toBe(blocks[1].id);
  });

  it('does not roll back an edit made while the block populated', async () => {
    const adding = usePageBuilderStore.getState().addBlockToPage('text');
    await flush();
    usePageBuilderStore.getState().updatePageMeta({ title: 'Typed meanwhile' });

    populateQueue[0].release();
    await adding;

    const page = usePageBuilderStore.getState().page;
    expect(page?.title).toBe('Typed meanwhile');
    expect(page?.blocks).toHaveLength(1);
  });

  it('drops the block if the agent opened another page meanwhile', async () => {
    const adding = usePageBuilderStore.getState().addBlockToPage('text');
    await flush();
    usePageBuilderStore.getState().setPage(basePage({ id: 'page-2', slug: 'other' }), {
      saved: true,
    });

    populateQueue[0].release();
    await adding;

    const page = usePageBuilderStore.getState().page;
    expect(page?.id).toBe('page-2');
    expect(page?.blocks).toHaveLength(0);
  });

  it('inserts at a position without mutating blocks held in the undo history', async () => {
    const adding = usePageBuilderStore.getState().addBlockToPage('text');
    await flush();
    populateQueue[0].release();
    await adding;
    const firstBlock = usePageBuilderStore.getState().page!.blocks[0];

    const inserting = usePageBuilderStore.getState().addBlockToPage('divider', 0);
    await flush();
    populateQueue[1].release();
    await inserting;

    const blocks = usePageBuilderStore.getState().page!.blocks;
    expect(blocks.map((b) => b.type)).toEqual(['divider', 'text']);
    expect(blocks[1].order).toBe(1);
    // The object in the previous history entry still says order 0.
    expect(firstBlock.order).toBe(0);

    usePageBuilderStore.getState().undo();
    expect(usePageBuilderStore.getState().page!.blocks.map((b) => b.type)).toEqual(['text']);
  });
});

describe('publishPage (US-671)', () => {
  const realSavePage = usePageBuilderStore.getState().savePage;

  beforeEach(() => {
    usePageBuilderStore.getState().resetBuilder();
    usePageBuilderStore.setState({ savePage: realSavePage });
  });

  it('puts the page back to draft when the write fails', async () => {
    usePageBuilderStore.getState().setPage(basePage(), { saved: true });
    usePageBuilderStore.setState({
      savePage: vi.fn().mockRejectedValue(new Error('network down')),
    });

    await expect(usePageBuilderStore.getState().publishPage()).rejects.toThrow('network down');

    const state = usePageBuilderStore.getState();
    expect(state.page?.published).toBe(false);
    expect(state.history[state.historyIndex].published).toBe(false);
    // Back to what is stored, so autosave has nothing to publish behind the
    // agent's back.
    expect(pageSnapshot(state.page)).toBe(state.lastSavedSnapshot);
  });

  it('keeps an already-published page published when a re-publish fails', async () => {
    usePageBuilderStore.getState().setPage(basePage({ published: true }), { saved: true });
    usePageBuilderStore.setState({
      savePage: vi.fn().mockRejectedValue(new Error('network down')),
    });

    await expect(usePageBuilderStore.getState().publishPage()).rejects.toThrow();
    expect(usePageBuilderStore.getState().page?.published).toBe(true);
  });

  it('stays published when the write succeeds', async () => {
    usePageBuilderStore.getState().setPage(basePage(), { saved: true });
    await usePageBuilderStore.getState().publishPage();
    const state = usePageBuilderStore.getState();
    expect(state.page?.published).toBe(true);
    expect(state.lastSavedSnapshot).toBe(pageSnapshot(state.page));
  });
});
