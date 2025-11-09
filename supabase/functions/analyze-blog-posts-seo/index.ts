import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blogPostIds, userId, analyzeAll = false, saveResults = true } = await req.json();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log(`Analyzing blog posts for SEO...`);

    let posts: any[] = [];

    if (blogPostIds && blogPostIds.length > 0) {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .in('id', blogPostIds);
      posts = data || [];
    } else if (analyzeAll && userId) {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });
      posts = data || [];
    } else {
      throw new Error('Either blogPostIds or analyzeAll with userId is required');
    }

    if (posts.length === 0) {
      throw new Error('No blog posts found to analyze');
    }

    const results = [];
    const errors = [];

    for (const post of posts) {
      try {
        const analysis = await analyzeBlogPostSEO(post);
        results.push(analysis);

        if (saveResults) {
          // Update article with SEO analysis
          await supabase
            .from('articles')
            .update({
              seo_score: analysis.seoScore,
              seo_issues: analysis.issues,
              seo_recommendations: analysis.recommendations,
              last_seo_check: new Date().toISOString(),
            })
            .eq('id', post.id);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`Error analyzing post ${post.id}:`, error);
        errors.push({
          postId: post.id,
          title: post.title,
          error: error.message,
        });
      }
    }

    // Calculate summary statistics
    const avgScore = results.reduce((sum, r) => sum + r.seoScore, 0) / Math.max(1, results.length);
    const excellentCount = results.filter(r => r.seoScore >= 80).length;
    const goodCount = results.filter(r => r.seoScore >= 60 && r.seoScore < 80).length;
    const needsWorkCount = results.filter(r => r.seoScore < 60).length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    const summary = {
      totalAnalyzed: results.length,
      avgSeoScore: Math.round(avgScore),
      excellentCount,
      goodCount,
      needsWorkCount,
      totalIssues,
      errorCount: errors.length,
    };

    console.log(`Blog post analysis complete: ${results.length} posts analyzed, avg score: ${Math.round(avgScore)}`);

    return new Response(
      JSON.stringify({ success: true, summary, results, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error analyzing blog posts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeBlogPostSEO(post: any): Promise<any> {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Title analysis
  if (!post.title || post.title.length === 0) {
    issues.push('Missing title');
    score -= 15;
  } else {
    const titleLength = post.title.length;
    if (titleLength < 30) {
      issues.push('Title too short (< 30 characters)');
      recommendations.push('Expand title to 50-60 characters for better SEO');
      score -= 10;
    } else if (titleLength > 70) {
      issues.push('Title too long (> 70 characters)');
      recommendations.push('Shorten title to 50-60 characters to avoid truncation');
      score -= 5;
    }
  }

  // Meta description analysis
  if (!post.meta_description || post.meta_description.length === 0) {
    issues.push('Missing meta description');
    recommendations.push('Add a compelling meta description (150-160 characters)');
    score -= 15;
  } else {
    const descLength = post.meta_description.length;
    if (descLength < 120) {
      issues.push('Meta description too short (< 120 characters)');
      recommendations.push('Expand meta description to 150-160 characters');
      score -= 10;
    } else if (descLength > 170) {
      issues.push('Meta description too long (> 170 characters)');
      recommendations.push('Shorten meta description to 150-160 characters');
      score -= 5;
    }
  }

  // Content analysis
  const contentLength = post.content?.length || 0;
  const wordCount = post.content ? post.content.split(/\s+/).length : 0;

  if (wordCount < 300) {
    issues.push(`Content too short (${wordCount} words)`);
    recommendations.push('Aim for at least 1000 words for better SEO performance');
    score -= 20;
  } else if (wordCount < 1000) {
    issues.push(`Content could be longer (${wordCount} words)`);
    recommendations.push('Consider expanding to 1500+ words for comprehensive coverage');
    score -= 10;
  }

  // URL slug analysis
  if (!post.slug || post.slug.length === 0) {
    issues.push('Missing URL slug');
    score -= 10;
  } else {
    if (post.slug.length > 75) {
      issues.push('URL slug too long');
      recommendations.push('Shorten URL slug to under 75 characters');
      score -= 5;
    }
    if (!/^[a-z0-9-]+$/.test(post.slug)) {
      issues.push('URL slug contains invalid characters');
      recommendations.push('Use only lowercase letters, numbers, and hyphens');
      score -= 5;
    }
  }

  // Image analysis
  if (!post.featured_image) {
    issues.push('Missing featured image');
    recommendations.push('Add a featured image for better engagement and social sharing');
    score -= 10;
  }

  // Published status
  if (!post.published) {
    issues.push('Post is not published');
    score -= 5;
  }

  // Category/tag analysis
  const categories = post.categories || [];
  if (categories.length === 0) {
    issues.push('No categories assigned');
    recommendations.push('Add relevant categories to improve content organization');
    score -= 5;
  }

  // Freshness analysis
  const daysSincePublish = post.published_at
    ? Math.floor((Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  if (daysSincePublish && daysSincePublish > 365) {
    recommendations.push('Content is over a year old - consider updating for freshness');
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    postId: post.id,
    title: post.title,
    slug: post.slug,
    seoScore: score,
    wordCount,
    issues,
    recommendations,
    titleLength: post.title?.length || 0,
    descriptionLength: post.meta_description?.length || 0,
    hasImage: !!post.featured_image,
    published: post.published,
    categoryCount: categories.length,
    analyzedAt: new Date().toISOString(),
  };
}
