-- US-309: the overdue-lead chaser chases a lead at most once.
--
-- scheduled-maintenance records a chase as a notifications row
-- (type 'lead_overdue', data.lead_id). Its "already chased?" check used to be a
-- separate read whose error was ignored, and maybeSingle() errors as soon as a
-- second row exists — both read as "not chased", so the agent was emailed again
-- on every hourly run, and every duplicate made the next run worse.
--
-- The chaser now reads the chased set in bulk and fails on a read error, and
-- this index makes the insert itself the claim: a second chase of the same lead
-- is a unique violation (23505), which the chaser treats as "already chased"
-- and does not email about. That also covers two runs overlapping.
--
-- Existing duplicates are removed first, keeping the earliest row per lead, or
-- the index cannot be built. Only lead_overdue rows are touched.

DELETE FROM public.notifications n
USING public.notifications earlier
WHERE n.type = 'lead_overdue'
  AND earlier.type = 'lead_overdue'
  AND earlier.user_id = n.user_id
  AND earlier.data ->> 'lead_id' = n.data ->> 'lead_id'
  AND (earlier.created_at, earlier.id) < (n.created_at, n.id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_lead_overdue_once
  ON public.notifications (user_id, (data ->> 'lead_id'))
  WHERE type = 'lead_overdue';
