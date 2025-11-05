import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, checkExternal = false, saveResults = true } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking broken links for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch the page
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const baseDomain = new URL(url).hostname;
    const linkElements = doc.querySelectorAll('a[href]');
    const brokenLinks = [];
    const workingLinks = [];
    const checked = new Set<string>();

    console.log(`Found ${linkElements.length} links to check`);

    for (const link of linkElements) {
      const href = link.getAttribute('href') || '';
      try {
        const absoluteUrl = new URL(href, url).toString();
        const linkDomain = new URL(absoluteUrl).hostname;

        // Skip if already checked
        if (checked.has(absoluteUrl)) continue;
        checked.add(absoluteUrl);

        // Skip external links if not checking them
        if (!checkExternal && linkDomain !== baseDomain) {
          continue;
        }

        // Check the link
        const linkResponse = await fetch(absoluteUrl, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)',
          },
        });

        const linkData = {
          url: absoluteUrl,
          anchorText: link.textContent?.trim() || '',
          statusCode: linkResponse.status,
          isExternal: linkDomain !== baseDomain,
          isBroken: !linkResponse.ok,
        };

        if (!linkResponse.ok) {
          brokenLinks.push(linkData);
        } else {
          workingLinks.push(linkData);
        }

      } catch (error) {
        brokenLinks.push({
          url: href,
          anchorText: link.textContent?.trim() || '',
          statusCode: 0,
          isExternal: false,
          isBroken: true,
          error: error.message,
        });
      }
    }

    const result = {
      url,
      totalLinks: linkElements.length,
      checkedLinks: checked.size,
      brokenLinks: brokenLinks.length,
      workingLinks: workingLinks.length,
      brokenLinksList: brokenLinks,
      checkExternal,
    };

    console.log(`Broken link check complete: ${brokenLinks.length} broken out of ${checked.size} checked`);

    // Save to link_analysis table
    if (saveResults) {
      await supabase
        .from('seo_link_analysis')
        .insert({
          page_url: url,
          total_links: linkElements.length,
          broken_links: brokenLinks.length,
          link_list: [...brokenLinks, ...workingLinks.slice(0, 50)],
          issues: brokenLinks.length > 0 ? [
            `Found ${brokenLinks.length} broken links`
          ] : [],
        });
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking broken links:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
