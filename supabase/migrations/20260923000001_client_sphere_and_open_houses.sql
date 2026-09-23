-- Client sphere, key dates and open houses.
--
-- The CRM stopped at `leads`: somebody who filled in a form. An agent's
-- business is the people after that — the buyers they closed with, the
-- neighbour who referred them, the past client whose daughter turns seven next
-- week. None of it had anywhere to live, so it lived in a phone's contacts app
-- and the agent's memory. This adds:
--
--   contacts              the agent's sphere: clients, past clients, referral
--                         partners, with household members and interests
--   contact_key_dates     birthdays, anniversaries, closing and move-in dates,
--                         parties — anything the agent wants to remember, with
--                         an annual flag and a reminder lead time
--   contact_interactions  the touch log (call, text, gift, …), which moves
--                         last_contacted_at and so the next touch due date
--   open_houses           scheduled open houses per listing, shown publicly on
--                         the profile and backing a sign-in kiosk page
--   leads.open_house_id   which open house a sign-in came from
--
-- Contact email and phone are stored encrypted, like leads since US-086:
-- encrypted_email / encrypted_phone, written through pii-crypto and read back
-- through its decrypt_contacts op, which filters to the caller's own rows.

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  first_name text NOT NULL CHECK (length(btrim(first_name)) BETWEEN 1 AND 100),
  last_name text CHECK (last_name IS NULL OR length(last_name) <= 100),
  encrypted_email text,
  encrypted_phone text,
  relationship text NOT NULL DEFAULT 'sphere' CHECK (relationship IN (
    'active_buyer', 'active_seller', 'past_client', 'sphere', 'prospect',
    'referral_partner', 'vendor'
  )),
  preferred_contact text CHECK (preferred_contact IS NULL OR preferred_contact IN ('call', 'text', 'email')),
  address text,
  city text,
  state text,
  zip_code text,
  occupation text,
  employer text,
  referred_by text,
  source text,
  -- [{ "name": "Emma", "relation": "child", "notes": "loves horses" }, …]
  household jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(household) = 'array'),
  interests text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  notes text CHECK (notes IS NULL OR length(notes) <= 10000),
  -- Stay-in-touch cadence. NULL means the agent has not set one.
  touch_frequency_days integer CHECK (touch_frequency_days IS NULL OR touch_frequency_days BETWEEN 1 AND 730),
  last_contacted_at timestamptz,
  -- Maintained by contacts_set_next_touch; not written by the client.
  next_touch_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_name ON public.contacts (user_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_user_next_touch ON public.contacts (user_id, next_touch_at)
  WHERE next_touch_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_lead ON public.contacts (lead_id) WHERE lead_id IS NOT NULL;

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage their own contacts"
  ON public.contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The next touch is derived, so it cannot drift from the two values it is
-- derived from. A BEFORE trigger rather than a generated column because
-- timestamptz + interval is only STABLE.
CREATE OR REPLACE FUNCTION public.contacts_set_next_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.touch_frequency_days IS NULL THEN
    NEW.next_touch_at := NULL;
  ELSE
    NEW.next_touch_at := COALESCE(NEW.last_contacted_at, NEW.created_at, now())
      + make_interval(days => NEW.touch_frequency_days);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_contacts_set_next_touch ON public.contacts;
CREATE TRIGGER trg_contacts_set_next_touch
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.contacts_set_next_touch();

-- ---------------------------------------------------------------------------
-- contact_key_dates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_key_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'custom' CHECK (kind IN (
    'birthday', 'anniversary', 'home_anniversary', 'closing', 'move_in',
    'lease_end', 'party', 'custom'
  )),
  label text NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 120),
  -- Whose date it is, when it is not the contact's own: "Emma", "Max (dog)".
  person_name text CHECK (person_name IS NULL OR length(person_name) <= 100),
  event_date date NOT NULL,
  -- A birthday is often known without its year. The year of event_date is then
  -- a placeholder and no age is computed from it.
  year_known boolean NOT NULL DEFAULT true,
  recurs_annually boolean NOT NULL DEFAULT true,
  remind_days_before integer NOT NULL DEFAULT 7 CHECK (remind_days_before BETWEEN 0 AND 90),
  notes text CHECK (notes IS NULL OR length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_key_dates_user ON public.contact_key_dates (user_id);
CREATE INDEX IF NOT EXISTS idx_contact_key_dates_contact ON public.contact_key_dates (contact_id);

ALTER TABLE public.contact_key_dates ENABLE ROW LEVEL SECURITY;

-- The contact must be the caller's too, or a row could hang one agent's date
-- off another agent's contact id.
CREATE POLICY "Agents manage their own contact dates"
  ON public.contact_key_dates FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_contact_key_dates_updated_at ON public.contact_key_dates;
CREATE TRIGGER trg_contact_key_dates_updated_at
  BEFORE UPDATE ON public.contact_key_dates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- contact_interactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN (
    'call', 'text', 'email', 'meeting', 'gift', 'card', 'social', 'event', 'note'
  )),
  summary text CHECK (summary IS NULL OR length(summary) <= 4000),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_interactions_contact
  ON public.contact_interactions (contact_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_interactions_user ON public.contact_interactions (user_id);

ALTER TABLE public.contact_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage their own contact interactions"
  ON public.contact_interactions FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid())
  );

-- A logged touch moves the contact's last_contacted_at forward (never back:
-- back-filling an old call must not make a recent one disappear), which in turn
-- re-derives next_touch_at. A note is not a touch.
CREATE OR REPLACE FUNCTION public.contact_interactions_touch_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.kind <> 'note' THEN
    UPDATE public.contacts
       SET last_contacted_at = GREATEST(COALESCE(last_contacted_at, NEW.occurred_at), NEW.occurred_at)
     WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_contact_interactions_touch_contact ON public.contact_interactions;
