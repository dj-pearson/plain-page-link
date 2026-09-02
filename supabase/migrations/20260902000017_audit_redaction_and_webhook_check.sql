-- US-119: two stores of other people's secrets, and one column with no bounds.
--
-- (1) audit_table_change writes to_jsonb(NEW) — the WHOLE row — into
--     audit_logs.details, and it is attached to `leads` and `profiles`. So
--     audit_logs holds a copy of every encrypted_email and encrypted_phone ever
--     written, and every agent's zapier_webhook_url. That turned any read of an
--     audit row into a read of PII ciphertext, which pii-crypto would then open
--     for anyone with a JWT (fixed separately, in the same story). An audit log
--     needs to record THAT a row changed and by whom; it does not need to hold
--     a second copy of the secrets.
--
-- (2) zapier_webhook_url had no constraint at all. The settings modal wrote it
--     unvalidated and submit-lead fetched it with the service role, from an
--     edge runtime that shares a Docker network with postgres-meta, Kong and
--     GoTrue — so an agent could point it at http://postgres-meta:8080 and have
--     the platform fetch an internal service on every lead they received.

-- ---------------------------------------------------------------------------
-- 1. Redact before serialising
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
    v_user_id UUID;
    v_resource_id TEXT;
    v_details JSONB;
    v_row JSONB;
    v_old JSONB;
BEGIN
    v_user_id := auth.uid();

    IF (TG_OP = 'DELETE') THEN
        v_row := public.redact_audit_row(to_jsonb(OLD));
        v_resource_id := OLD.id::text;
        v_details := jsonb_build_object('old', v_row);
    ELSIF (TG_OP = 'UPDATE') THEN
        v_row := public.redact_audit_row(to_jsonb(NEW));
        v_old := public.redact_audit_row(to_jsonb(OLD));
        v_resource_id := NEW.id::text;
        v_details := jsonb_build_object('old', v_old, 'new', v_row);
    ELSE -- INSERT
        v_row := public.redact_audit_row(to_jsonb(NEW));
        v_resource_id := NEW.id::text;
        v_details := jsonb_build_object('new', v_row);
    END IF;

    -- Best-effort subject: authenticated user, else the row's owner. Both keys
    -- survive redaction, which is why this still works.
    IF v_user_id IS NULL THEN
        v_user_id := COALESCE(
            (v_row->>'user_id')::uuid,
            (v_row->>'id')::uuid
        );
    END IF;

    PERFORM log_audit_event(
        p_user_id        => v_user_id,
        p_action         => lower(TG_OP) || '_' || TG_TABLE_NAME,
        p_status         => 'success',
        p_resource_type  => TG_TABLE_NAME,
        p_resource_id    => v_resource_id,
        p_ip_address     => NULL,
        p_user_agent     => NULL,
        p_details        => v_details,
        p_risk_level     => 'low',
        p_actor_id       => auth.uid()
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$;

/**
 * Strip the fields an audit entry must not hold a second copy of.
 *
 * Keys are replaced with a marker rather than removed, so a reader can still
 * see that the field changed — which is the question an audit log answers —
 * without the value.
 */
CREATE OR REPLACE FUNCTION public.redact_audit_row(p_row jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $function$
DECLARE
  v_out jsonb := p_row;
  v_key text;
BEGIN
  IF p_row IS NULL THEN
    RETURN NULL;
  END IF;

  FOR v_key IN SELECT jsonb_object_keys(p_row) LOOP
    IF v_key LIKE 'encrypted\_%'
       OR v_key = 'zapier_webhook_url'
       OR v_key = 'webhook_url'
       OR v_key = 'session_token_hash'
       OR v_key LIKE '%_secret'
       OR v_key LIKE '%api_key%'
    THEN
      -- Only mark keys that actually held something, so "was null, still null"
      -- does not read as a redacted change.
      IF p_row->v_key <> 'null'::jsonb THEN
        v_out := jsonb_set(v_out, ARRAY[v_key], '"[redacted]"'::jsonb);
      END IF;
    END IF;
  END LOOP;

  RETURN v_out;
END;
$function$;

COMMENT ON FUNCTION public.redact_audit_row(jsonb) IS
  'US-119: audit_logs held a copy of every leads ciphertext and every zapier_webhook_url, because audit_table_change serialised the whole row.';

-- ---------------------------------------------------------------------------
-- 2. Bound the webhook column
-- ---------------------------------------------------------------------------
-- Existing rows outside the allow-list are cleared rather than blocking the
-- migration. A webhook that is not one of the two supported destinations was
-- never going to be delivered to after this story anyway, and leaving it in
-- place would leave a stored internal URL behind.
UPDATE public.profiles
SET zapier_webhook_url = NULL
WHERE zapier_webhook_url IS NOT NULL
  AND zapier_webhook_url !~ '^https://(hooks\.zapier\.com|hook\.[a-z0-9-]+\.make\.com)/';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_zapier_webhook_url_check
  CHECK (
    zapier_webhook_url IS NULL
    OR zapier_webhook_url ~ '^https://(hooks\.zapier\.com|hook\.[a-z0-9-]+\.make\.com)/'
  );

COMMENT ON CONSTRAINT profiles_zapier_webhook_url_check ON public.profiles IS
  'US-119: submit-lead fetches this with the service role from a network that reaches postgres-meta, Kong and GoTrue. https, and only the two supported destinations.';
