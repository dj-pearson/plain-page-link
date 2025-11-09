import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';

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

    console.log(`Analyzing images for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const imageElements = doc.querySelectorAll('img');
    const imageAnalysis = [];
    const issues = [];

    console.log(`Found ${imageElements.length} images to analyze`);

    for (const img of imageElements) {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      const title = img.getAttribute('title') || '';
      const width = img.getAttribute('width');
      const height = img.getAttribute('height');
      const loading = img.getAttribute('loading');

      try {
        const imageSrc = new URL(src, url).toString();
        const fileName = imageSrc.split('/').pop() || '';
        const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

        // Try to fetch image to get size
        let fileSize = 0;
        try {
          const imgResponse = await fetch(imageSrc, { method: 'HEAD' });
          const contentLength = imgResponse.headers.get('content-length');
          if (contentLength) {
            fileSize = Math.round(parseInt(contentLength) / 1024); // KB
          }
        } catch (e) {
          console.error(`Failed to fetch image size for ${imageSrc}:`, e);
        }

        const analysis = {
          url,
          pageSrc: url,
          imageSrc,
          fileName,
          fileFormat: fileExt,
          fileSizeKb: fileSize,
          width: width ? parseInt(width) : null,
          height: height ? parseInt(height) : null,
          altText: alt,
          altTextLength: alt.length,
          titleAttribute: title,
          hasAlt: alt.length > 0,
          hasTitle: title.length > 0,
          isLazyLoaded: loading === 'lazy',
          supportLazyLoading: true,
          optimizationScore: 0,
          issues: [] as string[],
        };

        // Calculate optimization score and identify issues
        let score = 100;

        if (!analysis.hasAlt) {
          analysis.issues.push('Missing alt text');
          score -= 30;
        } else if (analysis.altTextLength < 5) {
          analysis.issues.push('Alt text too short');
          score -= 10;
        }

        if (fileSize > 100) {
          analysis.issues.push(`Large file size (${fileSize}KB, recommend < 100KB)`);
          score -= 20;
        }

        if (fileSize > 500) {
          analysis.issues.push('Critical: File size exceeds 500KB');
          score -= 30;
        }

        if (!['webp', 'avif', 'svg'].includes(fileExt) && ['jpg', 'jpeg', 'png'].includes(fileExt)) {
          analysis.issues.push(`Consider modern format (WebP/AVIF) instead of ${fileExt.toUpperCase()}`);
          score -= 10;
        }

        if (!analysis.isLazyLoaded) {
          analysis.issues.push('Not using lazy loading');
          score -= 10;
        }

        if (!width || !height) {
          analysis.issues.push('Missing width/height attributes (can cause CLS)');
          score -= 10;
        }

        analysis.optimizationScore = Math.max(0, score);
        analysis.isOptimized = score >= 70;

        imageAnalysis.push(analysis);

        // Save individual image analysis
        if (saveResults) {
          await supabase
            .from('seo_image_analysis')
            .insert({
              url,
              page_url: url,
              image_src: imageSrc,
              file_name: fileName,
              file_size_kb: fileSize,
              file_format: fileExt,
              width: analysis.width,
              height: analysis.height,
              alt_text: alt,
              alt_text_length: alt.length,
              title_attribute: title,
              has_alt: analysis.hasAlt,
              has_title: analysis.hasTitle,
              is_optimized: analysis.isOptimized,
              optimization_score: analysis.optimizationScore,
              supports_lazy_loading: true,
              is_lazy_loaded: analysis.isLazyLoaded,
              issues: analysis.issues,
            });
        }

      } catch (error) {
        console.error(`Error analyzing image ${src}:`, error);
      }
    }

    const summary = {
      totalImages: imageElements.length,
      imagesWithAlt: imageAnalysis.filter(i => i.hasAlt).length,
      imagesMissingAlt: imageAnalysis.filter(i => !i.hasAlt).length,
      largeImages: imageAnalysis.filter(i => i.fileSizeKb && i.fileSizeKb > 100).length,
      optimizedImages: imageAnalysis.filter(i => i.isOptimized).length,
      averageScore: Math.round(
        imageAnalysis.reduce((sum, i) => sum + i.optimizationScore, 0) / imageAnalysis.length
      ),
    };

    console.log(`Image analysis complete: ${summary.optimizedImages}/${summary.totalImages} optimized`);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        images: imageAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing images:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
