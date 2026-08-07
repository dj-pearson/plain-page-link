-- Update handle_new_user to create numeric username by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  numeric_username TEXT;
BEGIN
  -- Generate numeric username from user ID (remove hyphens and take first 9 digits)
  numeric_username := REPLACE(new.id::TEXT, '-', '');
  numeric_username := SUBSTRING(numeric_username, 1, 9);
  
  INSERT INTO public.profiles (id, username, full_name)
  VALUES (
    new.id,
    numeric_username,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$function$;

-- Function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(
  _username TEXT,
  _current_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
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

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (LOWER(username));