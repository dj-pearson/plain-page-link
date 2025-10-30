-- Fix the function to set search_path for security
DROP FUNCTION IF EXISTS increment_link_clicks(uuid);

CREATE OR REPLACE FUNCTION increment_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$$;