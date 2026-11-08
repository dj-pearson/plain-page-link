-- US-629 (US-620 slice 1): find the client a lead already is.
--
-- "Add to clients" on a lead looked for an existing contact by contacts.lead_id
-- only. A past client who sends a new enquiry, or somebody the agent typed in
-- by hand, became a second contact. Contact email and phone are ciphertext
-- with a random IV (US-086), so a duplicate could not be found by query.
--
-- contacts gains the same keyed lookup fingerprints leads carry (US-220,
-- US-522), under the same key labels so a contact's hash equals the hash of a
-- lead with the same address:
--
--   email_hash        HMAC-SHA256 of lower(trim(email))
--   phone_hash        HMAC-SHA256 of the number's E.164 digits
--   lookup_hashed_at  when pii-crypto last computed them; NULL = not yet
--
-- The key is not in the database, so there is no SQL backfill. pii-crypto's
-- match_contacts_for_lead op hashes the caller's contacts that have no
-- lookup_hashed_at yet (a bounded batch per call) before it matches, so every
-- contact is hashed the first time its owner converts a lead.
--
-- Written only by the service role. A trigger keeps the browser's hands off
-- the three columns (an insert's values are dropped, an update's are
-- restored), and clears them whenever the ciphertext they were computed from
-- changes, so a stale hash never matches a number the contact no longer has.
--
-- Not readable by the browser. contacts held Supabase's table-wide SELECT;
-- it is replaced by a column grant naming every other column, as on leads
-- (20261101000016). A readable email_hash would let an agent compare a contact
-- with something keyed the same way; nothing in the browser needs it. anon
-- gets no SELECT at all: no contacts policy is satisfiable without auth.uid().
-- INSERT/UPDATE stay table-wide; a write that asks for its row back names
-- columns (useContacts already does).

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS email_hash text,
  ADD COLUMN IF NOT EXISTS phone_hash text,
  ADD COLUMN IF NOT EXISTS lookup_hashed_at timestamptz;

CREATE INDEX IF NOT EXISTS contacts_user_email_hash_idx
  ON public.contacts (user_id, email_hash) WHERE email_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_user_phone_hash_idx
  ON public.contacts (user_id, phone_hash) WHERE phone_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS contacts_user_unhashed_idx
  ON public.contacts (user_id) WHERE lookup_hashed_at IS NULL;

-- ---------------------------------------------------------------------------
-- The browser cannot write the fingerprints, and a changed detail clears them
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.contacts_guard_lookup_hashes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.email_hash := NULL;
      NEW.phone_hash := NULL;
      NEW.lookup_hashed_at := NULL;
    ELSE
      NEW.email_hash := OLD.email_hash;
      NEW.phone_hash := OLD.phone_hash;
      NEW.lookup_hashed_at := OLD.lookup_hashed_at;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE'
     AND (NEW.encrypted_email IS DISTINCT FROM OLD.encrypted_email
          OR NEW.encrypted_phone IS DISTINCT FROM OLD.encrypted_phone)
     AND NEW.lookup_hashed_at IS NOT DISTINCT FROM OLD.lookup_hashed_at THEN
    NEW.email_hash := NULL;
    NEW.phone_hash := NULL;
    NEW.lookup_hashed_at := NULL;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_contacts_guard_lookup_hashes ON public.contacts;
CREATE TRIGGER trg_contacts_guard_lookup_hashes
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.contacts_guard_lookup_hashes();

-- ---------------------------------------------------------------------------
-- Column-level SELECT on contacts
-- ---------------------------------------------------------------------------

REVOKE SELECT ON public.contacts FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, user_id, lead_id, first_name, last_name, encrypted_email, encrypted_phone,
  relationship, preferred_contact, address, city, state, zip_code, occupation,
  employer, referred_by, source, household, interests, tags, notes,
  touch_frequency_days, last_contacted_at, next_touch_at, created_at, updated_at
) ON public.contacts TO authenticated;

REVOKE SELECT (email_hash, phone_hash, lookup_hashed_at)
  ON public.contacts FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN public.contacts.email_hash IS
  'HMAC-SHA256 of lower(trim(email)), keyed from PII_ENCRYPTION_KEY with the lead label, so it equals leads.email_hash for the same address. Written by pii-crypto (match_contacts_for_lead); service role only (US-629).';
COMMENT ON COLUMN public.contacts.phone_hash IS
  'HMAC-SHA256 of the phone number''s E.164 digits, keyed like leads.phone_hash. Written by pii-crypto; service role only (US-629).';
COMMENT ON COLUMN public.contacts.lookup_hashed_at IS
  'When pii-crypto computed email_hash/phone_hash; NULL until it has, and reset when the ciphertext changes (US-629).';
