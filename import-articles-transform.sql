-- Create temporary table with text columns for JSON arrays
CREATE TEMP TABLE articles_temp (
  id uuid,
  title text,
  slug text,
  content text,
  excerpt text,
  featured_image_url text,
  author_id uuid,
  status text,
  category text,
  tags text,
  seo_title text,
  seo_description text,
  seo_keywords text,
  view_count integer,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  generated_from_suggestion_id uuid,
  keyword_id uuid
);

-- Import CSV into temp table
\copy articles_temp FROM '/tmp/articles_rows.csv' WITH (FORMAT csv, HEADER true);

-- Insert into real articles table with JSON parsing
INSERT INTO articles (
  id, title, slug, content, excerpt, featured_image_url, author_id, status, category,
  tags, seo_title, seo_description, seo_keywords, view_count, published_at, created_at, updated_at,
  generated_from_suggestion_id, keyword_id
)
SELECT
  id, title, slug, content, excerpt, featured_image_url,
  NULL as author_id,  -- Set to NULL since we don't have users yet
  status, category,
  CASE
    WHEN tags IS NOT NULL AND tags != '' THEN
      (SELECT array_agg(trim(both '"' from elem::text))::text[]
       FROM json_array_elements_text(tags::json) AS elem)
    ELSE NULL
  END,
  seo_title, seo_description,
  CASE
    WHEN seo_keywords IS NOT NULL AND seo_keywords != '' THEN
      (SELECT array_agg(trim(both '"' from elem::text))::text[]
       FROM json_array_elements_text(seo_keywords::json) AS elem)
    ELSE NULL
  END,
  view_count, published_at, created_at, updated_at,
  NULL as generated_from_suggestion_id, -- Set to NULL since we don't have the referenced data
  NULL as keyword_id  -- Set to NULL since we don't have the referenced data
FROM articles_temp
WHERE id IS NOT NULL;

-- Show results
SELECT COUNT(*) as imported_count FROM articles;
SELECT id, title, status FROM articles ORDER BY published_at DESC LIMIT 5;
