-- pSEO (Programmatic SEO) Tables
-- Supports automated generation of ~9,550 agent discovery pages

-- Core pSEO pages table
CREATE TABLE IF NOT EXISTS pseo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL CHECK (page_type IN (
    'city-directory',
    'city-specialty',
    'city-buyers-agent',
    'city-listing-agent',
    'state-directory',
    'neighborhood-directory',
    'city-situation'
  )),
  url_path TEXT NOT NULL UNIQUE,
  combination JSONB NOT NULL,
  content JSONB NOT NULL,
  is_published BOOLEAN DEFAULT false,
  quality_score INTEGER DEFAULT 0,
  agent_count INTEGER NOT NULL DEFAULT 0,
  content_hash TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  next_refresh_at TIMESTAMPTZ,
  generation_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  error_count INTEGER DEFAULT 0,
  CONSTRAINT valid_url_path CHECK (url_path ~ '^/[a-z0-9-/]+$')
);

CREATE INDEX IF NOT EXISTS idx_pseo_pages_url_path ON pseo_pages(url_path);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_page_type ON pseo_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_published ON pseo_pages(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_pseo_pages_combination_city ON pseo_pages USING gin(combination);
CREATE INDEX IF NOT EXISTS idx_pseo_pages_refresh ON pseo_pages(next_refresh_at) WHERE is_published = true;

-- Auto-update updated_at and set published_at
CREATE OR REPLACE FUNCTION update_pseo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD.is_published IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pseo_pages_updated_at
  BEFORE UPDATE ON pseo_pages
  FOR EACH ROW EXECUTE FUNCTION update_pseo_updated_at();

-- RLS
ALTER TABLE pseo_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published pseo pages"
  ON pseo_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin full access pseo pages"
  ON pseo_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation queue table
CREATE TABLE IF NOT EXISTS pseo_combination_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  priority INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'complete', 'failed', 'insufficient_data')),
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  UNIQUE (page_type, combination)
);

CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON pseo_combination_queue(status, priority, queued_at);

ALTER TABLE pseo_combination_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access pseo queue"
  ON pseo_combination_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Taxonomy table (city/state/specialty/situation context objects)
CREATE TABLE IF NOT EXISTS pseo_taxonomy (
  id TEXT PRIMARY KEY,
  taxonomy_type TEXT NOT NULL
    CHECK (taxonomy_type IN ('city', 'state', 'neighborhood', 'specialty', 'situation', 'property_type')),
  display_name TEXT NOT NULL,
  parent_id TEXT REFERENCES pseo_taxonomy(id),
  context JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  tier INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON pseo_taxonomy(taxonomy_type);
CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON pseo_taxonomy(parent_id);

ALTER TABLE pseo_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active taxonomy"
  ON pseo_taxonomy FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin full access taxonomy"
  ON pseo_taxonomy FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Generation errors log
CREATE TABLE IF NOT EXISTS pseo_generation_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  combination JSONB NOT NULL,
  error_type TEXT NOT NULL
    CHECK (error_type IN ('api_error', 'validation_failed', 'quality_check_failed', 'timeout', 'parse_error')),
  error_detail TEXT,
  quality_check_failures JSONB,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_created_at ON pseo_generation_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_type ON pseo_generation_errors(error_type);

ALTER TABLE pseo_generation_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read errors"
  ON pseo_generation_errors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Prompt templates table
CREATE TABLE IF NOT EXISTS pseo_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL UNIQUE,
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pseo_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access prompts"
  ON pseo_prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
