# Deploying the improvement-loop branch

One runbook for everything on `claude/continuous-improvement-loops-fx2ob1`
that production does not have yet. Lane notes in `progress.txt` give each
step's reason; this file gives the order. Update it whenever a round adds a
migration, an edge-function change or a setting.

## Before you start

1. **Check two production tables.** Make sure `user_mfa_settings` and
   `user_sessions` have no columns that this repo's migrations do not create.
   Migration `20261107000413` re-grants a column list, so an extra column
   would become unreadable.
2. **Check the functions app settings** on functions.agentbio.net (Coolify):
   - `PII_ENCRYPTION_KEY` (or `ENCRYPTION_KEY`) is set. Lead intake and the
     free-tool emails need it.
   - `SUPABASE_URL` is the public API origin. Data-export links are built
     from it.
   - The email provider settings are set (`RESEND_API_KEY`).
   - `SUPABASE_SERVICE_ROLE_KEY` is set and non-empty. A missing or empty key
     now refuses every service-role caller (schedulers, notify-lead).
   - Storage allows files of at least 500 MB, for data exports.
   - On the Cloudflare Pages project, `VITE_APP_URL` (if set) is
     `https://agentbio.net`. Pages Functions now read it for canonical URLs.
   - `COMPANY_POSTAL_ADDRESS` is set (a street address or registered PO box).
     The free-tool drip emails must carry it (CAN-SPAM).
   - Optional: `DIGEST_LOCAL_HOUR` (default 7) and `DIGEST_CATCHUP_HOURS`
     (default 6).
3. **Optional check before migration `20261108000456`.** It blanks agent URLs
   it cannot repair. The file starts with a count query to run first if you
   want to see how many rows it touches.

## Order

Do steps 1 to 3 back to back, in a quiet hour. The database, the functions
app and the frontend depend on each other in both directions:

- The dashboard in production today reads `leads.notes` and `leads.email_hash`
  (its `LEAD_COLUMNS`). Migrations `20261108000452` and `20261108000559` take
  those away, so the live Leads page errors from step 1 until step 3 is done.
- The new functions need the new columns, so step 2 cannot go first.

1. **Apply the migrations** in filename order (list below), then run
   `NOTIFY pgrst, 'reload schema';`.
   - It has to come before step 2. The new submit-lead writes
     `leads.phone_hash` and `leads.visitor_id`. If the new code runs before
     those columns exist, every lead insert fails.
   - Until step 2 finishes, a running workflow's old "Add Note" step fails,
     because `20261108000452` drops `leads.notes`. That is the smaller risk,
     which is why this order is used.
2. **Rebuild the functions.agentbio.net Coolify app.** It serves every
   directory under `supabase/functions/`, so new functions (`email-unsubscribe`,
   `resend-webhook`) come up with it.
3. **Deploy Cloudflare Pages.** The new routes (`/:username/listing/:id`,
   `/:username/manifest.json`, `/sitemap-profiles.xml`) and the `_headers`
   changes ship with this step.
4. **Set up the Resend webhook.** Point it at `<functions-url>/resend-webhook`
   for the events `email.bounced` and `email.complained`. Set its signing
   secret as `RESEND_WEBHOOK_SECRET` on the functions app.
5. **Smoke test storage** (migration `20261108000592`):
   - a public avatar or listing photo URL still loads while signed out;
   - an agent can replace their avatar;
   - with the anon key, `storage.from('listing-photos').list('')` returns `[]`.
6. **Check the pages.dev alias.** `curl -sI https://agentbio.pages.dev/` shows
   `x-robots-tag: noindex`; `curl -sI https://agentbio.net/` shows none.
7. **Stripe setting.** Check "after all retries fail" in the Stripe dashboard.
   If it cancels the subscription, access ends then; if it leaves it unpaid,
   the past-due grace (now counted from the last paid period) ends access.
8. **Headshot check.** Upload a new headshot in Settings. Storage should then
   hold `avatar-<ts>-full.jpg` and `avatar-<ts>-256.webp`, and the public
   profile should request the 256px one.
9. **Search consoles.** Submit `/sitemap-profiles.xml` to Google Search
   Console and Bing if you have not already.

## Migrations not yet in production (filename order)

```
20261107000263_listing_view_stats.sql
20261107000308_unpublished_agent_content_private.sql
20261107000309_lead_overdue_once.sql
20261107000325_top_listings.sql
20261107000326_assignee_logs_lead_activity.sql
20261107000329_public_profile_page_one_round_trip.sql
20261107000330_notifications_owner_updates_read_at_only.sql
20261107000349_lead_timeline_system_rows_tamper_proof.sql
20261107000353_deletion_schedule_system_written.sql
20261107000354_digest_runs.sql
20261107000373_log_lead_meeting.sql
20261107000377_api_keys_system_written.sql
20261107000378_get_agent_contacts.sql
20261107000396_link_clicks_published_pages_only.sql
20261107000397_gdpr_exports_bucket.sql
20261107000413_mfa_and_session_rows_system_written.sql
20261107000428_lead_status_vocabulary.sql
20261107000433_profile_timezone.sql
20261108000434_email_suppressions.sql
20261108000452_lead_notes_into_timeline.sql
20261108000454_routing_rules_follow_roster.sql
20261108000456_agent_url_scheme_checks.sql
20261108000458_email_suppressions_bounces.sql
20261108000475_unassign_leads_on_member_departure.sql
20261108000495_won_statuses_count_as_conversions.sql
20261108000497_lead_assignee_must_be_teammate.sql
20261108000499_api_keys_revoked_is_inactive.sql
20261108000514_custom_css_on_public_page.sql
20261108000531_leads_visitor_id.sql
20261108000532_leads_phone_lookup_hash.sql
20261108000534_lead_stats_assignee_filter.sql
20261108000557_lead_stats_type_search_filter.sql
20261108000559_lead_lookup_hashes_not_browser_readable.sql
20261108000592_storage_media_not_listable.sql
20261108000610_contact_touch_follows_deleted_interactions.sql
20261108000615_past_due_grace_from_paid_period.sql
20261108000629_contact_lookup_hashes.sql
20261108000651_open_house_start_not_in_past.sql
20261108000669_open_house_agent_time_zone.sql
20261108000674_unpublished_page_builder_and_plan_private.sql
```

## What changes for users the moment it ships

- Free-tool drip emails that used to go to an empty address, while being
  logged as sent, will really send once a cron schedules them.
- Installed apps update without asking (silent updates are the owner's
  decision). iPhone home-screen icons added before the change keep their saved
  address until they are added again.
