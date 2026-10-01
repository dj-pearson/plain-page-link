-- US-228: a lead exists after step one of a form, and step two adds to it.
--
-- The capture forms asked for eight or nine required fields — bedrooms,
-- square footage, condition, a reason for selling — before any lead existed,
-- and required a phone and an email everywhere. Every extra required field
-- costs completions, most of all on the phones link-in-bio traffic arrives on.
--
-- Step one (name + email or phone) now creates the lead. submit-lead returns a
-- short-lived, single-use token with it; step two presents that token to add
-- the optional qualifiers to the same row. Only the token's hash is stored.

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS update_token_hash text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS update_token_expires_at timestamptz;

COMMENT ON COLUMN public.leads.update_token_hash IS
  'SHA-256 of the single-use token submit-lead returns so the visitor can add form step two (US-228).';
