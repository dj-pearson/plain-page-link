import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';

/**
 * Fetch Core Web Vitals from Google Search Console
 * Gets real user metrics from Chrome User Experience Report (CrUX) data
 */

interface CWVRequest {
  propertyUrl?: string;
  saveResults?: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      propertyUrl,
      saveResults = true,
    }: CWVRequest = await req.json();

    // Initialize Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get user ID from JWT
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

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching Core Web Vitals from GSC for user: ${userId}`);

    // Get OAuth credentials
    const { data: credentials, error: credError } = await supabase
      .from('gsc_oauth_credentials')
      .select('access_token, expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({
          error: 'Google Search Console not connected',
          needsAuth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token expiration
    if (new Date(credentials.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: 'Access token expired. Please re-authenticate.',
          needsAuth: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get property URL if not provided
    let siteUrl = propertyUrl;
    if (!siteUrl) {
      const { data: property } = await supabase
        .from('gsc_properties')
        .select('property_url')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .limit(1)
        .maybeSingle();

      if (!property) {
        return new Response(
          JSON.stringify({ error: 'No verified GSC property found' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      siteUrl = property.property_url;
    }

    console.log(`Fetching CWV data for: ${siteUrl}`);

    // Note: GSC doesn't have a direct Core Web Vitals API endpoint
    // We need to use the CrUX API instead, which requires a different API key
    // For now, we'll fetch from the CrUX API using the Chrome UX Report API

    const CHROME_UX_API_KEY = Deno.env.get("CHROME_UX_API_KEY") || Deno.env.get("PAGESPEED_INSIGHTS_API_KEY");

    if (!CHROME_UX_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Chrome UX Report API key not configured',
          message: 'Please set CHROME_UX_API_KEY or use the existing PAGESPEED_INSIGHTS_API_KEY'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up the URL for CrUX API (remove protocol)
    const cleanUrl = siteUrl.replace(/^https?:\/\//, '');

    // Fetch from Chrome UX Report API
    const cruxResponse = await fetch(
      `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${CHROME_UX_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: `https://${cleanUrl}`,
          formFactor: 'PHONE', // Can be PHONE, DESKTOP, or TABLET
        }),
      }
    );

    if (!cruxResponse.ok) {
      const errorText = await cruxResponse.text();
      console.error('CrUX API error:', errorText);

      // If no data available, return empty result
      if (cruxResponse.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'No Core Web Vitals data available for this origin yet',
            hasData: false,
            url: siteUrl,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`CrUX API error: ${cruxResponse.status}`);
    }

    const cruxData = await cruxResponse.json();
    const metrics = cruxData.record.metrics;

    // Extract Core Web Vitals
    const lcp = metrics.largest_contentful_paint;
    const fid = metrics.first_input_delay;
    const cls = metrics.cumulative_layout_shift;
    const fcp = metrics.first_contentful_paint;
    const ttfb = metrics.experimental_time_to_first_byte;
    const inp = metrics.interaction_to_next_paint;

    // Determine pass/fail based on Google thresholds
    const lcpValue = lcp?.percentiles?.p75 || 0;
    const fidValue = fid?.percentiles?.p75 || 0;
    const clsValue = cls?.percentiles?.p75 || 0;

    const result = {
      url: siteUrl,
      device: 'mobile',
      collectionPeriod: cruxData.record.collectionPeriod,
      lcp: {
        value: lcpValue,
        category: getLCPCategory(lcpValue),
        passed: lcpValue <= 2500,
        percentiles: lcp?.percentiles,
      },
      fid: {
        value: fidValue,
        category: getFIDCategory(fidValue),
        passed: fidValue <= 100,
        percentiles: fid?.percentiles,
      },
      cls: {
        value: clsValue,
        category: getCLSCategory(clsValue),
        passed: clsValue <= 0.1,
        percentiles: cls?.percentiles,
      },
      fcp: fcp?.percentiles?.p75,
      ttfb: ttfb?.percentiles?.p75,
      inp: inp?.percentiles?.p75,
      overallPassed: lcpValue <= 2500 && fidValue <= 100 && clsValue <= 0.1,
    };

    // Save to database if requested
    if (saveResults) {
      const { error: insertError } = await supabase
        .from('seo_core_web_vitals')
        .insert({
          url: siteUrl,
          device: 'mobile',
          lcp_value: lcpValue,
          lcp_passed: lcpValue <= 2500,
          fid_value: fidValue,
          fid_passed: fidValue <= 100,
          cls_value: clsValue,
          cls_passed: clsValue <= 0.1,
          fcp_value: fcp?.percentiles?.p75,
          ttfb_value: ttfb?.percentiles?.p75,
          inp_value: inp?.percentiles?.p75,
          collection_period_start: cruxData.record.collectionPeriod.firstDate.year + '-' +
            String(cruxData.record.collectionPeriod.firstDate.month).padStart(2, '0') + '-' +
            String(cruxData.record.collectionPeriod.firstDate.day).padStart(2, '0'),
          collection_period_end: cruxData.record.collectionPeriod.lastDate.year + '-' +
            String(cruxData.record.collectionPeriod.lastDate.month).padStart(2, '0') + '-' +
            String(cruxData.record.collectionPeriod.lastDate.day).padStart(2, '0'),
          checked_by: userId,
        });

      if (insertError) {
        console.error('Error saving CWV data:', insertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        hasData: true,
        result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching Core Web Vitals from GSC:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions for categorizing metrics
function getLCPCategory(value: number): string {
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
}

function getFIDCategory(value: number): string {
  if (value <= 100) return 'good';
  if (value <= 300) return 'needs-improvement';
  return 'poor';
}

function getCLSCategory(value: number): string {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
}
