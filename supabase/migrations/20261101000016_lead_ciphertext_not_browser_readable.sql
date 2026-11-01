-- US-254: an agent over the lead allowance could unlock a locked lead by
-- copying its ciphertext into a contact.
--
-- Leads past the plan's monthly allowance are stored but locked
-- (20260923000003): pii-crypto's decrypt_leads returns no email or phone for
-- them. But anon and authenticated held table-wide SELECT on leads, so the
-- owner could read the locked row's encrypted_email / encrypted_phone directly,
-- write those values into a contact they own (contacts "FOR ALL" owner policy,
-- 20260923000001), and have decrypt_contacts — which never consulted the
-- allowance — open them. The lock was only as strong as the browser's
-- willingness not to look.
--
-- 1. The browser can no longer read the ciphertext at all. Same pattern as
--    US-073/US-235 on profiles: revoke table-wide SELECT, re-grant every column
--    except the two encrypted ones. No browser path needs them: every reader
--    decrypts through pii-crypto by lead id, which reads the row with the
--    service role. Writes are unaffected (INSERT/UPDATE stay granted
--    table-wide); a write that asks for its row back must name columns rather
--    than `*` (src/lib/leadColumns.ts).
--
--    anon gets nothing back. No policy on leads can be satisfied without
--    auth.uid(), so anon never saw a row; the grant was Supabase's default.
--
-- 2. locked_lead_ciphertexts(): pii-crypto refuses a contact whose ciphertext
--    equals one of the owner's locked leads' (defence in depth, for anything
--    copied before this migration or by a path that still holds the value).
--    Every encryption draws a fresh salt and IV, so equal ciphertext is a copy.

-- ---------------------------------------------------------------------------
-- 1. Column-level SELECT on leads
-- ---------------------------------------------------------------------------

REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (
  id, user_id, lead_type, name, message, status, source, form_data,
  created_at, updated_at, first_responded_at, assigned_to, contacted_at,
  closed_at, listing_id, price_range, timeline, property_address, preapproved,
  notes, referrer_url, utm_source, utm_medium, utm_campaign, device, is_sample,
  open_house_id, email_hash, update_token_hash, update_token_expires_at
) ON public.leads TO authenticated;

COMMENT ON COLUMN public.leads.encrypted_email IS
  'AES-256-GCM ciphertext (enc:v1:) of the lead''s email; the only copy since US-086. Not selectable by anon/authenticated (US-254): decrypt through pii-crypto by lead id, which applies the plan''s lead allowance.';
COMMENT ON COLUMN public.leads.encrypted_phone IS
  'AES-256-GCM ciphertext (enc:v1:) of the lead''s phone; the only copy since US-086. Not selectable by anon/authenticated (US-254): decrypt through pii-crypto by lead id, which applies the plan''s lead allowance.';

-- ---------------------------------------------------------------------------
-- 2. Which of these ciphertexts belong to one of the owner's locked leads
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.locked_lead_ciphertexts(_user_id uuid, _values text[])
RETURNS SETOF text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_matches uuid[];
BEGIN
  IF _user_id IS NULL OR _values IS NULL OR cardinality(_values) = 0 THEN
    RETURN;
  END IF;

  SELECT array_agg(id) INTO v_matches
    FROM public.leads
   WHERE user_id = _user_id
     AND (encrypted_email = ANY(_values) OR encrypted_phone = ANY(_values));

  IF v_matches IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT v.value
    FROM public.leads l
   CROSS JOIN LATERAL unnest(ARRAY[l.encrypted_email, l.encrypted_phone]) AS v(value)
   WHERE l.id IN (SELECT public.locked_lead_ids(_user_id, v_matches))
     AND v.value = ANY(_values);
END;
$function$;

COMMENT ON FUNCTION public.locked_lead_ciphertexts(uuid, text[]) IS
  'US-254: the given ciphertexts that belong to one of the owner''s locked leads. pii-crypto refuses a contact holding one. Service role only.';

REVOKE EXECUTE ON FUNCTION public.locked_lead_ciphertexts(uuid, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.locked_lead_ciphertexts(uuid, text[]) TO service_role;
