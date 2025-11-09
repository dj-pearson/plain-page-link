import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

/**
 * Generate comprehensive sitemap for AgentBio
 *
 * Includes:
 * - Homepage
 * - Main pages (pricing, blog, legal)
 * - Agent profiles
 * - Blog articles
 * - Custom pages
 *
 * POST endpoint expects:
 * {
 *   "baseUrl": "https://agentbio.net",
 *   "includeArticles": true,
 *   "includePages": true,
 *   "includeProfiles": true
 * }
 */
serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      baseUrl,
      includeArticles = true,
      includePages = true,
      includeProfiles = true
    } = await req.json();

    if (!baseUrl) {
      return new Response(
        JSON.stringify({ error: 'baseUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const urls = [];
    const now = new Date().toISOString().split('T')[0];

    // Add homepage
    urls.push({
      loc: baseUrl,
      changefreq: 'daily',
      priority: 1.0,
      lastmod: now,
    });

    // Add main pages
    const mainPages = [
      { slug: 'pricing', changefreq: 'weekly', priority: 0.9 },
      { slug: 'blog', changefreq: 'daily', priority: 0.9 },
      { slug: 'privacy', changefreq: 'monthly', priority: 0.5 },
      { slug: 'terms', changefreq: 'monthly', priority: 0.5 },
      { slug: 'dmca', changefreq: 'monthly', priority: 0.5 },
      { slug: 'acceptable-use', changefreq: 'monthly', priority: 0.5 },
    ];

    for (const page of mainPages) {
      urls.push({
        loc: `${baseUrl}/${page.slug}`,
        changefreq: page.changefreq,
        priority: page.priority,
        lastmod: now,
      });
    }

    // Add published agent profiles
    if (includeProfiles) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('username, updated_at, full_name')
        .eq('is_published', true)
        .not('username', 'is', null)
        .order('updated_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      } else if (profiles) {
        console.log(`Adding ${profiles.length} agent profiles to sitemap`);
        for (const profile of profiles) {
          urls.push({
            loc: `${baseUrl}/${profile.username}`,
            changefreq: 'weekly',
            priority: 0.7,
            lastmod: profile.updated_at ? profile.updated_at.split('T')[0] : now,
          });
        }
      }
    }

    // Add published articles
    if (includeArticles) {
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
      } else if (articles) {
        console.log(`Adding ${articles.length} blog articles to sitemap`);
        for (const article of articles) {
          urls.push({
            loc: `${baseUrl}/blog/${article.slug}`,
            changefreq: 'weekly',
            priority: 0.8,
            lastmod: article.updated_at ? article.updated_at.split('T')[0] : now,
          });
        }
      }
    }

    // Add custom pages
    if (includePages) {
      const { data: pages, error: pagesError } = await supabase
        .from('custom_pages')
        .select('slug, updated_at')
        .eq('published', true)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (pagesError) {
        console.error('Error fetching custom pages:', pagesError);
      } else if (pages) {
        console.log(`Adding ${pages.length} custom pages to sitemap`);
        for (const page of pages) {
          urls.push({
            loc: `${baseUrl}/p/${page.slug}`,
            changefreq: 'monthly',
            priority: 0.6,
            lastmod: page.updated_at ? page.updated_at.split('T')[0] : now,
          });
        }
      }
    }

    // Generate XML sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    console.log(`Generated sitemap with ${urls.length} URLs`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      },
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
