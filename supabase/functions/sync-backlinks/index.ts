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
    const { url, userId, saveResults = true } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Syncing backlinks for: ${url}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // In production, integrate with backlink APIs:
    // - Ahrefs API
    // - Majestic API
    // - Moz Link API
    // - SEMrush Backlinks API
    const backlinks = await fetchBacklinks(url);

    // Categorize backlinks
    const categorized = {
      total: backlinks.length,
      dofollow: backlinks.filter(b => b.rel !== 'nofollow').length,
      nofollow: backlinks.filter(b => b.rel === 'nofollow').length,
      byDomainAuthority: {
        high: backlinks.filter(b => b.domainAuthority >= 70).length,
        medium: backlinks.filter(b => b.domainAuthority >= 40 && b.domainAuthority < 70).length,
        low: backlinks.filter(b => b.domainAuthority < 40).length,
      },
      byStatus: {
        active: backlinks.filter(b => b.status === 'active').length,
        broken: backlinks.filter(b => b.status === 'broken').length,
        redirect: backlinks.filter(b => b.status === 'redirect').length,
      },
      newBacklinks: 0,
      lostBacklinks: 0,
    };

    // Calculate backlink quality score
    const qualityScore = calculateBacklinkQuality(backlinks);

    // Get previous backlinks for comparison
    let previousBacklinks: any[] = [];
    if (saveResults) {
      const { data } = await supabase
        .from('seo_backlinks')
        .select('source_url, anchor_text')
        .eq('target_url', url);
      previousBacklinks = data || [];
    }

    // Detect new and lost backlinks
    const previousUrls = new Set(previousBacklinks.map(b => b.source_url));
    const currentUrls = new Set(backlinks.map(b => b.sourceUrl));

    const newBacklinks = backlinks.filter(b => !previousUrls.has(b.sourceUrl));
    const lostBacklinks = previousBacklinks.filter(b => !currentUrls.has(b.source_url));

    categorized.newBacklinks = newBacklinks.length;
    categorized.lostBacklinks = lostBacklinks.length;

    const analysis = {
      targetUrl: url,
      backlinks: categorized,
      qualityScore,
      topBacklinks: backlinks
        .sort((a, b) => b.domainAuthority - a.domainAuthority)
        .slice(0, 10)
        .map(b => ({
          sourceUrl: b.sourceUrl,
          anchorText: b.anchorText,
          domainAuthority: b.domainAuthority,
          rel: b.rel,
          status: b.status,
        })),
      newBacklinks: newBacklinks.map(b => ({
        sourceUrl: b.sourceUrl,
        anchorText: b.anchorText,
        domainAuthority: b.domainAuthority,
      })),
      lostBacklinks: lostBacklinks.map(b => ({
        sourceUrl: b.source_url,
        anchorText: b.anchor_text,
      })),
      syncedAt: new Date().toISOString(),
    };

    if (saveResults) {
      // Clear existing backlinks for this URL
      await supabase
        .from('seo_backlinks')
        .delete()
        .eq('target_url', url);

      // Insert new backlinks
      const backlinkRecords = backlinks.map(b => ({
        user_id: userId,
        target_url: url,
        source_url: b.sourceUrl,
        source_domain: new URL(b.sourceUrl).hostname,
        anchor_text: b.anchorText,
        rel_attribute: b.rel,
        domain_authority: b.domainAuthority,
        page_authority: b.pageAuthority,
        spam_score: b.spamScore,
        link_status: b.status,
        first_seen_at: b.firstSeen,
        last_checked_at: new Date().toISOString(),
      }));

      if (backlinkRecords.length > 0) {
        await supabase
          .from('seo_backlinks')
          .insert(backlinkRecords);
      }

      // Create alerts for significant changes
      if (lostBacklinks.length > 5) {
        await supabase
          .from('seo_alerts')
          .insert({
            user_id: userId,
            alert_type: 'backlinks',
            severity: lostBacklinks.length > 20 ? 'high' : 'medium',
            message: `Lost ${lostBacklinks.length} backlinks for ${url}`,
            related_url: url,
            metadata: { lostCount: lostBacklinks.length, lostBacklinks: lostBacklinks.slice(0, 10) },
            status: 'active',
          });
      }

      if (newBacklinks.length > 10) {
        await supabase
          .from('seo_alerts')
          .insert({
            user_id: userId,
            alert_type: 'backlinks',
            severity: 'low',
            message: `Gained ${newBacklinks.length} new backlinks for ${url}`,
            related_url: url,
            metadata: { newCount: newBacklinks.length, newBacklinks: newBacklinks.slice(0, 10) },
            status: 'active',
          });
      }
    }

    console.log(`Backlink sync complete: ${categorized.total} total, ${categorized.newBacklinks} new, ${categorized.lostBacklinks} lost`);

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error syncing backlinks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchBacklinks(url: string): Promise<any[]> {
  // Mock implementation
  // In production, integrate with backlink APIs:
  // - Ahrefs: https://ahrefs.com/api
  // - Majestic: https://majestic.com/reports/api-dev-guide
  // - Moz: https://moz.com/products/api/pricing
  // - SEMrush: https://www.semrush.com/api-documentation/

  console.log(`Simulating backlink fetch for ${url}`);

  await new Promise(resolve => setTimeout(resolve, 500));

  // Generate mock backlinks
  const mockBacklinks = [];
  const count = Math.floor(Math.random() * 50) + 10;

  for (let i = 0; i < count; i++) {
    const domains = ['example.com', 'blog.site.com', 'news.website.org', 'forum.community.net', 'articles.hub.io'];
    const domain = domains[i % domains.length];
    const da = Math.floor(Math.random() * 100);
    const pa = Math.floor(Math.random() * 100);

    mockBacklinks.push({
      sourceUrl: `https://${domain}/article-${i}`,
      anchorText: `Link ${i}`,
      rel: Math.random() > 0.2 ? 'dofollow' : 'nofollow',
      domainAuthority: da,
      pageAuthority: pa,
      spamScore: Math.floor(Math.random() * 30),
      status: Math.random() > 0.1 ? 'active' : (Math.random() > 0.5 ? 'broken' : 'redirect'),
      firstSeen: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return mockBacklinks;
}

function calculateBacklinkQuality(backlinks: any[]): number {
  if (backlinks.length === 0) return 0;

  let score = 0;

  // Factor 1: Domain Authority (30%)
  const avgDA = backlinks.reduce((sum, b) => sum + b.domainAuthority, 0) / backlinks.length;
  score += (avgDA / 100) * 30;

  // Factor 2: Dofollow ratio (25%)
  const dofollowRatio = backlinks.filter(b => b.rel !== 'nofollow').length / backlinks.length;
  score += dofollowRatio * 25;

  // Factor 3: Active links (20%)
  const activeRatio = backlinks.filter(b => b.status === 'active').length / backlinks.length;
  score += activeRatio * 20;

  // Factor 4: Low spam score (15%)
  const avgSpam = backlinks.reduce((sum, b) => sum + b.spamScore, 0) / backlinks.length;
  score += ((100 - avgSpam) / 100) * 15;

  // Factor 5: Quantity bonus (10%)
  const quantityBonus = Math.min(backlinks.length / 100, 1) * 10;
  score += quantityBonus;

  return Math.round(score);
}
