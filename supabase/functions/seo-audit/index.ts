import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AuditRequest {
  url: string;
  auditType?: 'full' | 'quick' | 'technical' | 'content' | 'performance';
  saveResults?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, auditType = 'full', saveResults = true }: AuditRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting ${auditType} SEO audit for: ${url}`);
    const startTime = Date.now();

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
    }

    // Fetch the page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEO-Audit-Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();

    // Parse HTML (basic parsing - in production, use a proper HTML parser)
    const audit = {
      url,
      auditType,
      overallScore: 0,
      performanceScore: 0,
      seoScore: 0,
      accessibilityScore: 0,
      bestPracticesScore: 0,

      // Meta tags
      hasTitle: false,
      titleLength: 0,
      hasDescription: false,
      descriptionLength: 0,
      hasKeywords: false,
      hasCanonical: false,
      hasOgTags: false,
      hasTwitterCards: false,

      // Technical SEO
      hasRobotsTxt: false,
      hasSitemap: false,
      hasSsl: url.startsWith('https://'),
      hasFavicon: false,
      mobileFriendly: false,
      pageLoadTime: 0,

      // Content
      wordCount: 0,
      headingStructure: {} as Record<string, number>,
      internalLinksCount: 0,
      externalLinksCount: 0,
      brokenLinksCount: 0,
      imagesCount: 0,
      imagesWithAltCount: 0,

      // Issues
      criticalIssues: [] as string[],
      warnings: [] as string[],
      recommendations: [] as string[],
      rawAuditData: {},
    };

    // === META TAGS ANALYSIS ===
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      audit.hasTitle = true;
      audit.titleLength = titleMatch[1].length;
      if (audit.titleLength < 30) {
        audit.warnings.push('Title tag is too short (< 30 characters)');
      } else if (audit.titleLength > 60) {
        audit.warnings.push('Title tag is too long (> 60 characters)');
      }
    } else {
      audit.criticalIssues.push('Missing title tag');
    }

    const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descriptionMatch) {
      audit.hasDescription = true;
      audit.descriptionLength = descriptionMatch[1].length;
      if (audit.descriptionLength < 120) {
        audit.warnings.push('Meta description is too short (< 120 characters)');
      } else if (audit.descriptionLength > 160) {
        audit.warnings.push('Meta description is too long (> 160 characters)');
      }
    } else {
      audit.criticalIssues.push('Missing meta description');
    }

    audit.hasKeywords = /<meta[^>]*name=["']keywords["']/i.test(html);
    audit.hasCanonical = /<link[^>]*rel=["']canonical["']/i.test(html);
    audit.hasOgTags = /<meta[^>]*property=["']og:/i.test(html);
    audit.hasTwitterCards = /<meta[^>]*name=["']twitter:/i.test(html);

    if (!audit.hasOgTags) {
      audit.recommendations.push('Add Open Graph meta tags for better social media sharing');
    }
    if (!audit.hasTwitterCards) {
      audit.recommendations.push('Add Twitter Card meta tags for better Twitter sharing');
    }

    // === HEADING STRUCTURE ===
    const h1Matches = html.match(/<h1[^>]*>/gi);
    const h2Matches = html.match(/<h2[^>]*>/gi);
    const h3Matches = html.match(/<h3[^>]*>/gi);
    const h4Matches = html.match(/<h4[^>]*>/gi);
    const h5Matches = html.match(/<h5[^>]*>/gi);
    const h6Matches = html.match(/<h6[^>]*>/gi);

    audit.headingStructure = {
      h1: h1Matches?.length || 0,
      h2: h2Matches?.length || 0,
      h3: h3Matches?.length || 0,
      h4: h4Matches?.length || 0,
      h5: h5Matches?.length || 0,
      h6: h6Matches?.length || 0,
    };

    if (audit.headingStructure.h1 === 0) {
      audit.criticalIssues.push('Missing H1 heading');
    } else if (audit.headingStructure.h1 > 1) {
      audit.warnings.push('Multiple H1 headings found (should have only one)');
    }

    // === IMAGES ANALYSIS ===
    const imageMatches = html.match(/<img[^>]*>/gi);
    audit.imagesCount = imageMatches?.length || 0;

    if (imageMatches) {
      for (const img of imageMatches) {
        if (/alt=["'][^"']*["']/i.test(img) && !/alt=["']\s*["']/i.test(img)) {
          audit.imagesWithAltCount++;
        }
      }
    }

    if (audit.imagesCount > 0 && audit.imagesWithAltCount < audit.imagesCount) {
      audit.warnings.push(`${audit.imagesCount - audit.imagesWithAltCount} images missing alt text`);
    }

    // === LINKS ANALYSIS ===
    const linkMatches = html.match(/<a[^>]*href=["']([^"']+)["'][^>]*>/gi);
    if (linkMatches) {
      const currentDomain = new URL(url).hostname;
      for (const link of linkMatches) {
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          const href = hrefMatch[1];
          try {
            const linkUrl = new URL(href, url);
            if (linkUrl.hostname === currentDomain) {
              audit.internalLinksCount++;
            } else {
              audit.externalLinksCount++;
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }
      }
    }

    // === CONTENT ANALYSIS ===
    // Strip HTML tags and count words
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                            .replace(/<[^>]+>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim();
    audit.wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;

    if (audit.wordCount < 300) {
      audit.warnings.push('Content is thin (< 300 words)');
    }

    // === TECHNICAL CHECKS ===
    audit.hasFavicon = /<link[^>]*rel=["'](?:shortcut )?icon["']/i.test(html);
    audit.mobileFriendly = /<meta[^>]*name=["']viewport["']/i.test(html);

    if (!audit.mobileFriendly) {
      audit.criticalIssues.push('Missing viewport meta tag (not mobile-friendly)');
    }

    // Check robots.txt and sitemap
    try {
      const robotsUrl = new URL('/robots.txt', url).toString();
      const robotsResponse = await fetch(robotsUrl);
      audit.hasRobotsTxt = robotsResponse.ok;
    } catch (e) {
      audit.hasRobotsTxt = false;
    }

    try {
      const sitemapUrl = new URL('/sitemap.xml', url).toString();
      const sitemapResponse = await fetch(sitemapUrl);
      audit.hasSitemap = sitemapResponse.ok;
    } catch (e) {
      audit.hasSitemap = false;
    }

    if (!audit.hasRobotsTxt) {
      audit.recommendations.push('Create a robots.txt file');
    }
    if (!audit.hasSitemap) {
      audit.recommendations.push('Create an XML sitemap');
    }

    // === CALCULATE SCORES ===
    let seoPoints = 0;
    const maxSeoPoints = 15;

    if (audit.hasTitle) seoPoints++;
    if (audit.titleLength >= 30 && audit.titleLength <= 60) seoPoints++;
    if (audit.hasDescription) seoPoints++;
    if (audit.descriptionLength >= 120 && audit.descriptionLength <= 160) seoPoints++;
    if (audit.hasCanonical) seoPoints++;
    if (audit.hasOgTags) seoPoints++;
    if (audit.hasTwitterCards) seoPoints++;
    if (audit.headingStructure.h1 === 1) seoPoints++;
    if (audit.wordCount >= 300) seoPoints++;
    if (audit.imagesCount === audit.imagesWithAltCount) seoPoints++;
    if (audit.internalLinksCount > 0) seoPoints++;
    if (audit.mobileFriendly) seoPoints++;
    if (audit.hasSsl) seoPoints++;
    if (audit.hasRobotsTxt) seoPoints++;
    if (audit.hasSitemap) seoPoints++;

    audit.seoScore = Math.round((seoPoints / maxSeoPoints) * 100);
    audit.performanceScore = audit.hasSsl ? 80 : 60; // Placeholder
    audit.accessibilityScore = audit.imagesCount > 0 ? Math.round((audit.imagesWithAltCount / audit.imagesCount) * 100) : 100;
    audit.bestPracticesScore = audit.hasSsl && audit.mobileFriendly ? 90 : 70;

    audit.overallScore = Math.round(
      (audit.seoScore * 0.4) +
      (audit.performanceScore * 0.2) +
      (audit.accessibilityScore * 0.2) +
      (audit.bestPracticesScore * 0.2)
    );

    audit.pageLoadTime = Date.now() - startTime;
    audit.rawAuditData = {
      fetchTime: audit.pageLoadTime,
      htmlSize: html.length,
      responseStatus: response.status,
    };

    console.log(`Audit completed in ${audit.pageLoadTime}ms. Overall score: ${audit.overallScore}`);

    // Save results to database
    if (saveResults) {
      const { error: insertError } = await supabase
        .from('seo_audit_history')
        .insert({
          url: audit.url,
          audit_type: audit.auditType,
          overall_score: audit.overallScore,
          performance_score: audit.performanceScore,
          seo_score: audit.seoScore,
          accessibility_score: audit.accessibilityScore,
          best_practices_score: audit.bestPracticesScore,
          has_title: audit.hasTitle,
          title_length: audit.titleLength,
          has_description: audit.hasDescription,
          description_length: audit.descriptionLength,
          has_keywords: audit.hasKeywords,
          has_canonical: audit.hasCanonical,
          has_og_tags: audit.hasOgTags,
          has_twitter_cards: audit.hasTwitterCards,
          has_robots_txt: audit.hasRobotsTxt,
          has_sitemap: audit.hasSitemap,
          has_ssl: audit.hasSsl,
          has_favicon: audit.hasFavicon,
          mobile_friendly: audit.mobileFriendly,
          page_load_time: audit.pageLoadTime,
          word_count: audit.wordCount,
          heading_structure: audit.headingStructure,
          internal_links_count: audit.internalLinksCount,
          external_links_count: audit.externalLinksCount,
          broken_links_count: audit.brokenLinksCount,
          images_count: audit.imagesCount,
          images_with_alt_count: audit.imagesWithAltCount,
          critical_issues: audit.criticalIssues,
          warnings: audit.warnings,
          recommendations: audit.recommendations,
          raw_audit_data: audit.rawAuditData,
          audit_duration_ms: audit.pageLoadTime,
          performed_by: userId,
        });

      if (insertError) {
        console.error('Error saving audit results:', insertError);
      } else {
        console.log('Audit results saved to database');
      }
    }

    return new Response(
      JSON.stringify({ success: true, audit }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in SEO audit:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
