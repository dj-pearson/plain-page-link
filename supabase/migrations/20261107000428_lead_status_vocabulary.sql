-- US-428 (US-278): one lead status vocabulary, enforced by the database.
--
-- leads.status was free text with no CHECK. The UI offered
-- new/contacted/qualified/converted/lost, src/lib/leadStatus.ts also honoured
-- nurturing and closed, an unused constants list offered spam, and a workflow's
-- update_lead step (execute-workflow, service role) wrote whatever string its
-- config held. A status nobody's picker knows renders as a raw string and is
-- invisible to every status filter and KPI.
--
-- Owner decision 2026-11-07: nurturing and closed are real statuses. The
-- vocabulary is LEAD_STATUSES in src/lib/leadStatus.ts, in this order;
-- leadStatus.test.ts reads this file and holds the two together.
--
--   new, contacted, qualified, nurturing, converted, closed, lost
--
-- Existing rows are normalised first:
--   * case and surrounding whitespace are folded ('Contacted ' -> contacted);
--   * spam -> lost (spam is dropped at submit-lead before a row exists; a
--     row someone marked spam is a lead that did not convert);
--   * NULL, empty and anything else is inferred from the lead's own dates:
--     closed_at set -> closed, contacted_at / first_responded_at set ->
--     contacted, otherwise new. A lead is never moved backwards past the
--     contact the agent has already recorded.
--
-- The normalising UPDATE is a data repair, not an agent's action, so the
-- status-change timeline trigger and the updated_at trigger are switched off
-- around it: otherwise every repaired lead would gain a "Status changed"
-- timeline row the agent never made, and jump to the top of "recently
-- updated".
--
-- status becomes NOT NULL (its default is already 'new'); every reader already
-- treats NULL as 'new'.

ALTER TABLE public.leads DISABLE TRIGGER on_lead_status_change;
ALTER TABLE public.leads DISABLE TRIGGER update_leads_updated_at;

UPDATE public.leads
   SET status = CASE
         WHEN lower(btrim(status)) IN
              ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed', 'lost')
           THEN lower(btrim(status))
         WHEN lower(btrim(status)) = 'spam' THEN 'lost'
         WHEN closed_at IS NOT NULL THEN 'closed'
         WHEN contacted_at IS NOT NULL OR first_responded_at IS NOT NULL THEN 'contacted'
         ELSE 'new'
       END
 WHERE status IS NULL
    OR status NOT IN ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed', 'lost');

ALTER TABLE public.leads ENABLE TRIGGER update_leads_updated_at;
ALTER TABLE public.leads ENABLE TRIGGER on_lead_status_change;

ALTER TABLE public.leads ALTER COLUMN status SET DEFAULT 'new';
ALTER TABLE public.leads ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'closed', 'lost'));

COMMENT ON COLUMN public.leads.status IS
  'new = just submitted; contacted = agent reached out; qualified = serious buyer/seller; nurturing = long-horizon, kept warm; converted = became a client; closed = deal completed; lost = did not convert. Vocabulary: LEAD_STATUSES in src/lib/leadStatus.ts (US-428).';
