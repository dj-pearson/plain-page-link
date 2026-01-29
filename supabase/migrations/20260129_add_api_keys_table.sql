-- Create API Keys table for webhook authentication
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, -- Friendly name like "Make.com Webhook"
  key_hash text NOT NULL UNIQUE, -- Store the actual key (or hash in production)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  expires_at timestamptz,
  
  -- Metadata
  description text,
  scopes text[], -- Future: limit API key to specific functions
  
  CONSTRAINT api_keys_name_not_empty CHECK (char_length(name) > 0),
  CONSTRAINT api_keys_key_hash_not_empty CHECK (char_length(key_hash) > 0)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE is_active = true;

-- Add comments
COMMENT ON TABLE public.api_keys IS 'API keys for webhook and external service authentication';
COMMENT ON COLUMN public.api_keys.key_hash IS 'The API key value (should be hashed with bcrypt in production)';
COMMENT ON COLUMN public.api_keys.scopes IS 'Optional: limit API key to specific edge functions';

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own API keys
CREATE POLICY "Users can view own api_keys"
  ON public.api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own API keys
CREATE POLICY "Users can create own api_keys"
  ON public.api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own api_keys"
  ON public.api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete own api_keys"
  ON public.api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.api_keys TO authenticated;
GRANT SELECT ON public.api_keys TO service_role;
