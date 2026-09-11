-- US-202: the columns the SEO tooling has been trying to write since it was
-- written.
--
-- US-200 found 59 write-column mismatches across 11 tables — every one of them
-- an insert or update PostgREST rejects with 400, logged and swallowed, so the
-- feature computed its result and discarded it. US-201 closed 55 of them by
-- naming the column that already existed. These are the remainder: values with
-- nowhere to go, which need the schema to change rather than the code.
--
-- Each one is added next to the columns it belongs with, so the asymmetry that
-- caused the confusion in the first place is what is being removed.

-- ---------------------------------------------------------------------------
-- articles: the per-article SEO analysis analyze-blog-posts-seo produces.
--
-- articles already carries seo_title, seo_description and seo_keywords, so an
-- article's SEO metadata lives on the article by established convention. The
-- score and its findings follow the same rule.
-- ---------------------------------------------------------------------------
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS seo_score integer,
  ADD COLUMN IF NOT EXISTS seo_issues jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_recommendations jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_seo_check timestamp with time zone;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articles_seo_score_check'
  ) THEN
    ALTER TABLE public.articles
      ADD CONSTRAINT articles_seo_score_check
      CHECK (seo_score IS NULL OR (seo_score >= 0 AND seo_score <= 100));
  END IF;
END $$;

COMMENT ON COLUMN public.articles.seo_score IS
  'analyze-blog-posts-seo score, 0-100. NULL means never analysed (US-202).';
COMMENT ON COLUMN public.articles.last_seo_check IS
  'When analyze-blog-posts-seo last ran for this article (US-202).';

-- ---------------------------------------------------------------------------
-- seo_core_web_vitals: INP.
--
-- The table has lcp, fid, cls, fcp, ttfb, tti, tbt and si — it predates INP
-- replacing FID as a Core Web Vital in 2024. gsc-fetch-core-web-vitals reads
-- INP from CrUX and, since US-201, parks it in the field_data jsonb because
-- there was no column. A headline metric buried in jsonb is not queryable,
-- which is the whole reason the other eight are columns.
-- ---------------------------------------------------------------------------
ALTER TABLE public.seo_core_web_vitals
  ADD COLUMN IF NOT EXISTS inp numeric(10,2),
  ADD COLUMN IF NOT EXISTS inp_pass boolean;

COMMENT ON COLUMN public.seo_core_web_vitals.inp IS
  'Interaction to Next Paint, ms. Replaced FID as a Core Web Vital in 2024 (US-202).';

-- ---------------------------------------------------------------------------
-- seo_content_optimization: the page's own metadata and its findings.
--
-- The table stores page_title but had no meta_description — it has
-- meta_description_suggestions, which is what to change it TO, with nowhere to
-- record what it currently IS. It also had no home for an analyzer's issues or
-- recommendations, though seo_link_analysis has jsonb columns for exactly both.
-- ---------------------------------------------------------------------------
ALTER TABLE public.seo_content_optimization
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS issues jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recommendations jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.seo_content_optimization.meta_description IS
  'The meta description as found. The suggestions column is what to change it to (US-202).';
