import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutoFixRule {
  id: string
  name: string
  issue_type: string
  conditions: any
  fix_action: any
  requires_approval: boolean
  auto_apply: boolean
  priority: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { rule_id, issue_id, issue_data, approved_by, auto_mode } = await req.json()

    // Get the rule
    const { data: rule, error: ruleError } = await supabase
      .from('seo_autofix_rules')
      .select('*')
      .eq('id', rule_id)
      .eq('active', true)
      .single()

    if (ruleError || !rule) {
      throw new Error('Auto-fix rule not found or inactive')
    }

    // Check if approval is required
    if (rule.requires_approval && !approved_by && !auto_mode) {
      // Add to approval queue (history with pending_approval status)
      const { data: historyEntry, error: historyError } = await supabase
        .from('seo_autofix_history')
        .insert({
          rule_id: rule.id,
          issue_id,
          issue_type: rule.issue_type,
          fix_applied: {
            pending: true,
            issue_data,
            proposed_fix: rule.fix_action,
          },
          result: 'pending_approval',
        })
        .select()
        .single()

      if (historyError) throw historyError

      return new Response(
        JSON.stringify({
          success: true,
          requires_approval: true,
          approval_id: historyEntry.id,
          message: 'Fix requires approval. Added to approval queue.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Apply the fix
    const startTime = Date.now()
    let fixResult

    try {
      fixResult = await applyFix(supabase, rule, issue_data)

      // Record successful fix
      await supabase.from('seo_autofix_history').insert({
        rule_id: rule.id,
        issue_id,
        issue_type: rule.issue_type,
        fix_applied: fixResult,
        result: 'success',
        approved_by: approved_by || null,
        applied_by: approved_by || null,
      })

      // Update rule statistics
      await supabase.rpc('update_autofix_rule_stats', {
        p_rule_id: rule.id,
        p_success: true,
      })

      // Log automation
      await supabase.rpc('log_automation_execution', {
        p_automation_type: 'autofix',
        p_automation_id: rule.id,
        p_status: 'completed',
        p_message: `Successfully applied fix: ${rule.name}`,
        p_details: { issue_id, fix_result: fixResult },
        p_duration_ms: Date.now() - startTime,
      })

      return new Response(
        JSON.stringify({
          success: true,
          fix_applied: fixResult,
          message: `Fix applied successfully: ${rule.name}`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } catch (error) {
      // Record failed fix
      await supabase.from('seo_autofix_history').insert({
        rule_id: rule.id,
        issue_id,
        issue_type: rule.issue_type,
        fix_applied: { attempted: rule.fix_action },
        result: 'failed',
        error_message: error.message,
        approved_by: approved_by || null,
      })

      // Update rule statistics
      await supabase.rpc('update_autofix_rule_stats', {
        p_rule_id: rule.id,
        p_success: false,
      })

      throw error
    }
  } catch (error) {
    console.error('Error in apply-seo-autofix:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function applyFix(
  supabase: any,
  rule: AutoFixRule,
  issueData: any
): Promise<any> {
  const { action } = rule.fix_action

  switch (action) {
    case 'generate_alt_text':
      return await generateAltText(supabase, issueData)

    case 'update_link':
      return await updateBrokenLink(supabase, issueData)

    case 'generate_meta_description':
      return await generateMetaDescription(supabase, issueData)

    case 'add_schema_markup':
      return await addSchemaMarkup(supabase, issueData)

    case 'optimize_image':
      return await optimizeImage(supabase, issueData)

    case 'fix_heading_structure':
      return await fixHeadingStructure(supabase, issueData)

    default:
      throw new Error(`Unsupported fix action: ${action}`)
  }
}

async function generateAltText(supabase: any, issueData: any): Promise<any> {
  // Use AI to generate alt text
  const { image_url, context } = issueData

  // Call AI model to generate description
  const aiModel = Deno.env.get('AI_MODEL') || 'gpt-4o-mini'
  const aiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!aiApiKey) {
    throw new Error('AI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`,
    },
    body: JSON.stringify({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: 'Generate concise, descriptive alt text for images. Be specific and helpful for accessibility.',
        },
        {
          role: 'user',
          content: `Generate alt text for an image with this context: ${context || 'No context provided'}. Image URL: ${image_url}`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    }),
  })

  const result = await response.json()
  const altText = result.choices?.[0]?.message?.content?.trim()

  return {
    image_url,
    generated_alt_text: altText,
    action_taken: 'Alt text generated (manual application required)',
  }
}

async function updateBrokenLink(supabase: any, issueData: any): Promise<any> {
  const { broken_url, page_url, context } = issueData

  // Find similar working URLs in the database
  // This is a simplified version - in production, you'd have more sophisticated matching
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, title')
    .ilike('title', `%${context}%`)
    .limit(5)

  const suggestions = articles?.map((a: any) => ({
    url: `/blog/${a.slug}`,
    title: a.title,
    confidence: 0.8,
  })) || []

  return {
    broken_url,
    page_url,
    suggested_replacements: suggestions,
    action_taken: 'Suggested replacement URLs (manual review recommended)',
  }
}

async function generateMetaDescription(supabase: any, issueData: any): Promise<any> {
  const { page_url, page_title, page_content } = issueData

  // Use AI to generate meta description
  const aiModel = Deno.env.get('AI_MODEL') || 'gpt-4o-mini'
  const aiApiKey = Deno.env.get('OPENAI_API_KEY')

  if (!aiApiKey) {
    throw new Error('AI API key not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aiApiKey}`,
    },
    body: JSON.stringify({
      model: aiModel,
      messages: [
        {
          role: 'system',
          content: 'Generate compelling meta descriptions under 160 characters. Focus on benefits and include a call to action.',
        },
        {
          role: 'user',
          content: `Generate a meta description for:\nTitle: ${page_title}\nContent excerpt: ${page_content?.substring(0, 500)}`,
        },
      ],
      max_tokens: 60,
      temperature: 0.7,
    }),
  })

  const result = await response.json()
  const metaDescription = result.choices?.[0]?.message?.content?.trim()

  // If this is an article, update it
  if (issueData.article_id) {
    await supabase
      .from('articles')
      .update({ meta_description: metaDescription })
      .eq('id', issueData.article_id)

    return {
      page_url,
      generated_meta_description: metaDescription,
      action_taken: 'Meta description generated and applied to article',
    }
  }

  return {
    page_url,
    generated_meta_description: metaDescription,
    action_taken: 'Meta description generated (manual application required)',
  }
}

async function addSchemaMarkup(supabase: any, issueData: any): Promise<any> {
  const { page_type, page_data } = issueData

  let schema: any = {
    '@context': 'https://schema.org',
  }

  switch (page_type) {
    case 'article':
      schema = {
        ...schema,
        '@type': 'Article',
        headline: page_data.title,
        description: page_data.description,
        author: {
          '@type': 'Person',
          name: page_data.author || 'Admin',
        },
        datePublished: page_data.created_at,
        dateModified: page_data.updated_at,
      }
      break

    case 'product':
      schema = {
        ...schema,
        '@type': 'Product',
        name: page_data.name,
        description: page_data.description,
      }
      break

    default:
      schema = {
        ...schema,
        '@type': 'WebPage',
        name: page_data.title,
        description: page_data.description,
      }
  }

  return {
    page_type,
    generated_schema: schema,
    action_taken: 'Schema markup generated (manual implementation required)',
  }
}

async function optimizeImage(supabase: any, issueData: any): Promise<any> {
  // This would integrate with image optimization service
  // For now, return recommendations
  const { image_url, current_size } = issueData

  return {
    image_url,
    current_size,
    recommendations: [
      'Use modern formats (WebP, AVIF)',
      'Implement lazy loading',
      'Serve responsive images',
      'Compress without quality loss',
    ],
    action_taken: 'Optimization recommendations generated',
  }
}

async function fixHeadingStructure(supabase: any, issueData: any): Promise<any> {
  const { page_url, current_structure } = issueData

  return {
    page_url,
    issues: current_structure.issues || [],
    recommendations: [
      'Ensure single H1 per page',
      'Maintain hierarchical order',
      'Avoid skipping heading levels',
    ],
    action_taken: 'Heading structure analysis complete',
  }
}
