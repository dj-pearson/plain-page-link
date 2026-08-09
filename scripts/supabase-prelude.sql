-- Emulate the parts of a Supabase instance that migrations depend on.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS graphql_public;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS vault;

-- Roles Supabase migrations commonly GRANT to.
DO $$ BEGIN
  CREATE ROLE anon NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE authenticated NOLOGIN NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE authenticator NOINHERIT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE ROLE supabase_admin SUPERUSER;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- auth.users, referenced by nearly every FK in the schema.
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  encrypted_password text,
  raw_user_meta_data jsonb,
  raw_app_meta_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  phone text,
  confirmed_at timestamptz,
  deleted_at timestamptz
);

-- auth helper functions used inside RLS policies.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.role', true), '')::text
$$;
CREATE OR REPLACE FUNCTION auth.email() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.email', true), '')::text
$$;
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb)
$$;

-- storage.buckets / storage.objects, referenced by storage policies.
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid,
  public boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  metadata jsonb,
  path_tokens text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE OR REPLACE FUNCTION storage.foldername(name text) RETURNS text[]
  LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array(name, '/') $$;

-- Cron / net shims: migrations may schedule jobs or call http.
CREATE SCHEMA IF NOT EXISTS cron;
CREATE OR REPLACE FUNCTION cron.schedule(text, text, text) RETURNS bigint
  LANGUAGE sql AS $$ SELECT 1::bigint $$;
CREATE OR REPLACE FUNCTION cron.unschedule(text) RETURNS boolean
  LANGUAGE sql AS $$ SELECT true $$;
CREATE SCHEMA IF NOT EXISTS net;
CREATE OR REPLACE FUNCTION net.http_post(url text, body jsonb DEFAULT '{}', params jsonb DEFAULT '{}', headers jsonb DEFAULT '{}', timeout_milliseconds int DEFAULT 5000)
  RETURNS bigint LANGUAGE sql AS $$ SELECT 1::bigint $$;
CREATE OR REPLACE FUNCTION vault.create_secret(text, text, text) RETURNS uuid
  LANGUAGE sql AS $$ SELECT gen_random_uuid() $$;

-- Hosted Supabase ships these default privileges, which is why none of the
-- repo's migrations GRANT on the tables they create: new tables in `public`
-- automatically become reachable by the API roles, and RLS does the actual
-- restricting. Without this, every table is unreachable for anon/authenticated
-- and RLS policies cannot be exercised at all.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Hosted Supabase also grants USAGE on `auth` to the API roles. Without it,
-- auth.uid() raises "permission denied for schema auth" for anon/authenticated,
-- so every RLS policy built on auth.uid() = user_id — which is nearly all of
-- them — silently evaluates to an error rather than to true/false, and no
-- owner-scoped policy can be exercised locally at all. That made it impossible
-- to verify "the owner can still read their own rows" after narrowing a policy,
-- which is exactly the half of the check that catches over-tightening.
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

-- Likewise `storage`: hosted Supabase grants the API roles USAGE on the schema
-- and ALL on storage.objects/storage.buckets, leaving RLS to do the restricting.
-- Without it every storage policy is unexercisable locally — the insert fails
-- with "permission denied for schema storage" before any policy is consulted,
-- so an owner-scoped upload rule cannot be tested either way (US-075).
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.objects TO anon, authenticated, service_role;
GRANT ALL ON TABLE storage.buckets TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Default privileges only apply to objects created afterwards, so a database
-- that already has tables needs them granted explicitly too. Safe to re-run.
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
