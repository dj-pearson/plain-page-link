-- US-610: deleting a logged touch rolls the client's stay-in-touch clock back.
--
-- contact_interactions_touch_contact (20260923000001) moved
-- contacts.last_contacted_at forward on INSERT and nothing ever moved it back.
-- The Activity tab offers one-tap "Called / Texted / Emailed" buttons and a
-- delete button on every row, so a mis-tap on the wrong client, deleted a
-- second later, still left that client "Last contacted 1 minute ago" with the
-- next touch pushed a full cadence out: a past client who was due today
-- silently dropped off the Clients "due" filter and the dashboard's Coming up
-- list for 30, 90 or 365 days. Changing an entry's date or kind had the same
-- problem.
--
-- The trigger now runs on INSERT, UPDATE and DELETE:
--   INSERT  unchanged: last_contacted_at moves forward, never back, so
--           back-filling an old call does not hide a recent one.
--   DELETE  if the deleted entry was the latest touch (its occurred_at is at or
--           after last_contacted_at), last_contacted_at becomes the latest
--           remaining non-note entry, or NULL when none is left. An older entry
--           being deleted changes nothing, so a last_contacted_at that is newer
--           than every entry is never discarded by deleting an old one.
--   UPDATE  the old version is treated as deleted and the new one as inserted,
--           on the old and the new contact.
-- contacts_set_next_touch re-derives next_touch_at from the new value as
-- before. A note is still not a touch.
--
-- Still SECURITY INVOKER with the pinned search_path: RLS on contacts and
-- contact_interactions (both owner-only, WITH CHECK tying the entry to the
-- caller's own contact) decides what the UPDATE can reach. When a contact is
-- deleted, the cascaded deletes of its entries find no contact row left to
-- update, which is a no-op.

CREATE OR REPLACE FUNCTION public.contact_interactions_touch_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  -- The old version leaving: roll back if it was the latest touch.
  IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.kind <> 'note' THEN
    UPDATE public.contacts c
       SET last_contacted_at = (
             SELECT max(i.occurred_at)
               FROM public.contact_interactions i
              WHERE i.contact_id = OLD.contact_id
                AND i.kind <> 'note'
                AND (TG_OP = 'DELETE' OR i.id <> OLD.id)
           )
     WHERE c.id = OLD.contact_id
       AND c.last_contacted_at IS NOT NULL
       AND c.last_contacted_at <= OLD.occurred_at;
  END IF;

  -- The new version arriving: move forward, never back.
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.kind <> 'note' THEN
    UPDATE public.contacts
       SET last_contacted_at = GREATEST(COALESCE(last_contacted_at, NEW.occurred_at), NEW.occurred_at)
     WHERE id = NEW.contact_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_contact_interactions_touch_contact ON public.contact_interactions;
CREATE TRIGGER trg_contact_interactions_touch_contact
  AFTER INSERT OR UPDATE OF kind, occurred_at, contact_id OR DELETE ON public.contact_interactions
  FOR EACH ROW EXECUTE FUNCTION public.contact_interactions_touch_contact();
