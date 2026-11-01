-- US-262: the blog's view counter never counted, and if it had, it would have
-- told Google every article had just been rewritten.
--
-- BlogArticle.tsx incremented view_count with a plain
-- `.from('articles').update({ view_count: n + 1 })`. The only UPDATE paths on
-- articles are "Admins can manage all articles" and "Authors can manage their
-- own articles", so for every real visitor that UPDATE matched zero rows and
-- did nothing. For the one person it did work for — an admin reading the
-- blog — update_articles_updated_at stamped updated_at = now(), and updated_at
-- is what the sitemap's <lastmod>, the article's dateModified and its
-- article:modified_time all report. A page view was published as an edit.
--
-- Two changes:
--   1. articles gets its own updated_at trigger that leaves updated_at alone
--      when view_count is the only column that changed.
--   2. increment_article_view(article, visitor) is the visitor's write path:
--      SECURITY DEFINER, published articles only, and throttled per visitor
--      the same way increment_link_clicks is (US-115).

-- ---------------------------------------------------------------------------
-- 1. A view is not a modification
-- ---------------------------------------------------------------------------
-- Compared as jsonb minus the two columns, so a column added to articles later
-- is covered without anyone remembering this trigger: any change to anything
-- but the counter still moves updated_at.
CREATE OR REPLACE FUNCTION public.articles_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF (to_jsonb(NEW) - 'view_count' - 'updated_at')
     = (to_jsonb(OLD) - 'view_count' - 'updated_at') THEN
    NEW.updated_at := OLD.updated_at;
  ELSE
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

COMMENT ON FUNCTION public.articles_touch_updated_at() IS
  'US-262: updated_at moves on any change except a view_count-only one; it feeds the sitemap lastmod and dateModified.';

DROP TRIGGER IF EXISTS update_articles_updated_at ON public.articles;
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW EXECUTE FUNCTION public.articles_touch_updated_at();

-- ---------------------------------------------------------------------------
-- 2. The visitor's write path
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_article_view(
  p_article_id uuid,
  p_visitor_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_allowed boolean;
BEGIN
  -- visitor_id is the browser's localStorage id: trivially rotated, so this
  -- raises the cost of inflating a count rather than preventing it, exactly as
  -- for link clicks. Three views of one article an hour from one browser is
  -- generous for a person rereading it.
  SELECT rl.allowed INTO v_allowed
  FROM public.check_rate_limit(
    COALESCE(left(p_visitor_id, 64), 'anon') || ':' || p_article_id::text,
    'article_view',
    3,
    3600
  ) AS rl;

  IF NOT COALESCE(v_allowed, true) THEN
    -- Quietly: the caller is fire-and-forget on a reader's page.
    RETURN;
  END IF;

  -- Published only. A draft's counter is not a visitor's to move, and the id
  -- of an unpublished article is not something a visitor should be able to
  -- probe for.
  UPDATE public.articles
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = p_article_id
    AND status = 'published';
END;
$function$;

COMMENT ON FUNCTION public.increment_article_view(uuid, text) IS
  'US-262: the only visitor write path to articles.view_count; published rows only, per-visitor throttled, does not move updated_at.';

-- Public by design (listed in DEFINER_CALLABLE in scripts/verify-schema.mjs):
-- readers of the blog are anonymous. PUBLIC is revoked first so the grant below
-- is the whole of who may call it.
REVOKE EXECUTE ON FUNCTION public.increment_article_view(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_article_view(uuid, text) TO anon, authenticated, service_role;
