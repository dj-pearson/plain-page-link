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
const { calls, toastSuccess } = vi.hoisted(() => ({
  calls: [] as Call[],
  toastSuccess: vi.fn(),
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
      Promise.resolve({ data: [{ id: 'page-1' }], error: null }).then(resolve);
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

import { usePageBuilderStore } from './pageBuilderStore';

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
