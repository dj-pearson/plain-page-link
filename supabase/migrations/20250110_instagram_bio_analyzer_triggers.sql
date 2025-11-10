-- Triggers and functions for Instagram Bio Analyzer email automation

-- Function to initialize email sequence on capture
CREATE OR REPLACE FUNCTION initialize_bio_email_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Create placeholder entries for all 7 emails in the sequence
  INSERT INTO instagram_bio_email_sequences (email_capture_id, sequence_number, email_subject, sent_at)
  VALUES
    (NEW.id, 1, 'Your 3 Optimized Instagram Bios + Action Plan Inside', NULL),
    (NEW.id, 2, 'The Instagram bio mistake 73% of agents make', NULL),
    (NEW.id, 3, 'Your Instagram profile as a 24/7 showing scheduler', NULL),
    (NEW.id, 4, NEW.first_name || ', here''s your 30-day Instagram content calendar', NULL),
    (NEW.id, 5, 'Real data: What converts Instagram followers to clients', NULL),
    (NEW.id, 6, 'Linktree vs AgentBio for real estate (honest comparison)', NULL),
    (NEW.id, 7, NEW.first_name || ', final call: 20% off + free setup (expires tonight)', NULL);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize sequence on email capture
DROP TRIGGER IF EXISTS init_bio_email_sequence ON instagram_bio_email_captures;
CREATE TRIGGER init_bio_email_sequence
  AFTER INSERT ON instagram_bio_email_captures
  FOR EACH ROW
  WHEN (NEW.email_sequence_started = true)
  EXECUTE FUNCTION initialize_bio_email_sequence();

-- Function to mark sequence complete when all emails sent
CREATE OR REPLACE FUNCTION check_bio_email_sequence_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM instagram_bio_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence as complete
  IF sent_emails >= total_emails THEN
    UPDATE instagram_bio_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check sequence completion on email sent
DROP TRIGGER IF EXISTS check_bio_sequence_complete ON instagram_bio_email_sequences;
CREATE TRIGGER check_bio_sequence_complete
  AFTER UPDATE OF sent_at ON instagram_bio_email_sequences
  FOR EACH ROW
  WHEN (NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL)
  EXECUTE FUNCTION check_bio_email_sequence_complete();

-- View for email performance dashboard
CREATE OR REPLACE VIEW bio_email_performance AS
SELECT
  es.sequence_number,
  es.email_subject,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE es.opened = true) as total_opened,
  COUNT(*) FILTER (WHERE es.clicked = true) as total_clicked,
  ROUND(AVG(CASE WHEN es.opened = true THEN 1 ELSE 0 END) * 100, 2) as open_rate,
  ROUND(AVG(CASE WHEN es.clicked = true THEN 1 ELSE 0 END) * 100, 2) as click_rate,
  COUNT(DISTINCT ec.id) FILTER (WHERE ec.converted_to_trial = true) as conversions_to_trial,
  COUNT(DISTINCT ec.id) FILTER (WHERE ec.converted_to_paid = true) as conversions_to_paid
FROM instagram_bio_email_sequences es
JOIN instagram_bio_email_captures ec ON ec.id = es.email_capture_id
WHERE es.sent_at IS NOT NULL
GROUP BY es.sequence_number, es.email_subject
ORDER BY es.sequence_number;

COMMENT ON VIEW bio_email_performance IS 'Performance metrics for bio analyzer email sequence';

-- View for conversion funnel analysis
CREATE OR REPLACE VIEW bio_analyzer_funnel AS
SELECT
  COUNT(DISTINCT ia.id) as total_analyses,
  COUNT(DISTINCT iec.id) as email_captures,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT iec.id)::numeric / NULLIF(COUNT(DISTINCT ia.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT iec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT iec.id) FILTER (WHERE iec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT iec.id), 0) * 100, 2) as paid_conversion_rate
FROM instagram_bio_analyses ia
LEFT JOIN instagram_bio_email_captures iec ON ia.id = iec.analysis_id
WHERE ia.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON VIEW bio_analyzer_funnel IS 'Conversion funnel metrics for the last 30 days';

-- Indexes for email delivery queries
CREATE INDEX IF NOT EXISTS idx_email_sequences_pending
  ON instagram_bio_email_sequences(email_capture_id, sequence_number)
  WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_captures_active_sequences
  ON instagram_bio_email_captures(created_at)
  WHERE email_sequence_started = true AND email_sequence_completed = false;

-- Grant permissions to service role
GRANT SELECT ON bio_email_performance TO service_role;
GRANT SELECT ON bio_analyzer_funnel TO service_role;

-- Function to get next emails to send (used by cron job)
CREATE OR REPLACE FUNCTION get_pending_bio_emails()
RETURNS TABLE (
  capture_id UUID,
  email TEXT,
  first_name TEXT,
  market TEXT,
  sequence_number INTEGER,
  days_since_capture INTEGER,
  overall_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ec.id as capture_id,
    ec.email,
    ec.first_name,
    ec.market,
    es.sequence_number,
    EXTRACT(DAY FROM NOW() - ec.created_at)::INTEGER as days_since_capture,
    ia.overall_score
  FROM instagram_bio_email_captures ec
  JOIN instagram_bio_email_sequences es ON es.email_capture_id = ec.id
  LEFT JOIN instagram_bio_analyses ia ON ia.id = ec.analysis_id
  WHERE
    ec.email_sequence_started = true
    AND ec.email_sequence_completed = false
    AND es.sent_at IS NULL
    AND ec.created_at >= CURRENT_DATE - INTERVAL '14 days'
  ORDER BY ec.created_at ASC, es.sequence_number ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_bio_emails IS 'Returns emails that need to be sent based on schedule';
