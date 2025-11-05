-- Enable RLS on content_suggestions table
ALTER TABLE public.content_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage all suggestions
CREATE POLICY "Admins can manage all suggestions"
ON public.content_suggestions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow viewing of suggestions
CREATE POLICY "Authenticated users can view suggestions"
ON public.content_suggestions
FOR SELECT
TO authenticated
USING (true);