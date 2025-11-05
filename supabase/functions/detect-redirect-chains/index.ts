import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, saveResults = true } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Detecting redirect chains for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const redirectChain = [];
    let currentUrl = url;
    const visited = new Set<string>();
    const maxHops = 10; // Prevent infinite loops
    const startTime = Date.now();

    while (currentUrl && visited.size < maxHops) {
      if (visited.has(currentUrl)) {
        // Redirect loop detected
        redirectChain.push({
          url: currentUrl,
          status: 0,
          location: null,
          error: 'Redirect loop detected',
        });
        break;
      }

      visited.add(currentUrl);

      try {
        const hopStartTime = Date.now();
        const response = await fetch(currentUrl, {
          redirect: 'manual', // Don't follow redirects automatically
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; RedirectChecker/1.0)',
          },
        });

        const hopTime = Date.now() - hopStartTime;
        const status = response.status;
        const location = response.headers.get('location');

        redirectChain.push({
          url: currentUrl,
          status,
          location,
          hopTime,
        });

        // Check if this is a redirect
        if ([301, 302, 307, 308].includes(status) && location) {
          // Follow the redirect
          currentUrl = new URL(location, currentUrl).toString();
        } else {
          // No more redirects
          break;
        }

      } catch (error) {
        redirectChain.push({
          url: currentUrl,
          status: 0,
          location: null,
          error: error.message,
        });
        break;
      }
    }

    const finalUrl = redirectChain[redirectChain.length - 1]?.url || url;
    const totalTime = Date.now() - startTime;
    const chainLength = redirectChain.length - 1; // Exclude final destination
    const isChain = chainLength > 1;

    // Analyze issues
    const issues = [];
    let hasIssues = false;
    let priority = 'low';

    if (chainLength === 0) {
      // No redirects - this is good!
    } else if (chainLength === 1) {
      // Single redirect - acceptable
      const redirect = redirectChain[0];
      if (redirect.status === 302) {
        issues.push({
          type: 'temporary_redirect',
          severity: 'medium',
          details: 'Using 302 (temporary) instead of 301 (permanent)',
        });
        hasIssues = true;
        priority = 'medium';
      }
    } else if (chainLength > 1) {
      // Redirect chain - problematic
      issues.push({
        type: 'redirect_chain',
        severity: 'high',
        details: `${chainLength} redirects in chain`,
      });
      hasIssues = true;
      priority = 'high';
    }

    // Check for mixed redirect types
    const redirectTypes = redirectChain
      .filter(r => [301, 302, 307, 308].includes(r.status))
      .map(r => r.status);

    if (new Set(redirectTypes).size > 1) {
      issues.push({
        type: 'mixed_redirects',
        severity: 'medium',
        details: 'Mix of permanent and temporary redirects',
      });
      hasIssues = true;
    }

    // Check for redirect loop
    if (redirectChain.some(r => r.error === 'Redirect loop detected')) {
      issues.push({
        type: 'redirect_loop',
        severity: 'critical',
        details: 'Infinite redirect loop detected',
      });
      hasIssues = true;
      priority = 'critical';
    }

    const analysis = {
      sourceUrl: url,
      finalUrl,
      redirectChain,
      chainLength,
      isChain,
      isPermanent: redirectChain[0]?.status === 301 || redirectChain[0]?.status === 308,
      totalTimeMs: totalTime,
      timePerHopMs: Math.round(totalTime / Math.max(1, chainLength)),
      hasIssues,
      issues,
      priority,
      recommendedAction: getRecommendedAction(chainLength, issues),
    };

    console.log(`Redirect chain detection complete: ${chainLength} hops, ${issues.length} issues`);

    if (saveResults) {
      await supabase
        .from('seo_redirect_analysis')
        .insert({
          source_url: url,
          final_url: finalUrl,
          redirect_chain: redirectChain,
          chain_length: chainLength,
          redirect_type: redirectChain[0]?.status || null,
          is_permanent: analysis.isPermanent,
          is_chain: isChain,
          total_time_ms: totalTime,
          time_per_hop_ms: analysis.timePerHopMs,
          has_issues: hasIssues,
          issues,
          recommended_action: analysis.recommendedAction,
          priority,
          status: 'active',
        });
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error detecting redirect chains:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getRecommendedAction(chainLength: number, issues: any[]): string {
  if (chainLength === 0) {
    return 'No action needed - no redirects';
  }

  if (chainLength === 1) {
    const hasTemporary = issues.some(i => i.type === 'temporary_redirect');
    if (hasTemporary) {
      return 'Change 302 to 301 if this is a permanent redirect';
    }
    return 'Single redirect is acceptable';
  }

  if (issues.some(i => i.type === 'redirect_loop')) {
    return 'CRITICAL: Fix redirect loop immediately';
  }

  return `Consolidate redirect chain - update source to point directly to final destination`;
}
