-- ============================================================================
-- ML Lead Scoring Tables
-- Stores model weights and A/B test results for ML-based lead scoring
-- ============================================================================

-- ============================================================================
-- ML Model Weights Table
-- Stores trained model weights per user for personalized lead scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_model_weights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Model data (stored as JSONB for flexibility)
    weights JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Model metadata
    version TEXT,
    training_examples INTEGER DEFAULT 0,
    accuracy DECIMAL(5,4),
    auc DECIMAL(5,4),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one model per user (upsert pattern)
    CONSTRAINT ml_model_weights_user_unique UNIQUE (user_id)
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_ml_model_weights_user_id ON ml_model_weights(user_id);

-- Enable RLS
ALTER TABLE ml_model_weights ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own model weights
CREATE POLICY "Users can view own model weights"
    ON ml_model_weights
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own model weights"
    ON ml_model_weights
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own model weights"
    ON ml_model_weights
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own model weights"
    ON ml_model_weights
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- A/B Test Results Table
-- Stores historical A/B test results comparing ML vs rule-based scoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Test identification
    test_id TEXT NOT NULL,

    -- Test analysis results (stored as JSONB)
    analysis JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Denormalized key metrics for easy querying
    ml_conversion_rate DECIMAL(5,4),
    rules_conversion_rate DECIMAL(5,4),
    winner TEXT CHECK (winner IN ('ml', 'rules', 'inconclusive')),
    confidence DECIMAL(5,4),
    duration_days DECIMAL(10,2),

    -- Sample sizes
    ml_count INTEGER DEFAULT 0,
    rules_count INTEGER DEFAULT 0,
    ml_conversions INTEGER DEFAULT 0,
    rules_conversions INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ab_test_results_user_id ON ab_test_results(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_test_id ON ab_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_created_at ON ab_test_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ab_test_results_winner ON ab_test_results(winner);

-- Enable RLS
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own A/B test results"
    ON ab_test_results
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own A/B test results"
    ON ab_test_results
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own A/B test results"
    ON ab_test_results
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own A/B test results"
    ON ab_test_results
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Lead Scores Table (Optional - for persistence and analytics)
-- Stores individual lead scores for historical analysis
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,

    -- Score data
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    priority TEXT NOT NULL CHECK (priority IN ('hot', 'warm', 'cold')),
    variant TEXT NOT NULL CHECK (variant IN ('ml', 'rules')),

    -- ML-specific data
    confidence DECIMAL(5,4),
    probability DECIMAL(5,4),
    model_version TEXT,

    -- Feature importance (top 5 contributing features)
    feature_importance JSONB,

    -- Outcome tracking
    converted BOOLEAN,
    conversion_recorded_at TIMESTAMPTZ,

    -- Timestamps
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Unique constraint: one score per lead (latest wins)
    CONSTRAINT lead_scores_lead_unique UNIQUE (lead_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_scores_user_id ON lead_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_priority ON lead_scores(priority);
CREATE INDEX IF NOT EXISTS idx_lead_scores_variant ON lead_scores(variant);
CREATE INDEX IF NOT EXISTS idx_lead_scores_scored_at ON lead_scores(scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_converted ON lead_scores(converted) WHERE converted IS NOT NULL;

-- Enable RLS
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own lead scores"
    ON lead_scores
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lead scores"
    ON lead_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lead scores"
    ON lead_scores
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lead scores"
    ON lead_scores
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ML Training Examples Table
-- Stores labeled examples for model training
-- ============================================================================

CREATE TABLE IF NOT EXISTS ml_training_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL,

    -- Feature data (stored as JSONB)
    features JSONB NOT NULL,

    -- Label
    converted BOOLEAN NOT NULL,

    -- Metadata
    source TEXT,
    lead_type TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lead_created_at TIMESTAMPTZ,
    conversion_recorded_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_user_id ON ml_training_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_converted ON ml_training_examples(converted);
CREATE INDEX IF NOT EXISTS idx_ml_training_examples_created_at ON ml_training_examples(created_at DESC);

-- Enable RLS
ALTER TABLE ml_training_examples ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own training examples"
    ON ml_training_examples
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training examples"
    ON ml_training_examples
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own training examples"
    ON ml_training_examples
    FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ml_model_weights
DROP TRIGGER IF EXISTS update_ml_model_weights_updated_at ON ml_model_weights;
CREATE TRIGGER update_ml_model_weights_updated_at
    BEFORE UPDATE ON ml_model_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper function to extract denormalized metrics from analysis JSON
-- ============================================================================

CREATE OR REPLACE FUNCTION extract_ab_test_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract metrics from analysis JSONB for easier querying
    NEW.ml_conversion_rate := (NEW.analysis->'mlResults'->>'conversionRate')::DECIMAL;
    NEW.rules_conversion_rate := (NEW.analysis->'rulesResults'->>'conversionRate')::DECIMAL;
    NEW.winner := NEW.analysis->>'winner';
    NEW.confidence := (NEW.analysis->>'confidence')::DECIMAL;
    NEW.duration_days := (NEW.analysis->>'duration')::DECIMAL;
    NEW.ml_count := (NEW.analysis->'mlResults'->>'count')::INTEGER;
    NEW.rules_count := (NEW.analysis->'rulesResults'->>'count')::INTEGER;
    NEW.ml_conversions := (NEW.analysis->'mlResults'->>'conversions')::INTEGER;
    NEW.rules_conversions := (NEW.analysis->'rulesResults'->>'conversions')::INTEGER;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to ab_test_results
DROP TRIGGER IF EXISTS extract_ab_test_metrics_trigger ON ab_test_results;
CREATE TRIGGER extract_ab_test_metrics_trigger
    BEFORE INSERT OR UPDATE ON ab_test_results
    FOR EACH ROW
    EXECUTE FUNCTION extract_ab_test_metrics();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE ml_model_weights IS 'Stores trained ML model weights for personalized lead scoring per user';
COMMENT ON TABLE ab_test_results IS 'Stores A/B test results comparing ML vs rule-based lead scoring';
COMMENT ON TABLE lead_scores IS 'Stores individual lead scores for historical analysis and tracking';
COMMENT ON TABLE ml_training_examples IS 'Stores labeled examples for ML model training';

COMMENT ON COLUMN ml_model_weights.weights IS 'JSONB containing model weights, bias, and metadata';
COMMENT ON COLUMN ab_test_results.analysis IS 'Full A/B test analysis including variant-specific metrics';
COMMENT ON COLUMN lead_scores.feature_importance IS 'Top contributing features to the lead score';
