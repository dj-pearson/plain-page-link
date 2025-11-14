import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getCorsHeaders } from '../_shared/cors.ts';

const BASE_URL = 'https://agentbio.net';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  // Add XML content type to CORS headers
  const xmlHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/xml',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'index';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (type === 'index') {
      return generateSitemapIndex(xmlHeaders);
    } else if (type === 'static') {
      return generateStaticSitemap(xmlHeaders);
    } else if (type === 'blog') {
      return generateBlogSitemap(supabase, xmlHeaders);
    } else if (type === 'profiles') {
      return generateProfilesSitemap(supabase, xmlHeaders);
    } else if (type === 'pages') {
      return generatePagesSitemap(supabase, xmlHeaders);
    }

    return new Response('Invalid type parameter', { status: 400, headers: xmlHeaders });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { ...xmlHeaders }, status: 500 }
    );
  }
});

function generateSitemapIndex(headers: Record<string, string>) {
  const now = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE_URL}/api/sitemap?type=static</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/api/sitemap?type=blog</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/api/sitemap?type=profiles</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE_URL}/api/sitemap?type=pages</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, { headers });
}

function generateStaticSitemap(headers: Record<string, string>) {
  const now = new Date().toISOString();
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'weekly' },
    { url: 'pricing', priority: '0.9', changefreq: 'monthly' },
    { url: 'for-real-estate-agents', priority: '0.9', changefreq: 'monthly' },
    { url: 'instagram-bio-for-realtors', priority: '0.9', changefreq: 'monthly' },
    { url: 'vs/linktree', priority: '0.8', changefreq: 'monthly' },
    { url: 'features/property-listings', priority: '0.8', changefreq: 'monthly' },
    { url: 'features/lead-capture', priority: '0.8', changefreq: 'monthly' },
    { url: 'features/calendar-booking', priority: '0.8', changefreq: 'monthly' },
    { url: 'features/testimonials', priority: '0.8', changefreq: 'monthly' },
    { url: 'features/analytics', priority: '0.8', changefreq: 'monthly' },
    { url: 'tools/instagram-bio-analyzer', priority: '0.7', changefreq: 'weekly' },
    { url: 'tools/listing-description-generator', priority: '0.7', changefreq: 'weekly' },
    { url: 'blog', priority: '0.8', changefreq: 'daily' },
    { url: 'privacy', priority: '0.3', changefreq: 'yearly' },
    { url: 'terms', priority: '0.3', changefreq: 'yearly' },
  ];

  const urls = staticPages.map(page => `
  <url>
    <loc>${BASE_URL}/${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers });
}

async function generateBlogSitemap(supabase: any, headers: Record<string, string>) {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles:', error);
  }

  const urls = (articles || []).map((article: any) => `
  <url>
    <loc>${BASE_URL}/blog/${article.slug}</loc>
    <lastmod>${new Date(article.updated_at || article.published_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers });
}

async function generateProfilesSitemap(supabase: any, headers: Record<string, string>) {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('username, updated_at')
    .not('username', 'is', null)
    .limit(10000);

  if (error) {
    console.error('Error fetching profiles:', error);
  }

  const urls = (profiles || []).map((profile: any) => `
  <url>
    <loc>${BASE_URL}/@${profile.username}</loc>
    <lastmod>${new Date(profile.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers });
}

async function generatePagesSitemap(supabase: any, headers: Record<string, string>) {
  const { data: pages, error } = await supabase
    .from('custom_pages')
    .select('slug, updated_at')
    .eq('is_published', true);

  if (error) {
    console.error('Error fetching custom pages:', error);
  }

  const urls = (pages || []).map((page: any) => `
  <url>
    <loc>${BASE_URL}/p/${page.slug}</loc>
    <lastmod>${new Date(page.updated_at).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers });
}
