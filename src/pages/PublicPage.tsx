import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { FullPageLoader } from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import NotFound from './public/NotFound';

/**
 * /p/:slug — a compatibility redirect to the agent's profile (US-116).
 *
 * This used to be a second public surface, and it was the one that won:
 * FullProfilePage queried custom_pages on every view and, if the agent had any
 * active published page, replaced the whole profile with
 * `<Navigate to="/p/<slug>">`. So opening the page builder once took an agent's
 * listings, testimonials, contact buttons and lead capture off the public web,
 * and this page — which tracked no analytics at all — served in their place.
 *
 * The blocks are a section of /:username now. This route stays only so links
 * already shared to a /p/ URL still arrive somewhere sensible.
 *
 * The lookup is inherently ambiguous and always was: custom_pages is unique on
 * (user_id, slug), not on slug, so two agents can hold the same one and
 * PublicPage's old `.eq('slug', slug).single()` broke for both of them. Here
 * the most recently updated match wins and anything unresolvable is a 404 —
 * which is honest for a URL that is no longer a public address.
 */
export default function PublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [username, setUsername] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveOwner = async () => {
      if (!slug) {
        setResolved(true);
        return;
      }

      try {
        const { data: page, error } = await supabase
          .from('custom_pages')
          .select('user_id')
          .eq('slug', slug)
          .eq('published', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (page?.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', page.user_id)
            .maybeSingle();

          if (!cancelled && profile?.username) {
            setUsername(profile.username);
          }
        }
      } catch (err) {
        logger.error('Failed to resolve a /p/ link to a profile', err as Error);
      } finally {
        if (!cancelled) setResolved(true);
      }
    };

    resolveOwner();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!resolved) {
    return <FullPageLoader text="Loading profile..." />;
  }

  if (!username) {
    return <NotFound />;
  }

  return <Navigate to={`/${username}`} replace />;
}
