-- Listing Description Generator Email Automation Triggers
-- Auto-creates email sequence entries and manages completion status

-- Function to initialize email sequence when email is captured
CREATE OR REPLACE FUNCTION init_listing_email_sequence()
RETURNS TRIGGER AS $$
BEGIN
  -- Create 7 email sequence entries
  INSERT INTO listing_email_sequences (email_capture_id, sequence_number, email_subject)
  VALUES
    (NEW.id, 1, 'The listing description mistake that costs agents thousands'),
    (NEW.id, 2, 'Power words that make buyers take action'),
    (NEW.id, 3, 'How to choose the right description style for your listing'),
    (NEW.id, 5, 'Real data: What sells homes faster in 2025'),
    (NEW.id, 6, 'Your listing checklist: Beyond the description'),
    (NEW.id, 7, '20% off AgentBio (expires tonight) + Free listing templates');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create sequence on email capture
DROP TRIGGER IF EXISTS trigger_init_listing_email_sequence ON listing_email_captures;
CREATE TRIGGER trigger_init_listing_email_sequence
  AFTER INSERT ON listing_email_captures
  FOR EACH ROW
  EXECUTE FUNCTION init_listing_email_sequence();

-- Function to check if email sequence is complete
CREATE OR REPLACE FUNCTION check_listing_sequence_complete()
RETURNS TRIGGER AS $$
DECLARE
  total_emails INTEGER;
  sent_emails INTEGER;
BEGIN
  -- Count total and sent emails for this capture
  SELECT COUNT(*), COUNT(*) FILTER (WHERE sent_at IS NOT NULL)
  INTO total_emails, sent_emails
  FROM listing_email_sequences
  WHERE email_capture_id = NEW.email_capture_id;

  -- If all emails sent, mark sequence complete
  IF total_emails = sent_emails THEN
    UPDATE listing_email_captures
    SET email_sequence_completed = true
    WHERE id = NEW.email_capture_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check completion after each email sent
DROP TRIGGER IF EXISTS trigger_check_listing_sequence_complete ON listing_email_sequences;
CREATE TRIGGER trigger_check_listing_sequence_complete
  AFTER UPDATE OF sent_at ON listing_email_sequences
  FOR EACH ROW
  WHEN (NEW.sent_at IS NOT NULL AND OLD.sent_at IS NULL)
  EXECUTE FUNCTION check_listing_sequence_complete();

-- Function to get pending emails (for cron job)
CREATE OR REPLACE FUNCTION get_pending_listing_emails()
RETURNS TABLE (
  id UUID,
  email TEXT,
  first_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  days_since_capture INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    lec.id,
    lec.email,
    lec.first_name,
    lec.created_at,
    EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER as days_since_capture
  FROM listing_email_captures lec
  WHERE
    -- Sequence started but not completed
    lec.email_sequence_started = true
    AND lec.email_sequence_completed = false
    -- At least 1 day since capture
    AND lec.created_at < NOW() - INTERVAL '1 day'
    -- Check if there's a pending email for today
    AND EXISTS (
      SELECT 1
      FROM listing_email_sequences les
      WHERE les.email_capture_id = lec.id
      AND les.sent_at IS NULL
      -- Check schedule: email 1 = day 2, email 2 = day 3, etc.
      AND (
        (les.sequence_number = 1 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 1) OR
        (les.sequence_number = 2 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 2) OR
        (les.sequence_number = 3 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 3) OR
        (les.sequence_number = 5 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 5) OR
        (les.sequence_number = 6 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 6) OR
        (les.sequence_number = 7 AND EXTRACT(DAY FROM (NOW() - lec.created_at))::INTEGER >= 7)
      )
    )
  ORDER BY lec.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- View for email performance metrics
CREATE OR REPLACE VIEW listing_email_performance AS
SELECT
  les.sequence_number,
  les.email_subject,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE les.opened = true) as opens,
  COUNT(*) FILTER (WHERE les.clicked = true) as clicks,
  COUNT(*) FILTER (WHERE les.converted = true) as conversions,
  ROUND(COUNT(*) FILTER (WHERE les.opened = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as open_rate,
  ROUND(COUNT(*) FILTER (WHERE les.clicked = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as click_rate,
  ROUND(COUNT(*) FILTER (WHERE les.converted = true)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as conversion_rate
FROM listing_email_sequences les
WHERE les.sent_at IS NOT NULL
GROUP BY les.sequence_number, les.email_subject
ORDER BY les.sequence_number;

-- View for listing generator funnel (already in main migration, but adding here for completeness)
CREATE OR REPLACE VIEW listing_generator_funnel AS
SELECT
  COUNT(DISTINCT ld.id) as total_generations,
  COUNT(DISTINCT lec.id) as email_captures,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_started = true) as sequences_started,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.email_sequence_completed = true) as sequences_completed,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true) as trial_signups,
  COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true) as paid_conversions,
  ROUND(COUNT(DISTINCT lec.id)::numeric / NULLIF(COUNT(DISTINCT ld.id), 0) * 100, 2) as capture_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_trial = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as trial_conversion_rate,
  ROUND(COUNT(DISTINCT lec.id) FILTER (WHERE lec.converted_to_paid = true)::numeric / NULLIF(COUNT(DISTINCT lec.id), 0) * 100, 2) as paid_conversion_rate
FROM listing_descriptions ld
LEFT JOIN listing_email_captures lec ON ld.id = lec.listing_id
WHERE ld.created_at >= CURRENT_DATE - INTERVAL '30 days';

COMMENT ON FUNCTION init_listing_email_sequence() IS 'Auto-creates 7 email sequence entries when email is captured';
COMMENT ON FUNCTION check_listing_sequence_complete() IS 'Marks sequence complete when all emails are sent';
COMMENT ON FUNCTION get_pending_listing_emails() IS 'Returns emails that need to be sent today (used by cron job)';
COMMENT ON VIEW listing_email_performance IS 'Email engagement metrics by sequence number';
