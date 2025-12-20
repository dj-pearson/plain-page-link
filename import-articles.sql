-- Import articles from Supabase backup
-- Run this script via: ssh root@209.145.59.219 "docker exec -i supabase-db-rwwccs4k8o8kog4s0w4ggggg psql -U postgres -d postgres" < import-articles.sql

-- First, let's see what we have
SELECT COUNT(*) FROM articles;

-- The backup shows 12 articles that need to be imported
-- Extract just the article data from the backup file and insert it

-- For now, you can either:
-- 1. Export articles from old Supabase dashboard (Table Editor → articles → Export as CSV)
-- 2. Use pg_dump to get just the articles table data
-- 3. Or I can help you parse the backup file and create INSERT statements

-- To export from Supabase dashboard:
-- 1. Go to your Supabase dashboard (api.agentbio.net or self-hosted instance)
-- 2. Navigate to Table Editor → articles
-- 3. Click the "..." menu → Export → CSV
-- 4. Download the CSV file
-- 5. Then import it here

-- Check the structure matches
\d articles
