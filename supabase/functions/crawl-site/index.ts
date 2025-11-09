import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

interface CrawlRequest {
  startUrl: string;
  maxPages?: number;
  maxDepth?: number;
  followExternal?: boolean;
  saveResults?: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      startUrl,
      maxPages = 50,
      maxDepth = 3,
      followExternal = false,
      saveResults = true
    }: CrawlRequest = await req.json();

    if (!startUrl) {
      return new Response(
        JSON.stringify({ error: 'startUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting crawl from: ${startUrl}`);
    console.log(`Max pages: ${maxPages}, Max depth: ${maxDepth}`);

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const crawlSessionId = crypto.randomUUID();
    const baseDomain = new URL(startUrl).hostname;

    const visited = new Set<string>();
    const toVisit: { url: string; depth: number; parentUrl?: string }[] = [
      { url: startUrl, depth: 0 }
    ];
    const crawlResults = [];

    while (toVisit.length > 0 && visited.size < maxPages) {
      const current = toVisit.shift()!;

      if (visited.has(current.url)) continue;
      if (current.depth > maxDepth) continue;

      visited.add(current.url);
      console.log(`Crawling [${visited.size}/${maxPages}]: ${current.url} (depth: ${current.depth})`);

      try {
        const startTime = Date.now();
        const response = await fetch(current.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEO-Crawler-Bot/1.0)',
          },
        });
        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          crawlResults.push({
            url: current.url,
            parentUrl: current.parentUrl,
            statusCode: response.status,
            responseTimeMs: responseTime,
            crawlDepth: current.depth,
            issues: [`HTTP ${response.status}: ${response.statusText}`],
          });
          continue;
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          console.log(`Skipping non-HTML content: ${contentType}`);
          continue;
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        if (!doc) {
          console.error(`Failed to parse HTML for: ${current.url}`);
          continue;
        }

        // Extract metadata
        const title = doc.querySelector('title')?.textContent || '';
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
        const h1Elements = doc.querySelectorAll('h1');
        const h1 = h1Elements[0]?.textContent || '';

        // Extract links
        const linkElements = doc.querySelectorAll('a[href]');
        const linksFound = [];
        const internalLinks = new Set<string>();
        const externalLinks = new Set<string>();

        for (const link of linkElements) {
          try {
            const href = link.getAttribute('href') || '';
            const absoluteUrl = new URL(href, current.url).toString();
            const linkDomain = new URL(absoluteUrl).hostname;

            linksFound.push({
              url: absoluteUrl,
              text: link.textContent?.trim() || '',
              rel: link.getAttribute('rel') || '',
            });

            if (linkDomain === baseDomain) {
              internalLinks.add(absoluteUrl);
              // Add to crawl queue if not visited
              if (!visited.has(absoluteUrl) && current.depth < maxDepth) {
                toVisit.push({
                  url: absoluteUrl,
                  depth: current.depth + 1,
                  parentUrl: current.url,
                });
              }
            } else {
              externalLinks.add(absoluteUrl);
              if (followExternal && current.depth < maxDepth) {
                toVisit.push({
                  url: absoluteUrl,
                  depth: current.depth + 1,
                  parentUrl: current.url,
                });
              }
            }
          } catch (e) {
            // Invalid URL, skip
          }
        }

        // Extract images
        const imageElements = doc.querySelectorAll('img');
        const imagesData = [];
        let imagesWithoutAlt = 0;

        for (const img of imageElements) {
          const src = img.getAttribute('src') || '';
          const alt = img.getAttribute('alt') || '';
          if (!alt || alt.trim() === '') {
            imagesWithoutAlt++;
          }
          imagesData.push({
            src: new URL(src, current.url).toString(),
            alt,
            width: img.getAttribute('width'),
            height: img.getAttribute('height'),
          });
        }

        // Check for technical SEO elements
        const hasRobotsMeta = !!doc.querySelector('meta[name="robots"]');
        const robotsContent = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        const hasViewport = !!doc.querySelector('meta[name="viewport"]');
        const hasSchema = html.includes('application/ld+json');

        // Extract schema types
        const schemaTypes: string[] = [];
        if (hasSchema) {
          const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
          for (const script of scripts) {
            try {
              const json = JSON.parse(script.textContent || '{}');
              if (json['@type']) {
                schemaTypes.push(json['@type']);
              }
            } catch (e) {
              // Invalid JSON, skip
            }
          }
        }

        // Content analysis
        const textContent = doc.body?.textContent || '';
        const wordCount = textContent.trim().split(/\s+/).filter(w => w.length > 0).length;

        // Check for issues
        const issues = [];
        if (!title) issues.push('Missing title');
        if (title.length > 60) issues.push('Title too long');
        if (!description) issues.push('Missing meta description');
        if (h1Elements.length === 0) issues.push('Missing H1');
        if (h1Elements.length > 1) issues.push('Multiple H1 tags');
        if (imagesWithoutAlt > 0) issues.push(`${imagesWithoutAlt} images missing alt text`);
        if (!hasViewport) issues.push('Missing viewport meta tag');
        if (wordCount < 300) issues.push('Thin content (< 300 words)');

        const result = {
          crawlSessionId,
          url: current.url,
          parentUrl: current.parentUrl,
          statusCode: response.status,
          responseTimeMs: responseTime,
          title,
          titleLength: title.length,
          description,
          descriptionLength: description.length,
          canonicalUrl: canonical,
          h1,
          h1Count: h1Elements.length,
          wordCount,
          internalLinksCount: internalLinks.size,
          externalLinksCount: externalLinks.size,
          linksFound,
          imagesCount: imageElements.length,
          imagesWithoutAlt,
          imagesData: imagesData.slice(0, 10), // Limit to first 10 images
          hasRobotsMeta,
          robotsContent,
          hasCanonical: !!canonical,
          hasViewport,
          hasSchema,
          schemaTypes,
          pageSizeKb: Math.round(html.length / 1024),
          loadTimeMs: responseTime,
          resourcesCount: linkElements.length + imageElements.length,
          issues,
          crawlDepth: current.depth,
          isIndexable: !robotsContent.includes('noindex'),
          isCrawlable: !robotsContent.includes('nofollow'),
        };

        crawlResults.push(result);

        // Save to database
        if (saveResults) {
          const { error: insertError } = await supabase
            .from('seo_crawl_results')
            .insert({
              crawl_session_id: result.crawlSessionId,
              url: result.url,
              parent_url: result.parentUrl,
              status_code: result.statusCode,
              response_time_ms: result.responseTimeMs,
              title: result.title,
              title_length: result.titleLength,
              description: result.description,
              description_length: result.descriptionLength,
              canonical_url: result.canonicalUrl,
              h1: result.h1,
              h1_count: result.h1Count,
              word_count: result.wordCount,
              internal_links: result.internalLinksCount,
              external_links: result.externalLinksCount,
              links_found: result.linksFound,
              images_count: result.imagesCount,
              images_without_alt: result.imagesWithoutAlt,
              images_data: result.imagesData,
              has_robots_meta: result.hasRobotsMeta,
              robots_content: result.robotsContent,
              has_canonical: result.hasCanonical,
              has_viewport: result.hasViewport,
              has_schema: result.hasSchema,
              schema_types: result.schemaTypes,
              page_size_kb: result.pageSizeKb,
              load_time_ms: result.loadTimeMs,
              resources_count: result.resourcesCount,
              issues: result.issues,
              crawl_depth: result.crawlDepth,
              is_indexable: result.isIndexable,
              is_crawlable: result.isCrawlable,
            });

          if (insertError) {
            console.error('Error saving crawl result:', insertError);
          }
        }

      } catch (error) {
        console.error(`Error crawling ${current.url}:`, error);
        crawlResults.push({
          url: current.url,
          parentUrl: current.parentUrl,
          statusCode: 0,
          responseTimeMs: 0,
          crawlDepth: current.depth,
          issues: [`Crawl error: ${error.message}`],
        });
      }
    }

    const summary = {
      crawlSessionId,
      pagesFound: visited.size,
      pagesCrawled: crawlResults.length,
      maxPagesReached: visited.size >= maxPages,
      issues: crawlResults.reduce((sum, r) => sum + (r.issues?.length || 0), 0),
    };

    console.log(`Crawl complete. Crawled ${summary.pagesCrawled} pages.`);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results: crawlResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in site crawl:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
