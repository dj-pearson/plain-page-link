-- Update existing Google and OpenAI models with correct secret and endpoint
UPDATE public.ai_models
SET 
  secret_name = 'LOVABLE_API_KEY',
  api_endpoint = 'https://ai.gateway.lovable.dev/v1/chat/completions'
WHERE provider IN ('google', 'openai', 'Google', 'OpenAI')
  AND (secret_name IS NULL OR api_endpoint IS NULL);