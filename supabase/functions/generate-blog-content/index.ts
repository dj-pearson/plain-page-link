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
    const {
      topic,
      keywords,
      targetLength = 1500,
      tone = 'professional',
      includeOutline = true,
      userId,
    } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: 'Topic is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating blog content for topic: ${topic}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Generate outline first
    let outline = null;
    if (includeOutline) {
      outline = await generateOutline(topic, keywords, LOVABLE_API_KEY);
    }

    // Generate content
    const content = await generateContent(topic, keywords, targetLength, tone, outline, LOVABLE_API_KEY);

    // Generate SEO metadata
    const metadata = await generateMetadata(topic, keywords, content, LOVABLE_API_KEY);

    const result = {
      topic,
      outline,
      content,
      metadata: {
        title: metadata.title,
        metaDescription: metadata.description,
        slug: generateSlug(metadata.title),
        keywords: keywords || [],
        suggestedCategories: metadata.categories,
      },
      stats: {
        wordCount: content.split(/\s+/).length,
        characterCount: content.length,
        readingTime: Math.ceil(content.split(/\s+/).length / 200), // minutes
        paragraphs: content.split('\n\n').length,
      },
      generatedAt: new Date().toISOString(),
    };

    console.log(`Blog content generated: ${result.stats.wordCount} words, ${result.stats.readingTime} min read`);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating blog content:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function generateOutline(topic: string, keywords: string[] | undefined, apiKey: string | undefined): Promise<any> {
  if (!apiKey) {
    // Fallback outline structure
    return {
      introduction: 'Introduce the topic and its importance',
      sections: [
        { heading: 'Understanding the Basics', points: ['Key concept 1', 'Key concept 2', 'Key concept 3'] },
        { heading: 'Main Benefits', points: ['Benefit 1', 'Benefit 2', 'Benefit 3'] },
        { heading: 'Best Practices', points: ['Practice 1', 'Practice 2', 'Practice 3'] },
        { heading: 'Common Challenges', points: ['Challenge 1', 'Challenge 2', 'Challenge 3'] },
      ],
      conclusion: 'Summarize key points and call to action',
    };
  }

  const prompt = `Create a detailed blog post outline for the topic: "${topic}".
${keywords ? `Focus on these keywords: ${keywords.join(', ')}` : ''}

Provide a structured outline with:
- Introduction hook
- 4-6 main sections with subsections
- Conclusion with call to action

Return as JSON with this structure:
{
  "introduction": "Introduction description",
  "sections": [
    {
      "heading": "Section title",
      "points": ["Point 1", "Point 2", "Point 3"]
    }
  ],
  "conclusion": "Conclusion description"
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

    // Try to parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating outline:', error);
  }

  // Fallback
  return {
    introduction: 'Introduce the topic and its importance',
    sections: [
      { heading: 'Main Concepts', points: ['Concept 1', 'Concept 2'] },
      { heading: 'Implementation', points: ['Step 1', 'Step 2'] },
    ],
    conclusion: 'Summary and next steps',
  };
}

async function generateContent(
  topic: string,
  keywords: string[] | undefined,
  targetLength: number,
  tone: string,
  outline: any,
  apiKey: string | undefined
): Promise<string> {
  if (!apiKey) {
    // Fallback content
    return `# ${topic}

## Introduction

This article explores ${topic} in depth, providing valuable insights and practical guidance.

## Main Content

${outline.sections.map((section: any) => `
### ${section.heading}

${section.points.map((point: string) => `- ${point}`).join('\n')}
`).join('\n')}

## Conclusion

In conclusion, understanding ${topic} is essential for success. Apply these principles to achieve your goals.`;
  }

  const prompt = `Write a comprehensive blog post about: "${topic}"

Requirements:
- Target length: ~${targetLength} words
- Tone: ${tone}
- ${keywords ? `Naturally incorporate these keywords: ${keywords.join(', ')}` : ''}
- Use this outline:
${JSON.stringify(outline, null, 2)}

Write engaging, informative content in markdown format with proper headings (##, ###).
Include examples, actionable advice, and maintain readability.`;

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
    return data.choices?.[0]?.message?.content || 'Content generation failed';
  } catch (error) {
    console.error('Error generating content:', error);
    return `# ${topic}\n\nContent generation is currently unavailable.`;
  }
}

async function generateMetadata(
  topic: string,
  keywords: string[] | undefined,
  content: string,
  apiKey: string | undefined
): Promise<any> {
  if (!apiKey) {
    return {
      title: topic,
      description: `Learn about ${topic} in this comprehensive guide.`,
      categories: ['General'],
    };
  }

  const prompt = `Based on this blog post content, generate SEO-optimized metadata:

Topic: ${topic}
${keywords ? `Keywords: ${keywords.join(', ')}` : ''}

Content preview:
${content.substring(0, 500)}...

Generate:
1. An engaging, SEO-optimized title (50-60 characters)
2. A compelling meta description (150-160 characters)
3. 2-3 relevant categories

Return as JSON:
{
  "title": "Your title",
  "description": "Your description",
  "categories": ["Category1", "Category2"]
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
    const responseContent = data.choices?.[0]?.message?.content || '';

    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  return {
    title: topic,
    description: `Learn about ${topic} in this comprehensive guide.`,
    categories: ['General'],
  };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 75);
}
