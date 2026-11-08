-- US-448: hard bounces and spam complaints feed email_suppressions.
--
-- The resend-webhook edge function receives Resend's signed email.bounced and
-- email.complained events and records the recipient here, by the same keyed
-- hash as before, so the drip senders' isSuppressed() check stops them too.
--
-- source gains 'resend' (the address was suppressed by the mail provider's
-- feedback, not from either drip's list); method gains 'bounce' and
-- 'complaint'. Grants and the service-role-only policy are unchanged.

ALTER TABLE public.email_suppressions
  DROP CONSTRAINT IF EXISTS email_suppressions_source_check;
ALTER TABLE public.email_suppressions
  ADD CONSTRAINT email_suppressions_source_check
  CHECK (source IN ('listing', 'bio', 'resend'));

ALTER TABLE public.email_suppressions
  DROP CONSTRAINT IF EXISTS email_suppressions_method_check;
ALTER TABLE public.email_suppressions
  ADD CONSTRAINT email_suppressions_method_check
  CHECK (method IN ('link', 'one_click', 'bounce', 'complaint'));

COMMENT ON TABLE public.email_suppressions IS
  'Addresses that must not receive marketing email, by keyed hash (emailLookupHash): opted out (US-425) or hard-bounced / complained (US-448). Service role only.';