CREATE TRIGGER trg_contact_interactions_touch_contact
  AFTER INSERT ON public.contact_interactions
  FOR EACH ROW EXECUTE FUNCTION public.contact_interactions_touch_contact();

-- ---------------------------------------------------------------------------
-- open_houses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.open_houses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  is_public boolean NOT NULL DEFAULT true,
  -- Shown to visitors: "Refreshments served", "Park on Elm St".
  public_notes text CHECK (public_notes IS NULL OR length(public_notes) <= 1000),
  -- The agent's own: lockbox code, who is hosting, feedback.
  private_notes text CHECK (private_notes IS NULL OR length(private_notes) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT open_houses_ends_after_start CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_open_houses_user_start ON public.open_houses (user_id, starts_at DESC);
CREATE INDEX IF NOT EXISTS idx_open_houses_listing ON public.open_houses (listing_id);
CREATE INDEX IF NOT EXISTS idx_open_houses_public_upcoming ON public.open_houses (user_id, ends_at)
  WHERE is_public AND status = 'scheduled';

ALTER TABLE public.open_houses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents manage their own open houses"
  ON public.open_houses FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.user_id = auth.uid())
  );

DROP TRIGGER IF EXISTS trg_open_houses_updated_at ON public.open_houses;
CREATE TRIGGER trg_open_houses_updated_at
  BEFORE UPDATE ON public.open_houses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Carry over the open houses the listing form used to store on the listing
-- itself. Those two columns stay (dropping them is not this change's call) but
-- nothing writes them any more. They are `date`, not timestamps — the form had
-- no time — so the imported rows get a placeholder noon-to-2pm and a note
-- saying so, rather than an invented precision.
INSERT INTO public.open_houses (user_id, listing_id, starts_at, ends_at, status, private_notes)
SELECT l.user_id,
       l.id,
       (l.open_house_date + time '12:00')::timestamptz,
       (COALESCE(l.open_house_end_date, l.open_house_date) + time '14:00')::timestamptz,
       CASE WHEN COALESCE(l.open_house_end_date, l.open_house_date) < current_date
            THEN 'completed' ELSE 'scheduled' END,
       'Imported from the listing form, which stored a date but no time. Check the hours.'
FROM public.listings l
WHERE l.open_house_date IS NOT NULL
  AND COALESCE(l.open_house_end_date, l.open_house_date) >= l.open_house_date
  AND NOT EXISTS (SELECT 1 FROM public.open_houses o WHERE o.listing_id = l.id);

COMMENT ON COLUMN public.listings.open_house_date IS
  'Superseded by public.open_houses (20260923000001). Kept for history; not written.';
COMMENT ON COLUMN public.listings.open_house_end_date IS
  'Superseded by public.open_houses (20260923000001). Kept for history; not written.';

-- ---------------------------------------------------------------------------
-- Public reads
--
-- There is no public SELECT policy on open_houses: a policy exposes whole rows,
-- and private_notes (lockbox codes, seller instructions) is in the row. Column
-- grants cannot fix that for `authenticated`, since the owner needs the column
-- too. Visitors read through these two functions instead, which return only
-- what a visitor should see — scheduled, public, not yet over, on a published
-- profile and a listing that is still for sale.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_public_open_houses(_user_id uuid)
RETURNS TABLE (
  id uuid,
  listing_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  public_notes text,
  address text,
  city text,
  state text,
  zip_code text,
  price text,
  beds integer,
  baths integer,
  sqft integer,
  image text,
  photos jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT o.id, o.listing_id, o.starts_at, o.ends_at, o.public_notes,
         l.address, l.city, l.state, l.zip_code, l.price, l.beds, l.baths, l.sqft,
         l.image, l.photos
    FROM public.open_houses o
    JOIN public.listings l ON l.id = o.listing_id
    JOIN public.profiles p ON p.id = o.user_id
   WHERE o.user_id = _user_id
     AND o.is_public
     AND o.status = 'scheduled'
     AND o.ends_at > now()
     AND p.is_published IS NOT FALSE
     AND l.status IN ('active', 'pending', 'under_contract')
   ORDER BY o.starts_at
   LIMIT 20;
$function$;

-- The sign-in kiosk: one open house plus the agent it belongs to. Unlike the
-- list it still answers during the event and for the rest of that day, since
-- the kiosk is opened at the door and may be left open past the end time.
CREATE OR REPLACE FUNCTION public.get_public_open_house(_open_house_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  listing_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  public_notes text,
  address text,
  city text,
  state text,
  zip_code text,
  price text,
  beds integer,
  baths integer,
  sqft integer,
  image text,
  photos jsonb,
  agent_username text,
  agent_full_name text,
  agent_avatar_url text,
  agent_title text,
  agent_brokerage_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $function$
  SELECT o.id, o.user_id, o.listing_id, o.starts_at, o.ends_at, o.public_notes,
         l.address, l.city, l.state, l.zip_code, l.price, l.beds, l.baths, l.sqft,
         l.image, l.photos,
         p.username, p.full_name, p.avatar_url, p.title, p.brokerage_name
    FROM public.open_houses o
    JOIN public.listings l ON l.id = o.listing_id
    JOIN public.profiles p ON p.id = o.user_id
   WHERE o.id = _open_house_id
     AND o.status = 'scheduled'
     AND o.ends_at > now() - interval '12 hours'
     AND p.is_published IS NOT FALSE;
$function$;

REVOKE ALL ON FUNCTION public.list_public_open_houses(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_open_house(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_public_open_houses(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_open_house(uuid) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- leads.open_house_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS open_house_id uuid REFERENCES public.open_houses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_open_house ON public.leads (open_house_id)
  WHERE open_house_id IS NOT NULL;
