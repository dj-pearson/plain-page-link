import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { auditId, fixes } = await req.json();

    if (!auditId && !fixes) {
      return new Response(
        JSON.stringify({ error: 'Either auditId or fixes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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

    const appliedFixes = [];
    const errors = [];

    // If auditId provided, get recommended fixes from audit
    let fixesToApply = fixes || [];
    if (auditId && !fixes) {
      const { data: audit } = await supabase
        .from('seo_audit_history')
        .select('recommendations, critical_issues, warnings')
        .eq('id', auditId)
        .single();

      if (audit) {
        // Generate fixes from audit recommendations
        fixesToApply = [
          ...audit.critical_issues.map((issue: string) => ({
            type: 'auto_fix',
            issue: issue,
            priority: 'critical'
          })),
          ...audit.recommendations.slice(0, 5).map((rec: string) => ({
            type: 'recommendation',
            issue: rec,
            priority: 'medium'
          }))
        ];
      }
    }

    for (const fix of fixesToApply) {
      try {
        const fixRecord = {
          audit_id: auditId,
          url: fix.url,
          fix_type: fix.type || 'other',
          fix_category: fix.category || 'technical',
          issue_description: fix.issue || fix.description,
          fix_description: fix.solution || 'Automated fix applied',
          fix_impact: fix.priority || 'medium',
          status: 'applied',
          applied_at: new Date().toISOString(),
          applied_by: userId,
          verification_status: 'unverified',
        };

        const { data, error } = await supabase
          .from('seo_fixes_applied')
          .insert(fixRecord)
          .select()
          .single();

        if (error) {
          errors.push({ fix, error: error.message });
        } else {
          appliedFixes.push(data);
        }
      } catch (error) {
        errors.push({ fix, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        appliedFixes,
        errors,
        summary: {
          total: fixesToApply.length,
          applied: appliedFixes.length,
          failed: errors.length,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error applying SEO fixes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
