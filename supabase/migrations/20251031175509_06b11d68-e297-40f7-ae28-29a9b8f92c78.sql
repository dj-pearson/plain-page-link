-- Add authentication configuration fields to ai_models table
ALTER TABLE public.ai_models
ADD COLUMN auth_type text DEFAULT 'bearer' CHECK (auth_type IN ('bearer', 'x-api-key')),
ADD COLUMN secret_name text,
ADD COLUMN api_endpoint text;

COMMENT ON COLUMN public.ai_models.auth_type IS 'Authentication method: bearer or x-api-key';
COMMENT ON COLUMN public.ai_models.secret_name IS 'Name of the secret in Supabase (e.g., CLAUDE_API_KEY)';
COMMENT ON COLUMN public.ai_models.api_endpoint IS 'API endpoint URL for this model';

-- Update existing models with default values
UPDATE public.ai_models
SET auth_type = 'bearer',
    secret_name = 'LOVABLE_API_KEY',
    api_endpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions'
WHERE provider IN ('google', 'openai');