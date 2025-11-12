import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

// Simple hash function for content comparison
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crawlSessionId, saveResults = true } = await req.json();

    if (!crawlSessionId) {
      return new Response(
        JSON.stringify({ error: 'crawlSessionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Detecting duplicate content for crawl session: ${crawlSessionId}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch crawl results for this session
    const { data: crawlResults, error } = await supabase
      .from('seo_crawl_results')
      .select('url, title, description, h1, word_count, content_hash')
      .eq('crawl_session_id', crawlSessionId);

    if (error) {
      throw new Error(`Failed to fetch crawl results: ${error.message}`);
    }

    if (!crawlResults || crawlResults.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No crawl results found for this session' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find duplicates by content hash
    const hashGroups = new Map<string, any[]>();
    const titleGroups = new Map<string, any[]>();
    const descriptionGroups = new Map<string, any[]>();
    const h1Groups = new Map<string, any[]>();

    for (const result of crawlResults) {
      // Group by content hash
      if (result.content_hash) {
        if (!hashGroups.has(result.content_hash)) {
          hashGroups.set(result.content_hash, []);
        }
        hashGroups.get(result.content_hash)!.push(result);
      }

      // Group by title
      if (result.title) {
        if (!titleGroups.has(result.title)) {
          titleGroups.set(result.title, []);
        }
        titleGroups.get(result.title)!.push(result);
      }

      // Group by description
      if (result.description) {
        if (!descriptionGroups.has(result.description)) {
          descriptionGroups.set(result.description, []);
        }
        descriptionGroups.get(result.description)!.push(result);
      }

      // Group by H1
      if (result.h1) {
        if (!h1Groups.has(result.h1)) {
          h1Groups.set(result.h1, []);
        }
        h1Groups.get(result.h1)!.push(result);
      }
    }

    // Find duplicates (groups with more than one URL)
    const duplicates = [];

    for (const [hash, urls] of hashGroups.entries()) {
      if (urls.length > 1) {
        const duplicate = {
          contentHash: hash,
          duplicateType: 'exact',
          urlCount: urls.length,
          urls: urls.map(u => ({ url: u.url, wordCount: u.word_count })),
          titleDuplicate: false,
          descriptionDuplicate: false,
          h1Duplicate: false,
          impactLevel: 'critical',
          similarityScore: 100,
        };

        if (saveResults) {
          await supabase
            .from('seo_duplicate_content')
            .insert({
              content_hash: hash,
              content_snippet: urls[0].title || '',
              urls: duplicate.urls,
              url_count: urls.length,
              similarity_score: 100,
              duplicate_type: 'exact',
              word_count: urls[0].word_count,
              title_duplicate: false,
              description_duplicate: false,
              h1_duplicate: false,
              impact_level: 'critical',
            });
        }

        duplicates.push(duplicate);
      }
    }

    // Check for title duplicates
    for (const [title, urls] of titleGroups.entries()) {
      if (urls.length > 1) {
        duplicates.push({
          type: 'title_duplicate',
          title,
          urlCount: urls.length,
          urls: urls.map(u => u.url),
          impactLevel: 'high',
        });
      }
    }

    // Check for description duplicates
    for (const [description, urls] of descriptionGroups.entries()) {
      if (urls.length > 1) {
        duplicates.push({
          type: 'description_duplicate',
          description: description.substring(0, 100),
          urlCount: urls.length,
          urls: urls.map(u => u.url),
          impactLevel: 'high',
        });
      }
    }

    // Check for H1 duplicates
    for (const [h1, urls] of h1Groups.entries()) {
      if (urls.length > 1) {
        duplicates.push({
          type: 'h1_duplicate',
          h1,
          urlCount: urls.length,
          urls: urls.map(u => u.url),
          impactLevel: 'medium',
        });
      }
    }

    const summary = {
      totalPages: crawlResults.length,
      exactDuplicates: Array.from(hashGroups.values()).filter(g => g.length > 1).length,
      titleDuplicates: Array.from(titleGroups.values()).filter(g => g.length > 1).length,
      descriptionDuplicates: Array.from(descriptionGroups.values()).filter(g => g.length > 1).length,
      h1Duplicates: Array.from(h1Groups.values()).filter(g => g.length > 1).length,
      totalIssues: duplicates.length,
    };

    console.log(`Duplicate content detection complete: ${summary.totalIssues} issues found`);

    return new Response(
      JSON.stringify({ success: true, summary, duplicates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting duplicate content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
