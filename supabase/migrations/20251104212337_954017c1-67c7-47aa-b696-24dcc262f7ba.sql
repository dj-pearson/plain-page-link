-- Fix check_username_available function to be STABLE for index compatibility
CREATE OR REPLACE FUNCTION check_username_available(
  _username TEXT,
  _current_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if username exists for a different user
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(username) = LOWER(_username)
    AND id != _current_user_id
  );
END;
$$;