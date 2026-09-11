import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';
import { requireAuth } from '../_shared/auth.ts';
import { errorStatus } from '../_shared/http-error.ts';

/**
 * Analyze Internal Linking Structure
 * Analyzes internal links for SEO best practices
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, maxDepth = 2, saveResults = true } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing internal links for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Securely authenticate user with JWT verification
    let userId = null;
    try {
      const user = await requireAuth(req, supabase);
      userId = user.id;
    } catch (e) {
      console.error('Failed to authenticate user:', e);
    }

    const baseDomain = new URL(url).hostname;
    const baseOrigin = new URL(url).origin;

    // Fetch and analyze the page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract all links
    const linkElements = doc.querySelectorAll('a[href]');
    const internalLinks = new Map();
    const externalLinks = [];
    let brokenAnchors = 0;

    linkElements.forEach((link: any) => {
      const href = link.getAttribute('href') || '';
      const linkText = link.textContent?.trim() || '';
      const rel = link.getAttribute('rel') || '';
      const title = link.getAttribute('title') || '';

      try {
        let absoluteUrl: string;

        // Handle relative URLs
        if (href.startsWith('/')) {
          absoluteUrl = baseOrigin + href;
        } else if (href.startsWith('http')) {
          absoluteUrl = href;
        } else if (href.startsWith('#')) {
          // Skip anchor-only links
          return;
        } else {
          // Relative path
          absoluteUrl = new URL(href, url).href;
        }

        const linkUrl = new URL(absoluteUrl);

        if (linkUrl.hostname === baseDomain) {
          // Internal link
          if (!internalLinks.has(absoluteUrl)) {
            internalLinks.set(absoluteUrl, {
              url: absoluteUrl,
              count: 0,
              anchorTexts: [],
              hasTitle: !!title,
              rel,
            });
          }

          const linkData = internalLinks.get(absoluteUrl);
          linkData.count++;
          if (linkText && !linkData.anchorTexts.includes(linkText)) {
            linkData.anchorTexts.push(linkText);
          }
        } else {
          // External link
          externalLinks.push({
            url: absoluteUrl,
            anchorText: linkText,
            rel,
            hasNoFollow: rel.includes('nofollow'),
            hasTitle: !!title,
          });
        }
      } catch (e) {
        brokenAnchors++;
        console.error('Failed to parse link:', href, e);
      }
    });

    // Analyze internal link structure
    const internalLinksArray = Array.from(internalLinks.values());
    const totalInternalLinks = internalLinksArray.reduce((sum, link) => sum + link.count, 0);

    // Find orphan pages (pages with no internal links)
    const linkedPages = new Set(internalLinksArray.map(l => l.url));

    // Identify issues
    const issues = [];
    const recommendations = [];

    if (totalInternalLinks < 3) {
      issues.push('Very few internal links found');
      recommendations.push('Add more internal links to improve site structure and SEO');
    }

    // Check for descriptive anchor text
    let genericAnchorCount = 0;
    const genericTerms = ['click here', 'here', 'read more', 'more', 'link'];

    internalLinksArray.forEach(link => {
      link.anchorTexts.forEach(text => {
        if (genericTerms.some(term => text.toLowerCase() === term)) {
          genericAnchorCount++;
        }
      });
    });

    if (genericAnchorCount > 0) {
      issues.push(`${genericAnchorCount} links use generic anchor text`);
      recommendations.push('Use descriptive anchor text that describes the destination page');
    }

    // Check for over-optimization
    const mostLinkedPages = internalLinksArray
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const avgLinksPerPage = totalInternalLinks / internalLinksArray.length;
    if (avgLinksPerPage > 100) {
      recommendations.push('Some pages have too many links. Aim for under 100 links per page.');
    }

    // Analyze external links
    const externalCount = externalLinks.length;
    const externalWithNoFollow = externalLinks.filter(l => l.hasNoFollow).length;

    if (externalCount > totalInternalLinks) {
      recommendations.push('More external links than internal. Balance with more internal linking.');
    }

    const result = {
      url,
      totalInternalLinks,
      uniqueInternalPages: internalLinksArray.length,
      avgLinksPerPage: Math.round(avgLinksPerPage * 10) / 10,
      totalExternalLinks: externalCount,
      externalLinksWithNoFollow: externalWithNoFollow,
      mostLinkedPages: mostLinkedPages.map(p => ({
        url: p.url,
        linkCount: p.count,
        anchorTexts: p.anchorTexts,
      })),
      issues,
      recommendations,
      score: calculateLinkScore(internalLinksArray.length, totalInternalLinks, genericAnchorCount, externalCount),
    };

    // Save to database
    if (saveResults && userId) {
      const { error: insertError } = await supabase
        .from('seo_link_analysis')
        // US-201: six keys, five of which the table does not have. `url` is
        // page_url and is NOT NULL, so this insert could not have succeeded
        // even by accident — every analysis this function ran was discarded.
        //
        // The counts map onto the columns that already exist, and the issues
        // and recommendations go in as themselves: seo_link_analysis has
        // `issues` and `recommendations` jsonb columns, and storing
        // `issues.length` instead threw away the only part an operator can act
        // on. There is no column for unique internal pages or for who asked;
        // both are in the response `result` above, which is what the caller
        // reads.
        .insert({
          page_url: url,
          total_links: totalInternalLinks + externalCount,
          internal_links: totalInternalLinks,
          external_links: externalCount,
          external_nofollow_count: externalWithNoFollow,
          anchor_texts: mostLinkedPages.map((p) => ({
            url: p.url,
            linkCount: p.count,
            anchorTexts: p.anchorTexts,
          })),
          over_optimized_anchors: genericAnchorCount,
          quality_score: result.score,
          issues,
          recommendations,
        });

      if (insertError) {
        console.error('Error saving link analysis:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing internal links:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: errorStatus(error), headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateLinkScore(uniquePages: number, totalLinks: number, genericCount: number, externalCount: number): number {
  let score = 100;

  if (uniquePages < 5) score -= 20;
  if (totalLinks < 3) score -= 30;
  if (genericCount > 0) score -= genericCount * 5;
  if (externalCount > totalLinks) score -= 15;

  return Math.max(0, Math.min(100, score));
}
