-- US-067: Close the free-tool table exposures, and unbreak anonymous capture.
--
-- The /tools/* lead-gen tables are platform-owned marketing funnels: they have
-- no user_id, because the prospects they capture belong to AgentBio rather than
-- to any one agent. Their policies did not reflect that.
--
-- Three defects, all found by the check added in US-065:
--
-- 1. `ALL TO authenticated USING (true) WITH CHECK (true)` on eight tables meant
--    any registered user -- anyone who signed up for a free account -- could
--    read and delete every prospect email, first name, phone number, brokerage
--    and conversion flag the free tools had ever captured. Reproduced as a
--    freshly registered user: SELECT returned 'prospect@bigbroker.com / Dana /
--    Big Broker' and DELETE removed the row. This is PII under GDPR, so it is
--    also in scope for US-019/US-020.
--
-- 2. `SELECT TO anon USING (true)` on instagram_bio_analyses and
--    listing_descriptions exposed rows carrying visitor ip_address and
--    user_agent to unauthenticated visitors. Reproduced: anon read
--    '203.0.113.42/32'.
--
-- 3. The tools' own anonymous email capture was broken. The client issued
--    .insert().select().single(), whose RETURNING needs SELECT, which anon did
--    not have on the *_email_captures tables -- so the insert was rejected with
--    'new row violates row-level security policy' and the caller rethrew.
--    Isolated by bisecting the statement: the same INSERT without RETURNING
--    succeeded. Fixed on the client side by generating the row id in the browser
--    and dropping .select(), so no read-back policy is needed at all. That is
--    why this migration grants anon INSERT and nothing more.
--
-- Target access model, applied uniformly below:
--   anon           INSERT only  (the tools are used by visitors with no account)
--   authenticated  nothing      (these are not per-agent data)
--   admin          SELECT       (via has_role, for whoever works the funnel)
--   service_role   ALL          (the email-sequence edge functions)

-- ---------------------------------------------------------------------------
-- 1. The eight lead-gen tables.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Allow authenticated users full access to analyses" ON public.instagram_bio_analyses;
DROP POLICY IF EXISTS "Allow authenticated users full access to analytics" ON public.instagram_bio_analytics;
DROP POLICY IF EXISTS "Allow authenticated users full access to email captures" ON public.instagram_bio_email_captures;
DROP POLICY IF EXISTS "Allow authenticated users full access to email sequences" ON public.instagram_bio_email_sequences;
DROP POLICY IF EXISTS "Allow authenticated users full access to listing descriptions" ON public.listing_descriptions;
DROP POLICY IF EXISTS "Allow authenticated users full access to listing email captures" ON public.listing_email_captures;
DROP POLICY IF EXISTS "Allow authenticated users full access to listing email sequences" ON public.listing_email_sequences;
DROP POLICY IF EXISTS "Allow authenticated users full access to listing analytics" ON public.listing_generator_analytics;

-- 2. The two anon read policies over rows holding ip_address / user_agent.
DROP POLICY IF EXISTS "Allow public select on analyses" ON public.instagram_bio_analyses;
DROP POLICY IF EXISTS "Allow public select on listing descriptions" ON public.listing_descriptions;

-- 3. Admin read + service_role management, table by table.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'instagram_bio_analyses',
    'instagram_bio_analytics',
    'instagram_bio_email_captures',
    'instagram_bio_email_sequences',
    'listing_descriptions',
    'listing_email_captures',
    'listing_email_sequences',
    'listing_generator_analytics'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admins can read ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::public.app_role))',
      'Admins can read ' || t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Service role manages ' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      'Service role manages ' || t, t);
  END LOOP;
END $$;

-- The other six tables keep the "Allow public insert on ..." policies the tools
-- depend on, untouched.
--
-- The two *_email_sequences tables deliberately get no anon INSERT policy: the
-- only writer is bookkeeping, not a visitor. But that bookkeeping runs from a
-- trigger on the capture tables --
--   init_bio_email_sequence      AFTER INSERT ON instagram_bio_email_captures
--                                WHEN (new.email_sequence_started = true)
--   trigger_init_listing_email_sequence
--                                AFTER INSERT ON listing_email_captures
-- -- and both trigger functions were SECURITY INVOKER, so they ran as `anon`
-- and their INSERT of the seven placeholder rows was refused by RLS, aborting
-- the visitor's email capture. (Caught by exercising the capture as anon after
-- the policy change above, not by reading it: the bio trigger has a WHEN clause
-- that only the real client path satisfies.)
--
-- Making them SECURITY DEFINER is the correct fix rather than granting anon
-- INSERT on the sequence tables: the rows are system-generated, so they should
-- be written with the owner's privileges and not be forgeable by a visitor.
-- search_path is pinned for the reason given in 20260806000003.
ALTER FUNCTION public.initialize_bio_email_sequence() SECURITY DEFINER;
ALTER FUNCTION public.initialize_bio_email_sequence()
  SET search_path = public, extensions, pg_temp;
ALTER FUNCTION public.init_listing_email_sequence() SECURITY DEFINER;
ALTER FUNCTION public.init_listing_email_sequence()
  SET search_path = public, extensions, pg_temp;

-- ---------------------------------------------------------------------------
-- 4. content_suggestions: was readable by every authenticated user.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can view suggestions" ON public.content_suggestions;
CREATE POLICY "Users read own suggestions, admins read all"
  ON public.content_suggestions FOR SELECT TO authenticated
  USING (suggested_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

-- ---------------------------------------------------------------------------
-- 5. seo_alert_rules: admin monitoring config, was readable by anon.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view alert rules" ON public.seo_alert_rules;
CREATE POLICY "Admins can view alert rules"
  ON public.seo_alert_rules FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
