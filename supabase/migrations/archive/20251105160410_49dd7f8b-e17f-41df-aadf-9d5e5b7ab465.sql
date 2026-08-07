-- Drop the old check constraint
ALTER TABLE public.content_suggestions 
  DROP CONSTRAINT IF EXISTS content_suggestions_status_check;

-- Add new check constraint with all required statuses
ALTER TABLE public.content_suggestions
  ADD CONSTRAINT content_suggestions_status_check 
  CHECK (status IN ('pending', 'queued', 'in_progress', 'completed', 'rejected'));