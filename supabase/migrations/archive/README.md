# Archived migrations

The 89 migrations that built the schema up to 2026-08-06, preserved verbatim for
history. They are **not applied** — `supabase db push` only reads
`supabase/migrations/`, and this directory is one level below it.

They were archived rather than deleted because applying them in filename order
to an empty database failed in ten places, so they could no longer stand a new
environment up (see US-060). Their converged result is
`../20260806000005_squashed_baseline.sql`, which is what a fresh environment
applies now.

Read these when you need to know *why* a column, policy or trigger looks the way
it does — several carry reconciliation notes about Lovable-era divergence that
the squashed dump necessarily loses. Do not move one back into the parent
directory; it would re-run against every environment.
