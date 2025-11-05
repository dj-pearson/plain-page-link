-- Update content_suggestions table to support queue workflow
ALTER TABLE public.content_suggestions 
  ADD COLUMN IF NOT EXISTS keywords text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS generated_article_id uuid REFERENCES public.articles(id) ON DELETE SET NULL;

-- Update status check to include new workflow statuses
COMMENT ON COLUMN public.content_suggestions.status IS 'Status: pending, queued, in_progress, completed, rejected';

-- Create index for faster querying
CREATE INDEX IF NOT EXISTS idx_content_suggestions_status ON public.content_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_content_suggestions_priority ON public.content_suggestions(priority DESC);