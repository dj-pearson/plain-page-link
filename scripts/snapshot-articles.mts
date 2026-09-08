#!/usr/bin/env node
/**
 * Write scripts/data/articles.snapshot.json from the live database (US-148).
 *
 * The prerender needs the article rows at build time. Where the build can reach
 * the database it reads them directly; where it cannot — CI, a fork, a sandbox,
 * a Cloudflare build without the variables set — it falls back to the snapshot
 * this produces. Commit the result.
 *
 *   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run articles:snapshot
 *
 * Anon key only. The snapshot therefore contains exactly what an anonymous
 * visitor can already read, which is the same set the public blog serves.
 */
import { loadArticles, writeSnapshot, SNAPSHOT_PATH } from './lib/articles.mts';

const hasCredentials =
  !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL) &&
  !!(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);

if (!hasCredentials) {
  console.error(
    'No database credentials.\n' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and run this again from\n' +
      'somewhere that can reach the database. Nothing was written.'
  );
  process.exit(1);
}

const { articles, source } = await loadArticles();

if (source !== 'supabase') {
  console.error(
    'Read the existing snapshot rather than the database, which would just\n' +
      'rewrite the file with its own contents. Check the credentials and the\n' +
      'network. Nothing was written.'
  );
  process.exit(1);
}

await writeSnapshot(articles);
console.log(`Wrote ${articles.length} published articles to ${SNAPSHOT_PATH}`);
console.log('Commit it so builds without database access still ship the blog.');
