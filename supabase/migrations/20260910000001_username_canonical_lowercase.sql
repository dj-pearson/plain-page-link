-- US-187: a username has one canonical form, and the database says so.
--
-- Every writer already lowercased: derive_available_username() at signup,
-- UsernameInput as the agent types, Settings before it writes. Every reader
-- compared exactly. The gap between those two facts is only invisible while
-- no row is mixed case — and profiles_username_key is case-SENSITIVE, so
-- nothing prevented one. check_username_available() compares with LOWER(),
-- which means 'Jane' and 'jane' were "the same" to the availability check and
-- two different rows to the unique index.
--
-- This migration makes the stored form canonical and keeps it that way, so
-- the case-insensitive read path added alongside it cannot resolve to two rows.

-- ---------------------------------------------------------------------------
-- 1. Normalise what is already there.
-- ---------------------------------------------------------------------------
-- Lowering a username can collide with an existing row that differs only by
-- case. Suffix deterministically, the way derive_available_username() does,
-- rather than failing the migration on data that predates the rule.
DO $$
DECLARE
  r          record;
  candidate  text;
  suffix     int;
BEGIN
  FOR r IN
    SELECT id, username
    FROM public.profiles
    WHERE username IS DISTINCT FROM lower(username)
    ORDER BY created_at NULLS LAST, id
  LOOP
    candidate := lower(r.username);
    suffix := 1;

    WHILE EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id <> r.id AND lower(p.username) = candidate
    ) LOOP
      suffix := suffix + 1;
      EXIT WHEN suffix > 50;
      candidate := left(lower(r.username), 30 - (length(suffix::text) + 1))
                   || '-' || suffix::text;
    END LOOP;

    IF suffix > 50 THEN
      candidate := left(replace(r.id::text, '-', ''), 20);
    END IF;

    UPDATE public.profiles SET username = candidate WHERE id = r.id;
    RAISE NOTICE 'US-187: profile % username % -> %', r.id, r.username, candidate;
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Make two usernames that differ only by case impossible.
-- ---------------------------------------------------------------------------
-- idx_profiles_username_lower already exists as a plain btree on lower(username)
-- and is what the read path uses. A second, UNIQUE index on the same expression
-- is what enforces the rule; the planner is free to use either.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- 3. Make a non-canonical username impossible to write in the first place.
-- ---------------------------------------------------------------------------
-- NOT VALID would let existing rows through, but step 1 has already fixed them,
-- so validate immediately: a mixed-case row appearing later is a bug in a
-- writer, and it should fail at the INSERT rather than 404 for a visitor.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_is_lowercase;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_is_lowercase
  CHECK (username = lower(username));

COMMENT ON CONSTRAINT profiles_username_is_lowercase ON public.profiles IS
  'US-187: usernames are stored canonical (lower case) so the public profile lookup can be case-insensitive without resolving to two rows.';
