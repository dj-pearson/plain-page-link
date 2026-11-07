-- US-397 (US-291 slice 1): a private bucket for queued data exports.
--
-- scheduled-maintenance now builds a POSTed export request into this bucket
-- and emails the subject a signed link that expires
-- (supabase/functions/_shared/gdpr-export-queue.ts). The file holds the
-- agent's decrypted leads and clients, so:
--
--   * the bucket is private (public = false): no object is reachable by URL
--     without a signature;
--   * there is deliberately NO storage.objects policy naming it, so anon and
--     authenticated can neither list, read, write nor delete in it — only the
--     service role, which bypasses RLS, touches it. The subject reaches their
--     own file only through the signed link in their email;
--   * objects are JSON only, and are removed by the same job once
--     gdpr_data_requests.file_expires_at passes.
--
-- 500 MB per file: the export reads up to 100,000 rows per section
-- (MAX_ROWS_PER_SECTION). A self-hosted storage API also applies its own
-- FILE_SIZE_LIMIT, which must be at least this for the largest exports.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gdpr-exports', 'gdpr-exports', false, 524288000, ARRAY['application/json'])
ON CONFLICT (id) DO UPDATE
  SET public             = false,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMENT ON COLUMN public.gdpr_data_requests.file_url IS
  'For a completed export: the object path inside the private gdpr-exports bucket (not a URL). '
  'The signed link is only ever sent to the subject by email. Cleared when the file is removed after file_expires_at.';

-- The queue processor lists pending (and stale processing) exports oldest
-- first, and the purge lists completed exports by expiry.
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_export_queue
  ON public.gdpr_data_requests (created_at)
  WHERE request_type = 'export' AND status IN ('pending', 'processing');

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_export_files
  ON public.gdpr_data_requests (file_expires_at)
  WHERE request_type = 'export' AND file_url IS NOT NULL;
