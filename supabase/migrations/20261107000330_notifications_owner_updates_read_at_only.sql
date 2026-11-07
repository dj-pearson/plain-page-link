-- US-322: an agent can mark their own notifications read, and nothing else.
--
-- The baseline policy "Users update own notifications" was FOR UPDATE
-- USING (auth.uid() = user_id), with no TO clause and table-wide UPDATE left
-- granted to anon and authenticated (Supabase's default). Postgres checks a
-- row policy, not which columns an UPDATE touches, so the owner could rewrite
-- every column of a row the system wrote: type, title, message and data.
--
-- That is not just cosmetic. scheduled-maintenance records "this lead has been
-- chased" as a notifications row (type 'lead_overdue', data.lead_id), and
-- US-309 made that row the claim through a partial unique index on
-- (user_id, data->>'lead_id') WHERE type = 'lead_overdue'. An agent who edits
-- the row's type or data.lead_id releases the claim, so the chaser emails them
-- about that lead again on its next run; one who points data.lead_id at a
-- lead they have not been chased about yet suppresses that chase. data.lead_id
-- is also where the bell sends the agent when they tap the notification.
--
-- The only thing the dashboard writes is read_at (useNotifications:
-- markAsRead / markAllAsRead), so:
--
-- 1. Column-level UPDATE: revoke table-wide UPDATE from the browser roles and
--    grant authenticated UPDATE (read_at) only. Same pattern as the column
--    SELECT grants on profiles (US-073/US-235) and leads (US-254). anon gets
--    nothing; no notifications policy can be satisfied without auth.uid().
--    The service role keeps its full grant (scheduled-maintenance,
--    stripe-webhook and the SECURITY DEFINER notify triggers write as owner).
--
-- 2. The policy is re-created TO authenticated with an explicit WITH CHECK,
--    so it reads as what it is rather than relying on TO PUBLIC and the
--    USING-as-CHECK default. user_id is not grantable anyway, so a row still
--    cannot be handed to another account.
--
-- INSERT and DELETE are unchanged: the only INSERT policy is TO service_role
-- and there is no DELETE policy, so both stay refused for the browser.

REVOKE UPDATE ON public.notifications FROM PUBLIC, anon, authenticated;
GRANT UPDATE (read_at) ON public.notifications TO authenticated;

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON COLUMN public.notifications.read_at IS
  'When the owner read or dismissed this notification. The only column anon/authenticated may UPDATE (US-322); type, title, message and data are written by the system and are not the owner''s to change.';
