/**
 * Build sitemap.xml from the pages the build actually produced (US-149).
 *
 * The file this replaces was static, hand-edited, and last touched 2026-07-14
 * with every lastmod reading 2026-02-08. It listed 44 URLs, not one of which
 * was a blog article, and it listed https://agentbio.net/features — a path with
 * no route in App.tsx, which the SPA fallback answered with the 404 page under
 * a 200. A soft 404, submitted to Google on purpose, for months.
 *
 * The defence against that recurring is structural rather than procedural: the
 * only thing that can enter this sitemap is a route that has just been rendered
 * to a file and passed the render gate. A URL cannot be listed unless the page
 * behind it exists, has its own title and description, and is not the 404.
 *
 * On lastmod: articles carry a real one from articles.updated_at. The static
 * routes do not have a truthful source for it — the build date is not when the
 * pricing page last changed, and a sitemap where every lastmod is "today" is
 * one Google learns to disregard. Where the date is unknown the element is
 * omitted, which the protocol allows and which is the honest answer.
 */

export interface SitemapEntry {
  path: string;
  /** ISO 8601, or null when there is no truthful value. */
  lastmod: string | null;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Normalise to a date-only lastmod; Google ignores sub-day precision here. */
function isoDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function buildSitemapXml(entries: SitemapEntry[], origin: string): string {
  const base = origin.replace(/\/+$/, '');

  const urls = entries
    .map((entry) => {
      const loc = entry.path === '/' ? `${base}/` : `${base}${entry.path}`;
      const lastmod = entry.lastmod ? isoDate(entry.lastmod) : null;
      return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        ...(lastmod ? [`    <lastmod>${lastmod}</lastmod>`] : []),
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls +
    '\n</urlset>\n'
  );
}

/**
 * How much of the site each kind of page is worth, relative to the rest of it.
 *
 * Legal pages stay indexable — they are legitimate pages and hiding them
 * redistributes nothing — but they took 207 of 1,481 impressions in the 16
 * months to 2026-09-08 while the pages that sell the product took almost none,
 * so they are not competing for prominence here.
 */
export function weightFor(
  kind: string,
  path: string
): Pick<SitemapEntry, 'priority' | 'changefreq'> {
  if (path === '/') return { priority: 1.0, changefreq: 'weekly' };
  switch (kind) {
    case 'marketing':
      return { priority: 0.9, changefreq: 'weekly' };
    case 'comparison':
      return { priority: 0.9, changefreq: 'monthly' };
    case 'tool':
      return { priority: 0.8, changefreq: 'monthly' };
    case 'feature':
      return { priority: 0.8, changefreq: 'monthly' };
    case 'blog':
      return { priority: 0.7, changefreq: 'weekly' };
    case 'article':
      return { priority: 0.6, changefreq: 'monthly' };
    case 'location':
      return { priority: 0.5, changefreq: 'monthly' };
    case 'legal':
      return { priority: 0.3, changefreq: 'yearly' };
    default:
      return { priority: 0.5, changefreq: 'monthly' };
  }
}
