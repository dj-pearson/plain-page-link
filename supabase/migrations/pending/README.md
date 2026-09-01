# Pending migrations

Migrations here are **deliberately not applied**. They are not picked up by
`supabase db push` and CI does not run them — `supabase/migrations/*.sql` is a
non-recursive glob, so this directory is skipped the same way `archive/` is.

Move a file up one level to `supabase/migrations/` only when the note at the
top of it says its precondition is met.

## 20260901000002_require_aal2_for_mfa_users.sql — US-085

Requires an `aal2` token for MFA-enrolled users on `leads` and the two
subscription tables. This is the part of US-085 that makes the second factor
actually enforce something, and it is also the part that can lock people out,
because **an aal1 token is all a user has until the client-side native MFA
flow is live and they have re-enrolled.**

Apply it only once all of the following hold:

1. The client changes in this branch are deployed (native enrol/challenge via
   `useNativeMFA`, the AAL-aware `useAuthStore.signIn`, and the real
   `getSecurityContext`).
2. Enrolled users have been through the re-enrolment prompt, or you have
   accepted that any who have not will be blocked from their leads until they
   do. Check how many remain:

   ```sql
   SELECT count(*) FROM public.user_mfa_settings
   WHERE mfa_enabled AND verified_at IS NOT NULL;
   ```

   That count reaching zero means everyone has migrated.
3. You have verified the flow end to end against a staging Supabase. Nothing
   in this story has been exercised against a real GoTrue — see the US-085
   notes in prd.json.

Applying it before (1) locks out every enrolled agent, since nothing will have
upgraded their session to aal2.
