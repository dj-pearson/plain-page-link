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

    console.log(`Validating structured data for: ${url}`);

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

    // Find all JSON-LD scripts
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    const schemas = [];
    const schemaTypes = new Set<string>();
    const validationErrors = [];
    const validationWarnings = [];

    for (const script of jsonLdScripts) {
      try {
        const json = JSON.parse(script.textContent || '{}');
        const type = json['@type'] || (Array.isArray(json['@graph']) ? 'Graph' : 'Unknown');

        // Handle @graph (multiple schemas in one)
        if (json['@graph']) {
          for (const item of json['@graph']) {
            if (item['@type']) {
              schemaTypes.add(item['@type']);
              schemas.push({
                type: item['@type'],
                valid: true,
                data: item,
              });
            }
          }
        } else if (type !== 'Unknown') {
          schemaTypes.add(type);

          // Basic validation based on type
          const requiredFields = getRequiredFields(type);
          const missingFields = requiredFields.filter(field => !json[field]);

          if (missingFields.length > 0) {
            validationErrors.push({
              type,
              error: `Missing required fields: ${missingFields.join(', ')}`,
            });
          }

          schemas.push({
            type,
            valid: missingFields.length === 0,
            requiredFields,
            missingFields,
            data: json,
          });
        }
      } catch (error) {
        validationErrors.push({
          error: `Invalid JSON-LD: ${error.message}`,
        });
      }
    }

    // Check for microdata
    const itemscopes = doc.querySelectorAll('[itemscope]');
    if (itemscopes.length > 0) {
      validationWarnings.push('Microdata found - consider converting to JSON-LD');
    }

    // Determine rich result eligibility
    const richResultTypes = [];
    const eligibleTypes = ['Article', 'Product', 'Recipe', 'Event', 'FAQ', 'HowTo', 'JobPosting', 'Review'];

    for (const type of schemaTypes) {
      if (eligibleTypes.includes(type)) {
        richResultTypes.push(type);
      }
    }

    const analysis = {
      url,
      hasStructuredData: schemas.length > 0,
      schemaTypes: Array.from(schemaTypes),
      schemas,
      isValid: validationErrors.length === 0,
      validationErrors,
      validationWarnings,
      criticalErrors: validationErrors.length,
      warnings: validationWarnings.length,
      schemaCoverageScore: Math.min(100, schemas.length * 25),
      eligibleForRichResults: richResultTypes.length > 0,
      richResultTypes,
      recommendedSchemas: getRecommendedSchemas(url, schemaTypes),
    };

    console.log(`Structured data validation complete: ${schemas.length} schemas found, ${validationErrors.length} errors`);

    // Save results
    if (saveResults) {
      await supabase
        .from('seo_structured_data')
        .insert({
          url,
          schema_types: analysis.schemaTypes,
          has_structured_data: analysis.hasStructuredData,
          is_valid: analysis.isValid,
          validation_errors: validationErrors,
          validation_warnings: validationWarnings,
          schemas: schemas.map(s => ({
            type: s.type,
            valid: s.valid,
            required_fields: s.requiredFields || [],
            missing_fields: s.missingFields || [],
          })),
          schema_coverage_score: analysis.schemaCoverageScore,
          eligible_for_rich_results: analysis.eligibleForRichResults,
          rich_result_types: richResultTypes,
          critical_errors: analysis.criticalErrors,
          warnings: analysis.warnings,
          recommended_schemas: analysis.recommendedSchemas,
        });
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error validating structured data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getRequiredFields(type: string): string[] {
  const fieldMap: Record<string, string[]> = {
    'Article': ['headline', 'image', 'datePublished', 'author'],
    'Product': ['name', 'image', 'offers'],
    'Recipe': ['name', 'image', 'recipeInstructions'],
    'Event': ['name', 'startDate', 'location'],
    'FAQPage': ['mainEntity'],
    'HowTo': ['name', 'step'],
    'JobPosting': ['title', 'description', 'hiringOrganization'],
    'Organization': ['name', 'url'],
    'WebPage': ['name', 'url'],
    'BreadcrumbList': ['itemListElement'],
  };

  return fieldMap[type] || [];
}

function getRecommendedSchemas(url: string, existingTypes: Set<string>): string[] {
  const recommended = [];

  // Always recommend Organization if not present
  if (!existingTypes.has('Organization')) {
    recommended.push('Organization');
  }

  // Recommend WebPage if not present
  if (!existingTypes.has('WebPage')) {
    recommended.push('WebPage');
  }

  // Recommend BreadcrumbList
  if (!existingTypes.has('BreadcrumbList')) {
    recommended.push('BreadcrumbList');
  }

  // Check URL patterns
  if (url.includes('/blog/') || url.includes('/article/')) {
    if (!existingTypes.has('Article') && !existingTypes.has('BlogPosting')) {
      recommended.push('Article');
    }
  }

  if (url.includes('/product/')) {
    if (!existingTypes.has('Product')) {
      recommended.push('Product');
    }
  }

  return recommended;
}
