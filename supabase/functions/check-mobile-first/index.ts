import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
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

    console.log(`Checking mobile-first for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Check viewport meta tag
    const viewport = doc.querySelector('meta[name="viewport"]');
    const viewportContent = viewport?.getAttribute('content') || '';

    const analysis = {
      url,
      mobileFriendly: false,
      mobileScore: 0,
      hasViewportMeta: !!viewport,
      viewportContent,
      viewportWidth: '',
      touchTargetsSizedAppropriately: true,
      tapTargetIssues: 0,
      contentFitsViewport: true,
      horizontalScrollRequired: false,
      fontSizeLegible: true,
      issues: [] as any[],
      usabilityScore: 0,
      passedMobileFriendlyTest: false,
      usesResponsiveImages: false,
    };

    let score = 0;

    // Viewport check (30 points)
    if (analysis.hasViewportMeta) {
      score += 20;
      if (viewportContent.includes('width=device-width')) {
        score += 10;
        analysis.viewportWidth = 'device-width';
      } else {
        analysis.issues.push({
          type: 'viewport_width',
          severity: 'high',
          details: 'Viewport should include width=device-width',
        });
      }

      if (viewportContent.includes('initial-scale=1')) {
        score += 10;
      }

      if (viewportContent.includes('user-scalable=no')) {
        analysis.issues.push({
          type: 'viewport_scalable',
          severity: 'medium',
          details: 'Avoid user-scalable=no for accessibility',
        });
        score -= 5;
      }
    } else {
      analysis.issues.push({
        type: 'missing_viewport',
        severity: 'critical',
        details: 'Missing viewport meta tag',
      });
    }

    // Check for responsive images (10 points)
    const images = doc.querySelectorAll('img');
    let responsiveImages = 0;
    for (const img of images) {
      const element = img as any;
      if (element.hasAttribute('srcset') || element.hasAttribute('sizes')) {
        responsiveImages++;
      }
    }

    if (images.length > 0) {
      const responsiveRatio = responsiveImages / images.length;
      if (responsiveRatio > 0.8) {
        score += 10;
        analysis.usesResponsiveImages = true;
      } else if (responsiveRatio > 0.5) {
        score += 5;
      } else {
        analysis.issues.push({
          type: 'non_responsive_images',
          severity: 'medium',
          details: `Only ${Math.round(responsiveRatio * 100)}% of images are responsive`,
        });
      }
    }

    // Check font sizes (15 points)
    const bodyStyles = html.match(/font-size:\s*(\d+)px/);
    if (bodyStyles) {
      const fontSize = parseInt(bodyStyles[1]);
      if (fontSize >= 16) {
        score += 15;
      } else if (fontSize >= 14) {
        score += 10;
        analysis.issues.push({
          type: 'small_font',
          severity: 'medium',
          details: `Font size is ${fontSize}px, recommended minimum is 16px`,
        });
      } else {
        analysis.issues.push({
          type: 'text_too_small',
          severity: 'high',
          details: `Font size is ${fontSize}px, minimum recommended is 16px`,
        });
        analysis.fontSizeLegible = false;
      }
    } else {
      score += 10; // Assume default
    }

    // Check for mobile-specific CSS (10 points)
    const hasMediaQueries = html.includes('@media') || html.includes('media="');
    if (hasMediaQueries) {
      score += 10;
    } else {
      analysis.issues.push({
        type: 'no_media_queries',
        severity: 'medium',
        details: 'No responsive media queries detected',
      });
    }

    // Flash or other mobile-incompatible content (5 points)
    const hasFlash = html.toLowerCase().includes('flash') || html.includes('.swf');
    if (!hasFlash) {
      score += 5;
    } else {
      analysis.issues.push({
        type: 'flash_content',
        severity: 'critical',
        details: 'Flash content detected (not supported on mobile)',
      });
    }

    analysis.mobileScore = Math.min(100, score);
    analysis.mobileFriendly = score >= 70;
    analysis.passedMobileFriendlyTest = score >= 70;
    analysis.usabilityScore = score;

    console.log(`Mobile-first check complete: ${analysis.mobileFriendly ? 'PASSED' : 'FAILED'} (${analysis.mobileScore})`);

    if (saveResults) {
      await supabase
        .from('seo_mobile_analysis')
        .insert({
          url,
          mobile_friendly: analysis.mobileFriendly,
          mobile_score: analysis.mobileScore,
          has_viewport_meta: analysis.hasViewportMeta,
          viewport_content: viewportContent,
          viewport_width: analysis.viewportWidth,
          touch_targets_sized_appropriately: analysis.touchTargetsSizedAppropriately,
          tap_target_issues: analysis.tapTargetIssues,
          content_fits_viewport: analysis.contentFitsViewport,
          horizontal_scroll_required: analysis.horizontalScrollRequired,
          font_size_legible: analysis.fontSizeLegible,
          issues: analysis.issues,
          uses_responsive_images: analysis.usesResponsiveImages || false,
          usability_score: analysis.usabilityScore,
          passed_mobile_friendly_test: analysis.passedMobileFriendlyTest,
        });
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking mobile-first:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
