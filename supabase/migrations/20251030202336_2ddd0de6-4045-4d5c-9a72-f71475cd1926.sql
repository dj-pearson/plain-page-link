-- Create a function to safely increment link click counts
CREATE OR REPLACE FUNCTION increment_link_clicks(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE links
  SET click_count = COALESCE(click_count, 0) + 1
  WHERE id = link_id;
END;
$$;