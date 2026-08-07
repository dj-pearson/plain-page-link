-- Add 'purchase' and 'sale' to testimonials transaction_type allowed values
ALTER TABLE public.testimonials DROP CONSTRAINT IF EXISTS testimonials_transaction_type_check;
ALTER TABLE public.testimonials ADD CONSTRAINT testimonials_transaction_type_check 
  CHECK (transaction_type IS NULL OR transaction_type = ANY (ARRAY['purchase'::text, 'sale'::text, 'buyer'::text, 'seller'::text]));