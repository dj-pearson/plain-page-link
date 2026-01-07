import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';
import { requireAuth } from '../_shared/auth.ts';

/**
 * Analyze Content for SEO
 * Analyzes page content for SEO best practices including readability,
 * keyword density, content length, and structure
 */

interface ContentAnalysisRequest {
  url?: string;
  content?: string;
  targetKeyword?: string;
  saveResults?: boolean;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      url,
      content: providedContent,
      targetKeyword,
      saveResults = true
    }: ContentAnalysisRequest = await req.json();

    if (!url && !providedContent) {
      return new Response(
        JSON.stringify({ error: 'Either URL or content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing content for: ${url || 'provided content'}`);

    // Initialize Supabase
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Securely authenticate user with JWT verification
    let userId = null;
    try {
      const user = await requireAuth(req, supabase);
      userId = user.id;
    } catch (e) {
      console.error('Failed to authenticate user:', e);
    }

    // Fetch content if URL provided
    let html = providedContent || '';
    let pageTitle = '';
    let metaDescription = '';

    if (url) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      html = await response.text();
    }

    // Parse HTML
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    // Extract page title and meta description
    const titleElement = doc.querySelector('title');
    pageTitle = titleElement?.textContent || '';

    const metaDesc = doc.querySelector('meta[name="description"]');
    metaDescription = metaDesc?.getAttribute('content') || '';

    // Extract main content (remove script, style, nav, footer, etc.)
    const elementsToRemove = ['script', 'style', 'nav', 'footer', 'header', 'aside', 'iframe'];
    elementsToRemove.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Get text content
    const bodyText = doc.querySelector('body')?.textContent || '';
    const cleanText = bodyText.replace(/\s+/g, ' ').trim();

    // Content metrics
    const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
    const charCount = cleanText.length;
    const paragraphCount = doc.querySelectorAll('p').length;
    const sentenceCount = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Readability scores
    const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;
    const avgSentencesPerParagraph = paragraphCount > 0 ? sentenceCount / paragraphCount : 0;

    // Flesch Reading Ease approximation (simplified)
    const avgSyllablesPerWord = estimateAvgSyllables(cleanText, wordCount);
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    // Flesch-Kincaid Grade Level
    const fkGradeLevel = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;

    // Heading structure
    const h1Count = doc.querySelectorAll('h1').length;
    const h2Count = doc.querySelectorAll('h2').length;
    const h3Count = doc.querySelectorAll('h3').length;
    const h4Count = doc.querySelectorAll('h4').length;
    const h5Count = doc.querySelectorAll('h5').length;
    const h6Count = doc.querySelectorAll('h6').length;

    // Extract all headings with their text
    const headings = [];
    for (let i = 1; i <= 6; i++) {
      const hElements = doc.querySelectorAll(`h${i}`);
      hElements.forEach(h => {
        headings.push({
          level: i,
          text: h.textContent?.trim() || ''
        });
      });
    }

    // Image analysis
    const images = doc.querySelectorAll('img');
    const totalImages = images.length;
    let imagesWithAlt = 0;
    images.forEach(img => {
      if (img.getAttribute('alt')) imagesWithAlt++;
    });

    // Link analysis
    const links = doc.querySelectorAll('a[href]');
    const totalLinks = links.length;
    let internalLinks = 0;
    let externalLinks = 0;

    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (url && href.includes(new URL(url).hostname)) {
        internalLinks++;
      } else if (href.startsWith('http')) {
        externalLinks++;
      }
    });

    // Keyword analysis (if target keyword provided)
    let keywordDensity = 0;
    let keywordCount = 0;
    let keywordInTitle = false;
    let keywordInMetaDescription = false;
    let keywordInH1 = false;
    let keywordProminence = 0;

    if (targetKeyword) {
      const keywordLower = targetKeyword.toLowerCase();
      const textLower = cleanText.toLowerCase();
      const titleLower = pageTitle.toLowerCase();
      const metaLower = metaDescription.toLowerCase();

      // Count keyword occurrences
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = textLower.match(regex);
      keywordCount = matches ? matches.length : 0;
      keywordDensity = wordCount > 0 ? (keywordCount / wordCount) * 100 : 0;

      // Check keyword placement
      keywordInTitle = titleLower.includes(keywordLower);
      keywordInMetaDescription = metaLower.includes(keywordLower);

      const h1Elements = doc.querySelectorAll('h1');
      h1Elements.forEach(h1 => {
        if (h1.textContent?.toLowerCase().includes(keywordLower)) {
          keywordInH1 = true;
        }
      });

      // Keyword prominence (position of first occurrence)
      const firstOccurrence = textLower.indexOf(keywordLower);
      if (firstOccurrence !== -1) {
        keywordProminence = (firstOccurrence / cleanText.length) * 100;
      }
    }

    // Content quality assessment
    const issues = [];
    const recommendations = [];

    if (wordCount < 300) {
      issues.push('Content is too short (< 300 words)');
      recommendations.push('Expand content to at least 300-500 words for better SEO');
    } else if (wordCount < 600) {
      recommendations.push('Consider expanding content to 600-1000 words for comprehensive coverage');
    }

    if (h1Count === 0) {
      issues.push('No H1 heading found');
      recommendations.push('Add exactly one H1 heading as the main page title');
    } else if (h1Count > 1) {
      issues.push(`Multiple H1 headings found (${h1Count})`);
      recommendations.push('Use only one H1 heading per page');
    }

    if (h2Count === 0 && wordCount > 300) {
      recommendations.push('Add H2 subheadings to improve content structure');
    }

    if (totalImages > 0 && imagesWithAlt < totalImages) {
      issues.push(`${totalImages - imagesWithAlt} images missing alt text`);
      recommendations.push('Add descriptive alt text to all images');
    }

    if (fleschScore < 30) {
      recommendations.push('Content is very difficult to read. Simplify language and shorten sentences.');
    } else if (fleschScore < 50) {
      recommendations.push('Content is moderately difficult to read. Consider simplifying.');
    }

    if (avgWordsPerSentence > 25) {
      recommendations.push('Average sentence length is long. Aim for 15-20 words per sentence.');
    }

    if (paragraphCount > 0 && wordCount / paragraphCount > 150) {
      recommendations.push('Paragraphs are too long. Break them into smaller chunks.');
    }

    if (targetKeyword) {
      if (keywordDensity < 0.5) {
        recommendations.push(`Keyword "${targetKeyword}" density is low (${keywordDensity.toFixed(2)}%). Aim for 0.5-2.5%.`);
      } else if (keywordDensity > 3) {
        issues.push(`Keyword "${targetKeyword}" density is too high (${keywordDensity.toFixed(2)}%). Risk of keyword stuffing.`);
        recommendations.push('Reduce keyword usage and use more natural variations.');
      }

      if (!keywordInTitle) {
        issues.push('Target keyword not found in page title');
        recommendations.push('Include target keyword in the page title');
      }

      if (!keywordInH1) {
        recommendations.push('Consider including target keyword in H1 heading');
      }

      if (!keywordInMetaDescription) {
        recommendations.push('Include target keyword in meta description');
      }
    }

    // Calculate overall score
    let score = 100;
    score -= issues.length * 10;
    score -= recommendations.length * 5;
    score = Math.max(0, Math.min(100, score));

    const result = {
      url,
      score,
      wordCount,
      charCount,
      sentenceCount,
      paragraphCount,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
      readability: {
        fleschReadingEase: Math.round(fleschScore),
        fleschKincaidGrade: Math.round(fkGradeLevel * 10) / 10,
        interpretation: getReadabilityInterpretation(fleschScore),
      },
      structure: {
        h1: h1Count,
        h2: h2Count,
        h3: h3Count,
        h4: h4Count,
        h5: h5Count,
        h6: h6Count,
        headings,
      },
      media: {
        totalImages,
        imagesWithAlt,
        imagesWithoutAlt: totalImages - imagesWithAlt,
        altTextCoverage: totalImages > 0 ? (imagesWithAlt / totalImages) * 100 : 0,
      },
      links: {
        total: totalLinks,
        internal: internalLinks,
        external: externalLinks,
      },
      keyword: targetKeyword ? {
        keyword: targetKeyword,
        count: keywordCount,
        density: Math.round(keywordDensity * 100) / 100,
        inTitle: keywordInTitle,
        inMetaDescription: keywordInMetaDescription,
        inH1: keywordInH1,
        prominence: Math.round(keywordProminence * 100) / 100,
      } : null,
      issues,
      recommendations,
    };

    // Save to database
    if (saveResults && userId) {
      const { error: insertError } = await supabase
        .from('seo_content_optimization')
        .insert({
          url,
          word_count: wordCount,
          flesch_reading_ease: Math.round(fleschScore),
          flesch_kincaid_grade: Math.round(fkGradeLevel * 10) / 10,
          keyword: targetKeyword,
          keyword_density: keywordDensity,
          keyword_prominence: keywordProminence,
          title: pageTitle,
          meta_description: metaDescription,
          h1_count: h1Count,
          issues_count: issues.length,
          recommendations: recommendations,
          analyzed_by: userId,
        });

      if (insertError) {
        console.error('Error saving content analysis:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing content:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to estimate average syllables per word
function estimateAvgSyllables(text: string, wordCount: number): number {
  if (wordCount === 0) return 0;

  // Simple syllable estimation based on vowel groups
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  let totalSyllables = 0;

  words.forEach(word => {
    // Count vowel groups as syllables
    const syllables = word.match(/[aeiouy]+/g);
    let count = syllables ? syllables.length : 1;

    // Adjust for silent e
    if (word.endsWith('e') && count > 1) count--;

    // At least one syllable per word
    totalSyllables += Math.max(1, count);
  });

  return totalSyllables / wordCount;
}

// Helper function to interpret Flesch Reading Ease score
function getReadabilityInterpretation(score: number): string {
  if (score >= 90) return 'Very Easy (5th grade)';
  if (score >= 80) return 'Easy (6th grade)';
  if (score >= 70) return 'Fairly Easy (7th grade)';
  if (score >= 60) return 'Standard (8th-9th grade)';
  if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (score >= 30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}
