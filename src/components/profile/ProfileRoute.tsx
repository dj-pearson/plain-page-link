/**
 * The /:slug route element: starts the public profile read, then renders the
 * lazily loaded profile page (US-267). Also the element of the listing page
 * route, /:username/listing/:listingId (US-275).
 *
 * This component is in the entry chunk on purpose. React Router renders it the
 * moment the catch-all matches, so its effect fires while the FullProfilePage
 * chunk is still downloading — the profile row and the six reads after it run
 * in parallel with the code, instead of after it. FullProfilePage's own
 * usePublicProfile shares the query key, so it picks up the request in flight
 * rather than issuing a second one.
 *
 * The Suspense boundary has to be HERE, below the effect. If the lazy page
 * suspended up to App's boundary, this component would never commit and the
 * effect would not run until the chunk had arrived, which is the waterfall
 * this exists to remove. The fallback is the page's own loading skeleton, so a
 * visitor sees one continuous skeleton from route match to data rather than a
 * generic spinner that is then swapped for it.
 */
import { Suspense, useEffect, type ComponentType } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ProfileSkeleton } from '@/components/LoadingSpinner';
import { publicProfileQueryOptions } from '@/hooks/usePublicProfile';
import { useAuthStore } from '@/stores/useAuthStore';
import { normalizeUsername } from '@/lib/username';
import { useProfileManifest } from '@/hooks/useProfileManifest';

interface ProfileRouteProps {
  /** The lazily loaded page, e.g. `lazy(() => import('./FullProfilePage'))`. */
  page: ComponentType;
}

export function ProfileRoute({ page: Page }: ProfileRouteProps) {
  // /:slug is the profile; /:username/listing/:listingId a listing page on it
  // (US-275), which reads the same profile query.
  const { slug, username: usernameParam } = useParams<{ slug?: string; username?: string }>();
  const queryClient = useQueryClient();
  const username = normalizeUsername(slug ?? usernameParam);
  // Same key as usePublicProfile: the viewer decides whether an unpublished
  // page is visible (US-265), so the prefetch must carry it too.
  const viewerId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (!username) return;
    // prefetchQuery never throws and respects staleTime, so a profile already
    // in the cache (Back from a listing, a second visit) costs nothing. A
    // failure is cached as the query's error and handled by the page.
    void queryClient.prefetchQuery(publicProfileQueryOptions(username, viewerId));
  }, [queryClient, username, viewerId]);

  // The same query, read only for the photo: the home-screen icon on iOS
  // (US-481). It shares the key, so it adds no request.
  const { data: avatarUrl } = useQuery({
    ...publicProfileQueryOptions(username, viewerId),
    select: (page) => page.profile.avatar_url ?? null,
  });

  // Add to Home Screen here installs the agent's page, not the dashboard
  // (US-460), under the agent's photo (US-481).
  useProfileManifest(username, avatarUrl ?? null);

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <Page />
    </Suspense>
  );
}

export default ProfileRoute;
