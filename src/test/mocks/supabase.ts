import { vi } from 'vitest';
import { mockSession, mockAuthenticatedUser } from './auth';

export interface MockQueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Builds a chainable query-builder mock. Every chained method returns the
 * same builder, and the builder is thenable so `await query` (and terminal
 * methods like .single()) resolve to the provided result.
 */
export const createQueryBuilder = <T = unknown>(
  result: MockQueryResult<T> = { data: null, error: null }
) => {
  const builder: Record<string, unknown> = {};
  const chainable = [
    'select',
    'insert',
    'update',
    'upsert',
    'delete',
    'eq',
    'neq',
    'gt',
    'gte',
    'lt',
    'lte',
    'like',
    'ilike',
    'in',
    'is',
    'contains',
    'order',
    'limit',
    'range',
    'filter',
    'match',
  ];
  for (const method of chainable) {
    builder[method] = vi.fn(() => builder);
  }
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: MockQueryResult<T>) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
};

interface MockSupabaseOptions {
  /** Result returned by any `.from(...)` query chain. */
  queryResult?: MockQueryResult;
  /** Whether `auth.getSession` / `getUser` return an authenticated user. */
  authenticated?: boolean;
}

/**
 * Creates a mock Supabase client stubbing auth, from(), and storage.
 * Pass options to control query results and auth state per test.
 */
export const createMockSupabaseClient = (options: MockSupabaseOptions = {}) => {
  const { queryResult = { data: null, error: null }, authenticated = true } = options;

  const session = authenticated ? mockSession : null;
  const user = authenticated ? mockAuthenticatedUser : null;

  return {
    from: vi.fn(() => createQueryBuilder(queryResult)),
    rpc: vi.fn(() => Promise.resolve(queryResult)),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user }, error: null })),
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { session, user }, error: null })),
      signUp: vi.fn(() => Promise.resolve({ data: { session, user }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ data: {}, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'mock/path.jpg' }, error: null })),
        remove: vi.fn(() => Promise.resolve({ data: [], error: null })),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/mock/path.jpg' },
        })),
        createSignedUrl: vi.fn(() =>
          Promise.resolve({
            data: { signedUrl: 'https://example.com/signed' },
            error: null,
          })
        ),
      })),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };
};

export type MockSupabaseClient = ReturnType<typeof createMockSupabaseClient>;
