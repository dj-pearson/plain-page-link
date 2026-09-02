-- US-102: one timeline, not two.
--
-- The lead detail modal read public.lead_notes and wrote its own "Status
-- changed to: x" row there, while the database triggers wrote the same events
-- to public.lead_activities:
--
--   auto_log_lead_creation      -> 'Lead created'
--   auto_log_lead_status_change -> 'status_change', with previous/new status
--
-- plus everything the log_lead_* RPCs record (US-100) and every notification
-- send (US-099). Two stores, one displayed, so the timeline the agent saw was
-- missing every trigger-logged event and every call and email — while showing
-- a duplicate status entry the trigger had already recorded properly, with the
-- previous status the note did not carry.
--
-- lead_activities is the survivor: it is what the triggers, the RPCs and the
-- lead_activity_summary view all use. This copies the notes across and drops
-- the table, so there is no second store left to read from by accident.
--
-- Column mapping:
--   note        -> content, and title 'Note'
--   is_system   -> activity_type 'status_change' keeps its own shape, so a
--                  system note becomes a plain note with is_internal = true;
--                  metadata records where it came from
--   created_by  -> user_id, which is NOT NULL on lead_activities and nullable
--                  here (ON DELETE SET NULL), so it falls back to the lead's
--                  owner rather than dropping the row
--   created_at  -> activity_at, preserving the timeline's ordering

INSERT INTO public.lead_activities (
  lead_id,
  user_id,
  activity_type,
  title,
  content,
  is_internal,
  metadata,
  activity_at,
  created_at
)
SELECT
  n.lead_id,
  COALESCE(n.created_by, l.user_id),
  'note',
  CASE WHEN n.is_system THEN 'System note' ELSE 'Note' END,
  n.note,
  n.is_system,
  jsonb_build_object('migrated_from', 'lead_notes', 'lead_notes_id', n.id),
  n.created_at,
  n.created_at
FROM public.lead_notes n
JOIN public.leads l ON l.id = n.lead_id
-- Re-running must not duplicate the timeline.
WHERE NOT EXISTS (
  SELECT 1 FROM public.lead_activities a
  WHERE a.metadata ->> 'lead_notes_id' = n.id::text
);

DROP TABLE IF EXISTS public.lead_notes;
