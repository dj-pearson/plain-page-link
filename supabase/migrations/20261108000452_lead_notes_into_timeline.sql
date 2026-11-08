-- US-452 (US-278 slice 2, closes US-438): leads.notes moves onto the timeline,
-- then the column is dropped.
--
-- Nothing in the dashboard reads leads.notes. Its only writer was the
-- workflow "Update lead" step's "Add Note" field (execute-workflow update_lead),
-- so an agent whose workflow added a note never saw it. That step now inserts a
-- lead_activities 'note' row, which LeadDetailModal shows on the timeline next
-- to the agent's own notes (the same move 20260902000005 made for lead_notes).
--
-- 1. Copy every non-empty leads.notes into a timeline note, attributed to the
--    lead's owner (lead_activities.user_id is NOT NULL; 'note' is an
--    agent-authored type under US-349, so the owner can delete it like any
--    other note). activity_at is the lead's updated_at, the closest thing to
--    when the note was written. Re-running does not duplicate it.
-- 2. Drop the column. Its column-level SELECT grant (20261101000016) goes with
--    it; the grant is restated below without it so LEAD_COLUMNS
--    (src/lib/leadColumns.ts) and leadColumns.test.ts still have one list to
--    hold together. No view, trigger or function reads leads.notes.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'notes'
  ) THEN
    EXECUTE $sql$
      INSERT INTO public.lead_activities (
        lead_id, user_id, activity_type, title, content, is_internal,
        metadata, activity_at, created_at
      )
      SELECT
        l.id,
        l.user_id,
        'note',
        'Note',
        btrim(l.notes),
        true,
        jsonb_build_object('migrated_from', 'leads.notes'),
        COALESCE(l.updated_at, l.created_at, now()),
        COALESCE(l.updated_at, l.created_at, now())
      FROM public.leads l
      WHERE l.notes IS NOT NULL
        AND btrim(l.notes) <> ''
        AND NOT EXISTS (
          SELECT 1 FROM public.lead_activities a
          WHERE a.lead_id = l.id
            AND a.metadata ->> 'migrated_from' = 'leads.notes'
        )
    $sql$;
  END IF;
END $$;

ALTER TABLE public.leads DROP COLUMN IF EXISTS notes;

-- The browser's readable columns: 20261101000016's list, without notes.
REVOKE SELECT ON public.leads FROM anon, authenticated;
GRANT SELECT (
  id, user_id, lead_type, name, message, status, source, form_data,
  created_at, updated_at, first_responded_at, assigned_to, contacted_at,
  closed_at, listing_id, price_range, timeline, property_address, preapproved,
  referrer_url, utm_source, utm_medium, utm_campaign, device, is_sample,
  open_house_id, email_hash, update_token_hash, update_token_expires_at
) ON public.leads TO authenticated;
