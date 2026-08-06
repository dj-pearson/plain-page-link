-- Add missing columns to article_webhooks table
ALTER TABLE public.article_webhooks
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Default Webhook';

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_article_webhooks_user_id ON public.article_webhooks(user_id);

-- Enable RLS
ALTER TABLE public.article_webhooks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own webhooks" ON public.article_webhooks;

-- Create comprehensive policy
CREATE POLICY "Users can manage their own webhooks"
ON public.article_webhooks
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_article_webhooks_updated_at ON public.article_webhooks;
CREATE TRIGGER update_article_webhooks_updated_at
BEFORE UPDATE ON public.article_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();