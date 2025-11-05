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

    console.log(`Checking security headers for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const response = await fetch(url);
    const headers = response.headers;

    // Check SSL
    const hasSSL = url.startsWith('https://');
    const sslValid = hasSSL;

    // Security Headers
    const strictTransportSecurity = headers.get('strict-transport-security');
    const contentSecurityPolicy = headers.get('content-security-policy');
    const xFrameOptions = headers.get('x-frame-options');
    const xContentTypeOptions = headers.get('x-content-type-options');
    const referrerPolicy = headers.get('referrer-policy');
    const permissionsPolicy = headers.get('permissions-policy');
    const xXSSProtection = headers.get('x-xss-protection');

    const analysis = {
      url,
      hasSSL,
      sslValid,
      hasHSTS: !!strictTransportSecurity,
      hstsMaxAge: null as number | null,
      hasCSP: !!contentSecurityPolicy,
      cspPolicy: contentSecurityPolicy,
      hasXFrameOptions: !!xFrameOptions,
      xFrameOptions,
      hasXContentTypeOptions: !!xContentTypeOptions,
      hasReferrerPolicy: !!referrerPolicy,
      referrerPolicy,
      hasPermissionsPolicy: !!permissionsPolicy,
      vulnerabilities: [] as any[],
      securityScore: 0,
      securityGrade: 'F' as string,
      criticalIssues: 0,
      warnings: 0,
      passedChecks: 0,
      totalChecks: 10,
    };

    // Parse HSTS max-age
    if (strictTransportSecurity) {
      const maxAgeMatch = strictTransportSecurity.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        analysis.hstsMaxAge = parseInt(maxAgeMatch[1]);
      }
    }

    // Score calculation
    let score = 0;
    const vulnerabilities = [];

    // SSL/TLS (20 points)
    if (hasSSL) {
      score += 20;
      analysis.passedChecks++;
    } else {
      vulnerabilities.push({
        type: 'missing_ssl',
        severity: 'critical',
        recommendation: 'Enable HTTPS/SSL',
      });
      analysis.criticalIssues++;
    }

    // HSTS (15 points)
    if (analysis.hasHSTS) {
      if (analysis.hstsMaxAge && analysis.hstsMaxAge >= 31536000) {
        score += 15;
        analysis.passedChecks++;
      } else {
        score += 8;
        analysis.warnings++;
        vulnerabilities.push({
          type: 'weak_hsts',
          severity: 'medium',
          recommendation: 'Increase HSTS max-age to at least 1 year (31536000 seconds)',
        });
      }
    } else if (hasSSL) {
      vulnerabilities.push({
        type: 'missing_hsts',
        severity: 'high',
        recommendation: 'Add Strict-Transport-Security header',
      });
      analysis.criticalIssues++;
    }

    // CSP (20 points)
    if (analysis.hasCSP) {
      score += 20;
      analysis.passedChecks++;
      // Check for unsafe directives
      if (contentSecurityPolicy?.includes('unsafe-inline') || contentSecurityPolicy?.includes('unsafe-eval')) {
        vulnerabilities.push({
          type: 'weak_csp',
          severity: 'medium',
          recommendation: 'Avoid unsafe-inline and unsafe-eval in CSP',
        });
        score -= 5;
        analysis.warnings++;
      }
    } else {
      vulnerabilities.push({
        type: 'missing_csp',
        severity: 'high',
        recommendation: 'Add Content-Security-Policy header',
      });
      analysis.criticalIssues++;
    }

    // X-Frame-Options (15 points)
    if (analysis.hasXFrameOptions) {
      score += 15;
      analysis.passedChecks++;
      if (xFrameOptions !== 'DENY' && xFrameOptions !== 'SAMEORIGIN') {
        vulnerabilities.push({
          type: 'weak_x_frame',
          severity: 'medium',
          recommendation: 'Use X-Frame-Options: DENY or SAMEORIGIN',
        });
        score -= 5;
        analysis.warnings++;
      }
    } else {
      vulnerabilities.push({
        type: 'missing_x_frame',
        severity: 'high',
        recommendation: 'Add X-Frame-Options header to prevent clickjacking',
      });
      analysis.criticalIssues++;
    }

    // X-Content-Type-Options (10 points)
    if (analysis.hasXContentTypeOptions) {
      score += 10;
      analysis.passedChecks++;
    } else {
      vulnerabilities.push({
        type: 'missing_x_content_type',
        severity: 'medium',
        recommendation: 'Add X-Content-Type-Options: nosniff',
      });
      analysis.warnings++;
    }

    // Referrer-Policy (10 points)
    if (analysis.hasReferrerPolicy) {
      score += 10;
      analysis.passedChecks++;
    } else {
      vulnerabilities.push({
        type: 'missing_referrer_policy',
        severity: 'low',
        recommendation: 'Add Referrer-Policy header',
      });
    }

    // Permissions-Policy (10 points)
    if (analysis.hasPermissionsPolicy) {
      score += 10;
      analysis.passedChecks++;
    } else {
      vulnerabilities.push({
        type: 'missing_permissions_policy',
        severity: 'low',
        recommendation: 'Add Permissions-Policy header',
      });
    }

    analysis.securityScore = Math.min(100, score);
    analysis.vulnerabilities = vulnerabilities;

    // Grade calculation
    if (score >= 90) analysis.securityGrade = 'A+';
    else if (score >= 80) analysis.securityGrade = 'A';
    else if (score >= 70) analysis.securityGrade = 'B';
    else if (score >= 60) analysis.securityGrade = 'C';
    else if (score >= 50) analysis.securityGrade = 'D';
    else analysis.securityGrade = 'F';

    console.log(`Security analysis complete: ${analysis.securityGrade} grade, ${analysis.securityScore} score`);

    // Save results
    if (saveResults) {
      await supabase
        .from('seo_security_analysis')
        .insert({
          url,
          has_ssl: hasSSL,
          ssl_valid: sslValid,
          has_hsts: analysis.hasHSTS,
          hsts_max_age: analysis.hstsMaxAge,
          has_csp: analysis.hasCSP,
          csp_policy: contentSecurityPolicy,
          has_x_frame_options: analysis.hasXFrameOptions,
          x_frame_options: xFrameOptions,
          has_x_content_type_options: analysis.hasXContentTypeOptions,
          has_referrer_policy: analysis.hasReferrerPolicy,
          referrer_policy: referrerPolicy,
          has_permissions_policy: analysis.hasPermissionsPolicy,
          security_score: analysis.securityScore,
          security_grade: analysis.securityGrade,
          vulnerabilities: vulnerabilities,
          critical_issues: analysis.criticalIssues,
          warnings: analysis.warnings,
          passed_checks: analysis.passedChecks,
          total_checks: analysis.totalChecks,
        });
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking security headers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
