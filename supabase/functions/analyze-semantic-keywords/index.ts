import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { getCorsHeaders } from '../_shared/cors.ts';
import { getErrorMessage } from '../_shared/errorHelpers.ts';
import { requireAuth } from '../_shared/auth.ts';

/**
 * Analyze Semantic Keywords
 * Extracts and analyzes semantic keywords, entities, and topics from content
 */

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, content: providedContent, targetKeyword, saveResults = true } = await req.json();

    if (!url && !providedContent) {
      return new Response(
        JSON.stringify({ error: 'Either URL or content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing semantic keywords for: ${url || 'provided content'}`);

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

    // Extract content
    const elementsToRemove = ['script', 'style', 'nav', 'footer', 'header'];
    elementsToRemove.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    const bodyText = doc.querySelector('body')?.textContent || '';
    const cleanText = bodyText.replace(/\s+/g, ' ').trim().toLowerCase();

    // Extract keywords (simple word frequency)
    const words = cleanText.match(/\b[a-z]{3,}\b/g) || [];

    // Remove common stop words
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
      'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
      'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
      'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
      'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
      'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
    ]);

    const filteredWords = words.filter(w => !stopWords.has(w) && w.length > 3);

    // Count word frequency
    const wordFrequency = new Map();
    filteredWords.forEach(word => {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    });

    // Get top keywords
    const topKeywords = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word, count]) => ({
        keyword: word,
        count,
        density: (count / filteredWords.length) * 100,
      }));

    // Extract 2-word and 3-word phrases
    const phrases2 = [];
    const phrases3 = [];

    for (let i = 0; i < filteredWords.length - 1; i++) {
      const phrase2 = `${filteredWords[i]} ${filteredWords[i + 1]}`;
      phrases2.push(phrase2);

      if (i < filteredWords.length - 2) {
        const phrase3 = `${filteredWords[i]} ${filteredWords[i + 1]} ${filteredWords[i + 2]}`;
        phrases3.push(phrase3);
      }
    }

    // Count phrase frequency
    const phrase2Frequency = new Map();
    phrases2.forEach(phrase => {
      phrase2Frequency.set(phrase, (phrase2Frequency.get(phrase) || 0) + 1);
    });

    const phrase3Frequency = new Map();
    phrases3.forEach(phrase => {
      phrase3Frequency.set(phrase, (phrase3Frequency.get(phrase) || 0) + 1);
    });

    // Get top phrases
    const topPhrases2 = Array.from(phrase2Frequency.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase, count]) => ({ phrase, count }));

    const topPhrases3 = Array.from(phrase3Frequency.entries())
      .filter(([_, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([phrase, count]) => ({ phrase, count }));

    // LSI keyword suggestions (related keywords)
    const lsiSuggestions = [];
    if (targetKeyword) {
      const keywordLower = targetKeyword.toLowerCase();

      // Find words that appear near the target keyword
      const keywordIndices = [];
      filteredWords.forEach((word, index) => {
        if (word === keywordLower) {
          keywordIndices.push(index);
        }
      });

      const nearbyWords = new Map();
      keywordIndices.forEach(index => {
        // Get words within 10 words of target keyword
        for (let i = Math.max(0, index - 10); i < Math.min(filteredWords.length, index + 10); i++) {
          if (i !== index && filteredWords[i] !== keywordLower) {
            nearbyWords.set(filteredWords[i], (nearbyWords.get(filteredWords[i]) || 0) + 1);
          }
        }
      });

      lsiSuggestions.push(...Array.from(nearbyWords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word, count]) => ({ keyword: word, proximity: count })));
    }

    // Simple TF-IDF approximation (for this document only)
    const tfIdf = topKeywords.map(kw => ({
      keyword: kw.keyword,
      tf: kw.density,
      // IDF would require comparing with other documents, so we approximate
      score: kw.density * Math.log(filteredWords.length / kw.count),
    })).sort((a, b) => b.score - a.score).slice(0, 20);

    const result = {
      url,
      totalWords: filteredWords.length,
      uniqueWords: wordFrequency.size,
      topKeywords: topKeywords.slice(0, 20),
      topPhrases2,
      topPhrases3,
      lsiKeywords: lsiSuggestions,
      tfIdfScores: tfIdf,
      semanticCoverage: {
        uniqueWordsRatio: (wordFrequency.size / filteredWords.length) * 100,
        topKeywordsDominance: topKeywords.slice(0, 10).reduce((sum, kw) => sum + kw.density, 0),
      },
    };

    // Save to database
    if (saveResults && userId) {
      const { error: insertError } = await supabase
        .from('seo_semantic_analysis')
        .insert({
          url,
          total_words: filteredWords.length,
          unique_words: wordFrequency.size,
          top_keywords: topKeywords.slice(0, 20),
          lsi_keywords: lsiSuggestions,
          analyzed_by: userId,
        });

      if (insertError) {
        console.error('Error saving semantic analysis:', insertError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing semantic keywords:', error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
