import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from '../_shared/auth.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getPagespeedApiKey } from '../_shared/env.ts';
import { errorStatus } from '../_shared/http-error.ts';

/**
 * Thresholds for the three metrics seo_performance_budget has no column for.
 * Same values the fallback budget below has always used.
 */
const DEFAULT_FCP_MS = 1800;
const DEFAULT_TTFB_MS = 600;
const DEFAULT_TTI_MS = 3800;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, budgetId, saveResults = true } = await req.json();

    if (!url && !budgetId) {
      return new Response(
        JSON.stringify({ error: 'URL or budgetId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Monitoring performance budget for: ${url || budgetId}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PAGESPEED_API_KEY = getPagespeedApiKey();
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // US-078: this builds a SERVICE-ROLE client and acted on the request body
    // alone. verify_jwt would not have helped — the anon key is itself a valid
    // project JWT, so it separates "has the public key" from "has no key",
    // not "is an admin".
    await requireAdmin(req, supabase);

    let budget: any = null;

    // Get budget configuration
    if (budgetId) {
      const { data } = await supabase
        .from('seo_performance_budget')
        .select('*')
        .eq('id', budgetId)
        .single();
      budget = data;
    } else {
      // Try to find budget for URL. US-200: the column is url_pattern, not
      // page_url; the old filter 400'd, so no configured budget was ever found
      // and every check ran against the hardcoded defaults below instead.
      const { data } = await supabase
        .from('seo_performance_budget')
        .select('*')
        .eq('url_pattern', url)
        .single();
      budget = data;
    }

    if (!budget) {
      // Create default budget
      budget = {
        // `name` is NOT NULL, and was not here — so even once the column names
        // were right, persisting a fallback budget would still have failed.
        name: `Default budget for ${url}`,
        url_pattern: url,
        max_lcp_ms: 2500,
        max_fid_ms: 100,
        max_cls: 0.1,
        max_page_size_kb: 1500,
        max_requests: 50,
        max_js_size_kb: 500,
        max_css_size_kb: 150,
        max_image_size_kb: 800,
      };
    }

    const targetUrl = budget.url_pattern || url;

    // Fetch PageSpeed Insights data
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.append('url', targetUrl);
    apiUrl.searchParams.append('category', 'performance');
    if (PAGESPEED_API_KEY) {
      apiUrl.searchParams.append('key', PAGESPEED_API_KEY);
    }

    const response = await fetch(apiUrl.toString());
    if (!response.ok) {
      throw new Error(`PageSpeed API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const metrics = data.lighthouseResult?.audits;
    const diagnostics = data.lighthouseResult?.audits?.diagnostics?.details?.items?.[0];

    // Extract current metrics
    const currentMetrics = {
      lcp: metrics?.['largest-contentful-paint']?.numericValue || 0,
      fid: metrics?.['max-potential-fid']?.numericValue || 0,
      cls: metrics?.['cumulative-layout-shift']?.numericValue || 0,
      fcp: metrics?.['first-contentful-paint']?.numericValue || 0,
      ttfb: metrics?.['server-response-time']?.numericValue || 0,
      tti: metrics?.['interactive']?.numericValue || 0,
      pageSize: diagnostics?.totalByteWeight ? Math.round(diagnostics.totalByteWeight / 1024) : 0,
      requests: diagnostics?.numRequests || 0,
      jsSize: extractResourceSize(data, 'script'),
      cssSize: extractResourceSize(data, 'stylesheet'),
      imageSize: extractResourceSize(data, 'image'),
    };

    // Check violations
    const violations = [];
    let violationCount = 0;
    let passedCount = 0;

    const checks = [
      { name: 'LCP', current: currentMetrics.lcp, budget: budget.max_lcp_ms, unit: 'ms' },
      { name: 'FID', current: currentMetrics.fid, budget: budget.max_fid_ms, unit: 'ms' },
      { name: 'CLS', current: currentMetrics.cls, budget: budget.max_cls, unit: '' },
      // US-201: these three read max_fcp_ms / max_ttfb_ms / max_tti_ms, which
      // are not columns — the table budgets LCP, FID, CLS, page size, requests
      // and the four asset sizes, and nothing else. On a stored budget they were
      // undefined, and `if (check.budget && ...)` counts an undefined budget as
      // a pass, so three of eleven checks silently inflated every compliance
      // score. They measure against platform defaults now, which is what the
      // fallback budget already used.
      { name: 'FCP', current: currentMetrics.fcp, budget: DEFAULT_FCP_MS, unit: 'ms' },
      { name: 'TTFB', current: currentMetrics.ttfb, budget: DEFAULT_TTFB_MS, unit: 'ms' },
      { name: 'TTI', current: currentMetrics.tti, budget: DEFAULT_TTI_MS, unit: 'ms' },
      { name: 'Page Size', current: currentMetrics.pageSize, budget: budget.max_page_size_kb, unit: 'KB' },
      { name: 'Requests', current: currentMetrics.requests, budget: budget.max_requests, unit: '' },
      { name: 'JS Size', current: currentMetrics.jsSize, budget: budget.max_js_size_kb, unit: 'KB' },
      { name: 'CSS Size', current: currentMetrics.cssSize, budget: budget.max_css_size_kb, unit: 'KB' },
      { name: 'Image Size', current: currentMetrics.imageSize, budget: budget.max_image_size_kb, unit: 'KB' },
    ];

    for (const check of checks) {
      if (check.budget && check.current > check.budget) {
        const overage = check.current - check.budget;
        const percentage = ((overage / check.budget) * 100).toFixed(1);

        violations.push({
          metric: check.name,
          current: check.current,
          budget: check.budget,
          overage,
          percentage: `+${percentage}%`,
          unit: check.unit,
          severity: overage > check.budget * 0.5 ? 'critical' : overage > check.budget * 0.2 ? 'high' : 'medium',
        });
        violationCount++;
      } else {
        passedCount++;
      }
    }

    // Calculate compliance score
    const totalChecks = checks.length;
    const complianceScore = Math.round((passedCount / totalChecks) * 100);

    const analysis = {
      pageUrl: targetUrl,
      budgetId: budget.id,
      currentMetrics,
      budgetLimits: {
        maxLcpMs: budget.max_lcp_ms,
        maxFidMs: budget.max_fid_ms,
        maxClsScore: budget.max_cls,
        maxFcpMs: DEFAULT_FCP_MS,
        maxTtfbMs: DEFAULT_TTFB_MS,
        maxTtiMs: DEFAULT_TTI_MS,
        maxPageSizeKb: budget.max_page_size_kb,
        maxRequests: budget.max_requests,
        maxJsSizeKb: budget.max_js_size_kb,
        maxCssSizeKb: budget.max_css_size_kb,
        maxImageSizeKb: budget.max_image_size_kb,
      },
      violations,
      violationCount,
      passedCount,
      complianceScore,
      status: violationCount === 0 ? 'passed' : violations.some(v => v.severity === 'critical') ? 'critical' : 'failed',
    };

    if (saveResults) {
      // Record the check against the budget row.
      //
      // US-201: this upserted six keys the table does not have (last_check_at,
      // last_check_status, violations_detected, compliance_score,
      // latest_metrics, latest_violations) and spread `...budget`, which on the
      // fallback path carried three more. It also declared
      // `onConflict: 'page_url'` — not a column, and url_pattern has no unique
      // constraint either, so there was no conflict target to upsert on at all.
      //
      // The table already has somewhere for every one of these: last_checked_at,
      // is_within_budget, violation_count, violations, and a current_* column
      // per metric. complianceScore is derived from violationCount, so it stays
      // in the response rather than being stored.
      const checkResult = {
        last_checked_at: new Date().toISOString(),
        is_within_budget: violationCount === 0,
        violation_count: violationCount,
        violations,
        current_lcp_ms: Math.round(currentMetrics.lcp),
        current_fid_ms: Math.round(currentMetrics.fid),
        current_cls: currentMetrics.cls,
        current_load_time_ms: Math.round(currentMetrics.tti),
        current_page_size_kb: currentMetrics.pageSize,
        current_requests: currentMetrics.requests,
        current_js_size_kb: currentMetrics.jsSize,
        current_css_size_kb: currentMetrics.cssSize,
        current_image_size_kb: currentMetrics.imageSize,
        ...(violationCount > 0 && { last_violation_at: new Date().toISOString() }),
      };

      // Update by primary key when the budget is a stored row; insert when this
      // URL had none.
      const { error: saveError } = budget.id
        ? await supabase.from('seo_performance_budget').update(checkResult).eq('id', budget.id)
        : await supabase.from('seo_performance_budget').insert({ ...budget, ...checkResult });

      if (saveError) {
        console.error('Error saving performance budget check:', saveError);
      }

      // Create alert if violations found
      if (violationCount > 0 && budget.alert_on_violation) {
        const criticalViolations = violations.filter(v => v.severity === 'critical');
        const highViolations = violations.filter(v => v.severity === 'high');

        let severity = 'low';
        if (criticalViolations.length > 0) severity = 'critical';
        else if (highViolations.length > 0) severity = 'high';
        else severity = 'medium';

        await supabase
          .from('seo_alerts')
          // US-201: seo_performance_budget has created_by, not user_id; and
          // seo_alerts has affected_url rather than related_url, has no metadata
          // column, forbids status 'active', and requires a title.
          .insert({
            user_id: budget.created_by ?? null,
            alert_type: 'performance_budget',
            severity,
            title: `Performance budget exceeded for ${targetUrl}`,
            message: `Performance budget exceeded: ${violationCount} violation(s) detected (compliance ${complianceScore}%)`,
            affected_url: targetUrl,
            status: 'open',
          });
      }
    }

    console.log(`Performance budget check complete: ${passedCount}/${totalChecks} passed, ${violationCount} violations`);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error monitoring performance budget:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: errorStatus(error), headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractResourceSize(data: any, resourceType: string): number {
  const items = data.lighthouseResult?.audits?.['network-requests']?.details?.items || [];
  const filtered = items.filter((item: any) => item.resourceType === resourceType);
  const totalBytes = filtered.reduce((sum: number, item: any) => sum + (item.transferSize || 0), 0);
  return Math.round(totalBytes / 1024);
}
