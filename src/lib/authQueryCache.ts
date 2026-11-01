import type { QueryClient } from '@tanstack/react-query';

/**
 * The slice of a zustand store this needs: the current user id, and a
 * subscription to changes. Kept structural so a test can pass the real auth
 * store or a stand-in.
 */
interface AuthUserSource {
  getState: () => { user: { id: string } | null };
  subscribe: (listener: (state: { user: { id: string } | null }) => void) => () => void;
}

/**
 * Drop every cached query when the signed-in agent stops being who they were
 * (US-256).
 *
 * The QueryClient lives for the whole page and most dashboard query keys do
 * not carry the user id (['leads'], ['plan-usage'], ['analytics', ...]). On a
 * shared device, agent A signing out and agent B signing in in the same tab
 * used to serve B A's leads, listings and analytics from the cache for up to
 * the five-minute staleTime.
 *
 * Every sign-out path — signOut(), signOutAllDevices(), the SIGNED_OUT event
 * and the cross-tab broadcast — ends with the store's `user` set to null, and a
 * different account signing in changes its id, so watching the id covers them
 * all without each path having to remember the cache.
 *
 * A first sign-in on the page (no user → someone) is not a change of agent:
 * the cache then only holds anonymous reads, and clearing it would orphan
 * queries already in flight during the cold-load session check.
 */
export function bindQueryCacheToAuth(queryClient: QueryClient, store: AuthUserSource): () => void {
  let lastUserId: string | null = store.getState().user?.id ?? null;

  return store.subscribe((state) => {
    const nextUserId = state.user?.id ?? null;
    if (nextUserId === lastUserId) return;
    const previous = lastUserId;
    lastUserId = nextUserId;
    if (previous !== null) {
      queryClient.clear();
    }
  });
}
