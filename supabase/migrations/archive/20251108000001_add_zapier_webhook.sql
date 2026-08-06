-- Add Zapier webhook integration to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS zapier_webhook_url TEXT;

-- Add index for profiles with webhook configured
CREATE INDEX IF NOT EXISTS idx_profiles_zapier_webhook
  ON public.profiles(id)
  WHERE zapier_webhook_url IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.zapier_webhook_url IS 'Zapier webhook URL for automatic lead forwarding to CRM systems';
