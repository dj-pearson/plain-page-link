import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/auth.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      action, // 'analyze', 'optimize', 'generate_variations'
      blogPostId,
      currentTitle,
      keywords,
      targetAudience,
      userId,
    } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required (analyze, optimize, generate_variations)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Require admin authorization for blog title management
    await requireAdmin(req, supabase);

    let post: any = null;
    if (blogPostId) {
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('id', blogPostId)
        .single();
      post = data;
    }

    const title = currentTitle || post?.title;
    if (!title && action !== 'generate_variations') {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Managing blog title: ${action} - "${title}"`);

    let result: any = {};

    switch (action) {
      case 'analyze':
        result = analyzeTitle(title, keywords);
        break;

      case 'optimize':
        result = await optimizeTitle(title, keywords, targetAudience, LOVABLE_API_KEY);
        break;

      case 'generate_variations':
        result = await generateTitleVariations(title || 'Untitled', keywords, targetAudience, LOVABLE_API_KEY);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log(`Title management complete: ${action}`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error managing blog title:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeTitle(title: string, keywords?: string[]): any {
  const length = title.length;
  const wordCount = title.split(/\s+/).length;
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Length check
  if (length < 30) {
    issues.push('Title too short (< 30 characters)');
    recommendations.push('Expand title to 50-60 characters for better SEO');
    score -= 15;
  } else if (length > 70) {
    issues.push('Title too long (> 70 characters)');
    recommendations.push('Shorten title to 50-60 characters to avoid truncation in search results');
    score -= 10;
  } else if (length >= 50 && length <= 60) {
    score += 10; // Bonus for ideal length
  }

  // Word count check
  if (wordCount < 5) {
    issues.push('Title too short (< 5 words)');
    recommendations.push('Add more descriptive words');
    score -= 10;
  } else if (wordCount > 12) {
    issues.push('Title too long (> 12 words)');
    recommendations.push('Make title more concise');
    score -= 10;
  }

  // Keyword check
  if (keywords && keywords.length > 0) {
    const titleLower = title.toLowerCase();
    const hasKeywords = keywords.some(kw => titleLower.includes(kw.toLowerCase()));
    if (!hasKeywords) {
      issues.push('No target keywords found in title');
      recommendations.push(`Include one of these keywords: ${keywords.join(', ')}`);
      score -= 20;
    }
  }

  // Power words check
  const powerWords = ['ultimate', 'complete', 'essential', 'proven', 'effective', 'simple', 'easy', 'quick', 'best', 'top'];
  const hasPowerWords = powerWords.some(word => title.toLowerCase().includes(word));
  if (!hasPowerWords) {
    recommendations.push('Consider adding power words (ultimate, complete, essential, etc.) for more impact');
  }

  // Numbers check
  const hasNumbers = /\d+/.test(title);
  if (!hasNumbers) {
    recommendations.push('Consider adding numbers (e.g., "10 Ways", "5 Tips") to increase click-through rate');
  }

  // Capitalization check
  const words = title.split(/\s+/);
  const capitalizedWords = words.filter(word => /^[A-Z]/.test(word)).length;
  if (capitalizedWords < words.length * 0.5) {
    issues.push('Poor capitalization');
    recommendations.push('Use title case for better readability');
    score -= 5;
  }

  // Special characters check
  const specialChars = /[!?:|]/.test(title);
  if (specialChars) {
    recommendations.push('Use special characters sparingly for emphasis');
  }

  score = Math.max(0, Math.min(100, score));

  return {
    title,
    analysis: {
      length,
      wordCount,
      score,
      issues,
      recommendations,
      hasKeywords: keywords ? keywords.some(kw => title.toLowerCase().includes(kw.toLowerCase())) : null,
      hasPowerWords,
      hasNumbers,
    },
    analyzedAt: new Date().toISOString(),
  };
}

async function optimizeTitle(
  title: string,
  keywords?: string[],
  targetAudience?: string,
  apiKey?: string
): Promise<any> {
  const analysis = analyzeTitle(title, keywords);

  if (!apiKey) {
    return {
      originalTitle: title,
      analysis,
      optimizedTitle: title,
      improvements: ['API key required for AI-powered optimization'],
    };
  }

  const prompt = `Optimize this blog post title for SEO and engagement:

Current title: "${title}"
${keywords ? `Target keywords: ${keywords.join(', ')}` : ''}
${targetAudience ? `Target audience: ${targetAudience}` : ''}

Current issues:
${analysis.analysis.issues.join('\n')}

Create an optimized version that:
- Is 50-60 characters long
- Includes target keywords naturally
- Uses power words for impact
- Is engaging and click-worthy
- Follows title case capitalization

Return as JSON:
{
  "optimizedTitle": "Your optimized title",
  "improvements": ["Improvement 1", "Improvement 2"],
  "reasoning": "Brief explanation of changes"
}`;

  try {
    const response = await fetch('https://lovable.app/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        originalTitle: title,
        analysis,
        ...result,
      };
    }
  } catch (error) {
    console.error('Error optimizing title:', error);
  }

  return {
    originalTitle: title,
    analysis,
    optimizedTitle: title,
    improvements: ['Unable to generate optimization'],
  };
}

async function generateTitleVariations(
  baseTopic: string,
  keywords?: string[],
  targetAudience?: string,
  apiKey?: string
): Promise<any> {
  if (!apiKey) {
    return {
      baseTopic,
      variations: [
        { title: `The Ultimate Guide to ${baseTopic}`, style: 'comprehensive' },
        { title: `10 Essential Tips for ${baseTopic}`, style: 'listicle' },
        { title: `How to Master ${baseTopic} in 2025`, style: 'how-to' },
        { title: `${baseTopic}: Everything You Need to Know`, style: 'definitive' },
        { title: `Why ${baseTopic} Matters for Your Success`, style: 'persuasive' },
      ],
    };
  }

  const prompt = `Generate 10 different title variations for a blog post about: "${baseTopic}"

${keywords ? `Include these keywords: ${keywords.join(', ')}` : ''}
${targetAudience ? `Target audience: ${targetAudience}` : ''}

Create titles in different styles:
- Comprehensive guides
- Listicles (numbered lists)
- How-to articles
- Question-based
- Persuasive/benefit-focused

Each title should be 50-60 characters and highly engaging.

Return as JSON:
{
  "variations": [
    {
      "title": "Title here",
      "style": "comprehensive",
      "length": 55
    }
  ]
}`;

  try {
    const response = await fetch('https://lovable.app/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        baseTopic,
        keywords,
        ...result,
      };
    }
  } catch (error) {
    console.error('Error generating variations:', error);
  }

  return {
    baseTopic,
    variations: [
      { title: `Complete Guide to ${baseTopic}`, style: 'comprehensive', length: 20 + baseTopic.length },
    ],
  };
}
