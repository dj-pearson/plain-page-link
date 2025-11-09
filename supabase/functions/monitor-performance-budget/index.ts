import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

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
    const PAGESPEED_API_KEY = Deno.env.get("PAGESPEED_API_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
      // Try to find budget for URL
      const { data } = await supabase
        .from('seo_performance_budget')
        .select('*')
        .eq('page_url', url)
        .single();
      budget = data;
    }

    if (!budget) {
      // Create default budget
      budget = {
        page_url: url,
        max_lcp_ms: 2500,
        max_fid_ms: 100,
        max_cls_score: 0.1,
        max_fcp_ms: 1800,
        max_ttfb_ms: 600,
        max_tti_ms: 3800,
        max_page_size_kb: 1500,
        max_requests: 50,
        max_js_size_kb: 500,
        max_css_size_kb: 150,
        max_image_size_kb: 800,
      };
    }

    const targetUrl = budget.page_url || url;

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
      { name: 'CLS', current: currentMetrics.cls, budget: budget.max_cls_score, unit: '' },
      { name: 'FCP', current: currentMetrics.fcp, budget: budget.max_fcp_ms, unit: 'ms' },
      { name: 'TTFB', current: currentMetrics.ttfb, budget: budget.max_ttfb_ms, unit: 'ms' },
      { name: 'TTI', current: currentMetrics.tti, budget: budget.max_tti_ms, unit: 'ms' },
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
        maxClsScore: budget.max_cls_score,
        maxFcpMs: budget.max_fcp_ms,
        maxTtfbMs: budget.max_ttfb_ms,
        maxTtiMs: budget.max_tti_ms,
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
      // Update or create budget record with latest check
      await supabase
        .from('seo_performance_budget')
        .upsert({
          ...budget,
          last_check_at: new Date().toISOString(),
          last_check_status: analysis.status,
          violations_detected: violationCount,
          compliance_score: complianceScore,
          latest_metrics: currentMetrics,
          latest_violations: violations,
        }, {
          onConflict: budget.id ? 'id' : 'page_url',
        });

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
          .insert({
            user_id: budget.user_id,
            alert_type: 'performance_budget',
            severity,
            message: `Performance budget exceeded: ${violationCount} violation(s) detected`,
            related_url: targetUrl,
            metadata: { violations, complianceScore },
            status: 'active',
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractResourceSize(data: any, resourceType: string): number {
  const items = data.lighthouseResult?.audits?.['network-requests']?.details?.items || [];
  const filtered = items.filter((item: any) => item.resourceType === resourceType);
  const totalBytes = filtered.reduce((sum: number, item: any) => sum + (item.transferSize || 0), 0);
  return Math.round(totalBytes / 1024);
}
