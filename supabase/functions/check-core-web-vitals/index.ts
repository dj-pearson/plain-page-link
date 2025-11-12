import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';

interface CWVRequest {
  url: string;
  device?: 'mobile' | 'desktop';
  saveResults?: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, device = 'mobile', saveResults = true }: CWVRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking Core Web Vitals for: ${url} (${device})`);
    const startTime = Date.now();

    // Get PageSpeed Insights API Key
    const PAGESPEED_API_KEY = Deno.env.get("PAGESPEED_INSIGHTS_API_KEY");
    if (!PAGESPEED_API_KEY) {
      throw new Error("PAGESPEED_INSIGHTS_API_KEY environment variable not set");
    }

    // Initialize Supabase client
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Call PageSpeed Insights API
    const strategy = device === 'mobile' ? 'mobile' : 'desktop';
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.append('url', url);
    apiUrl.searchParams.append('strategy', strategy);
    apiUrl.searchParams.append('key', PAGESPEED_API_KEY);
    apiUrl.searchParams.append('category', 'performance');

    console.log('Calling PageSpeed Insights API...');
    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PageSpeed API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const fetchTime = Date.now() - startTime;

    // Extract Core Web Vitals from the response
    const lighthouseResult = data.lighthouseResult;
    const audits = lighthouseResult?.audits || {};
    const categories = lighthouseResult?.categories || {};

    // Lab data (from Lighthouse)
    const lcp = audits['largest-contentful-paint']?.numericValue ?
                (audits['largest-contentful-paint'].numericValue / 1000) : null; // Convert to seconds
    const fid = audits['max-potential-fid']?.numericValue || null; // FID approximation
    const cls = audits['cumulative-layout-shift']?.numericValue || null;
    const fcp = audits['first-contentful-paint']?.numericValue ?
                (audits['first-contentful-paint'].numericValue / 1000) : null;
    const ttfb = audits['server-response-time']?.numericValue || null;
    const tti = audits['interactive']?.numericValue ?
                (audits['interactive'].numericValue / 1000) : null;
    const tbt = audits['total-blocking-time']?.numericValue || null;
    const si = audits['speed-index']?.numericValue ?
               (audits['speed-index'].numericValue / 1000) : null;

    // Performance score
    const performanceScore = categories.performance?.score ?
                             Math.round(categories.performance.score * 100) : null;

    // Determine pass/fail for Core Web Vitals
    // LCP: Good < 2.5s, Needs Improvement 2.5s-4s, Poor > 4s
    const lcpPass = lcp ? lcp <= 2.5 : null;

    // FID: Good < 100ms, Needs Improvement 100ms-300ms, Poor > 300ms
    const fidPass = fid ? fid <= 100 : null;

    // CLS: Good < 0.1, Needs Improvement 0.1-0.25, Poor > 0.25
    const clsPass = cls !== null ? cls <= 0.1 : null;

    // Determine overall category
    let overallCategory: 'FAST' | 'AVERAGE' | 'SLOW' = 'AVERAGE';
    if (lcpPass && fidPass && clsPass) {
      overallCategory = 'FAST';
    } else if (
      (lcp && lcp > 4) ||
      (fid && fid > 300) ||
      (cls !== null && cls > 0.25)
    ) {
      overallCategory = 'SLOW';
    }

    // Extract opportunities and diagnostics
    const opportunities = Object.values(audits)
      .filter((audit: any) => audit.details?.type === 'opportunity')
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        score: audit.score,
        numericValue: audit.numericValue,
        displayValue: audit.displayValue,
      }))
      .slice(0, 10); // Top 10 opportunities

    const diagnostics = Object.values(audits)
      .filter((audit: any) => audit.details?.type === 'debugdata' || audit.details?.type === 'table')
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        score: audit.score,
      }))
      .slice(0, 10);

    // Field data (Real User Metrics from CrUX if available)
    const loadingExperience = data.loadingExperience || {};
    const fieldData = {
      available: !!data.loadingExperience,
      metrics: loadingExperience.metrics || {},
      overallCategory: loadingExperience.overall_category || null,
    };

    const result = {
      url,
      device,
      lcp,
      fid,
      cls,
      fcp,
      ttfb,
      tti,
      tbt,
      si,
      performanceScore,
      overallCategory,
      lcpPass,
      fidPass,
      clsPass,
      labData: {
        lcp,
        fid,
        cls,
        fcp,
        ttfb,
        tti,
        tbt,
        si,
      },
      fieldData,
      opportunities,
      diagnostics,
      fetchTimeMs: fetchTime,
    };

    console.log(`Core Web Vitals check completed in ${fetchTime}ms`);
    console.log(`Performance Score: ${performanceScore}, LCP: ${lcp}s, FID: ${fid}ms, CLS: ${cls}`);

    // Save results to database
    if (saveResults) {
      const { error: insertError } = await supabase
        .from('seo_core_web_vitals')
        .insert({
          url,
          device,
          lcp,
          fid,
          cls,
          fcp,
          ttfb,
          tti,
          tbt,
          si,
          performance_score: performanceScore,
          overall_category: overallCategory,
          lcp_pass: lcpPass,
          fid_pass: fidPass,
          cls_pass: clsPass,
          lab_data: result.labData,
          field_data: fieldData,
          opportunities,
          diagnostics,
          data_source: 'pagespeed',
          fetch_time_ms: fetchTime,
        });

      if (insertError) {
        console.error('Error saving Core Web Vitals results:', insertError);
      } else {
        console.log('Core Web Vitals results saved to database');
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking Core Web Vitals:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
