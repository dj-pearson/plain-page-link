/**
 * Supabase Edge Function: Generate Listing Description
 * Calls OpenAI API to generate 3 styles of listing descriptions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface PropertyDetails {
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  price: number;
  city: string;
  state: string;
  neighborhood?: string;
  selectedFeatures: string[];
  uniqueSellingPoints: string;
  targetBuyer: string;
  yearBuilt?: number;
  lotSize?: number;
  hoa?: number;
  parking?: string;
  address?: string;
}

interface DescriptionStyle {
  style: 'luxury' | 'family-friendly' | 'investment';
  title: string;
  mlsDescription: string;
  instagramCaption: string;
  facebookPost: string;
  emailVersion: string;
  smsSnippet: string;
  powerWords: string[];
  keyEmotions: string[];
  wordCount: number;
  characterCount: number;
  readabilityScore: number;
}

// Property features mapping
const PROPERTY_FEATURES: Record<string, string> = {
  'updated-kitchen': 'Updated Kitchen',
  'granite-countertops': 'Granite Countertops',
  'hardwood-floors': 'Hardwood Floors',
  'fireplace': 'Fireplace',
  'open-floor-plan': 'Open Floor Plan',
  'master-suite': 'Master Suite',
  'walk-in-closets': 'Walk-in Closets',
  'high-ceilings': 'High Ceilings',
  'modern-appliances': 'Modern Appliances',
  'finished-basement': 'Finished Basement',
  'pool': 'Pool',
  'spa': 'Spa/Hot Tub',
  'large-yard': 'Large Yard',
  'deck-patio': 'Deck/Patio',
  'outdoor-kitchen': 'Outdoor Kitchen',
  'garage': 'Attached Garage',
  'landscaping': 'Professional Landscaping',
  'mountain-views': 'Mountain Views',
  'water-views': 'Water Views',
  'privacy': 'Private/Secluded',
  'near-schools': 'Near Schools',
  'near-shopping': 'Near Shopping',
  'walkable': 'Walkable Neighborhood',
  'near-transit': 'Near Public Transit',
  'golf-course': 'Golf Course Community',
  'gated-community': 'Gated Community',
  'downtown': 'Downtown Location',
  'quiet-street': 'Quiet Street',
  'smart-home': 'Smart Home Features',
  'solar-panels': 'Solar Panels',
  'energy-efficient': 'Energy Efficient',
  'new-roof': 'New Roof',
  'new-hvac': 'New HVAC',
  'new-windows': 'New Windows',
  'renovated': 'Recently Renovated',
  'wine-cellar': 'Wine Cellar',
};

serve(async (req) => {
  const origin = req.headers.get('origin');

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(origin);
  }

  try {
    const { propertyDetails } = await req.json();

    if (!propertyDetails) {
      throw new Error('Property details are required');
    }

    // Generate descriptions for all 3 styles
    const styles: Array<'luxury' | 'family-friendly' | 'investment'> = [
      'luxury',
      'family-friendly',
      'investment',
    ];

    const descriptions: DescriptionStyle[] = [];

    for (const style of styles) {
      const prompt = buildPrompt(propertyDetails, style);
      const generatedContent = await callOpenAI(prompt);
      const parsed = parseAIResponse(generatedContent, style);

      descriptions.push({
        ...parsed,
        style,
        title: getStyleTitle(style),
      });
    }

    return new Response(JSON.stringify({ descriptions }), {
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin),
      },
    });
  } catch (error) {
    console.error('Error generating listing description:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate listing description',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin),
        },
      }
    );
  }
});

function buildPrompt(details: PropertyDetails, style: 'luxury' | 'family-friendly' | 'investment'): string {
  const features = details.selectedFeatures
    .map((id) => PROPERTY_FEATURES[id])
    .filter(Boolean)
    .join(', ');

  const propertyTypeMap: Record<string, string> = {
    'single-family': 'Single-Family Home',
    'condo': 'Condominium',
    'townhouse': 'Townhouse',
    'multi-family': 'Multi-Family',
    'land': 'Land',
    'commercial': 'Commercial Property',
  };

  const targetBuyerMap: Record<string, string> = {
    'first-time': 'First-time homebuyers',
    'luxury': 'Luxury homebuyers',
    'investor': 'Real estate investors',
    'family': 'Growing families',
    'downsizer': 'Downsizers/Empty nesters',
    'relocating': 'Relocating professionals',
  };

  const baseContext = `Property Details:
- Type: ${propertyTypeMap[details.propertyType] || details.propertyType}
- Location: ${details.city}, ${details.state}${details.neighborhood ? ` (${details.neighborhood})` : ''}
- Bedrooms: ${details.bedrooms}
- Bathrooms: ${details.bathrooms}
- Square Feet: ${details.squareFeet.toLocaleString()}
- Price: $${details.price.toLocaleString()}
${details.yearBuilt ? `- Year Built: ${details.yearBuilt}` : ''}
${details.lotSize ? `- Lot Size: ${details.lotSize.toLocaleString()} sq ft` : ''}
${details.hoa ? `- HOA: $${details.hoa}/month` : ''}
${details.parking ? `- Parking: ${details.parking}` : ''}

Key Features: ${features || 'None specified'}

${details.uniqueSellingPoints ? `Unique Selling Points:\n${details.uniqueSellingPoints}` : ''}

Target Buyer: ${targetBuyerMap[details.targetBuyer] || details.targetBuyer}`;

  const stylePrompts = {
    luxury: `You are an elite luxury real estate copywriter specializing in high-end properties.

Writing Style:
- Sophisticated, elegant language
- Emphasize exclusivity and prestige
- Use words like "bespoke," "curated," "refined," "premier"
- Highlight luxury amenities and finishes
- Appeal to affluent buyers seeking the finest
- Create desire through scarcity and exclusivity
- Mention high-end brands/materials when relevant
- Paint a lifestyle picture, not just a house

Tone: Upscale, refined, aspirational, exclusive

Target Audience: Affluent professionals, executives, luxury homebuyers who value quality, exclusivity, and prestige.`,

    'family-friendly': `You are a warm, engaging real estate copywriter specializing in family homes.

Writing Style:
- Warm, inviting, emotional language
- Emphasize comfort, safety, and community
- Use words like "welcoming," "cozy," "spacious," "perfect for"
- Highlight family-oriented features (schools, yard, neighborhood)
- Create emotional connections to "home" and memories
- Paint pictures of family gatherings, kids playing
- Mention practical benefits for daily family life
- Warm, personal tone that feels like a friend recommending

Tone: Friendly, warm, emotionally resonant, conversational

Target Audience: Young families, parents with children, buyers looking for a forever home.`,

    investment: `You are a data-driven real estate copywriter specializing in investment properties.

Writing Style:
- Factual, numbers-focused, ROI-oriented
- Emphasize potential returns and smart investment
- Use words like "opportunity," "value," "appreciation," "income-producing"
- Highlight rental potential, market trends, appreciation
- Include relevant metrics and financial benefits
- Appeal to logic and smart decision-making
- Mention rental comps, cap rates, ROI potential
- Focus on long-term value and appreciation

Tone: Professional, analytical, opportunity-focused, strategic

Target Audience: Real estate investors, landlords, house flippers looking for rental income or appreciation.`,
  };

  return `${stylePrompts[style]}

${baseContext}

Generate a compelling listing description that:
1. Opens with an attention-grabbing hook
2. Highlights the most impressive features first
3. Uses vivid, sensory language
4. Creates emotional connection
5. Ends with a strong call-to-action
6. Is 400-600 words for the full MLS description

Also provide:
- Instagram caption (max 150 characters with 3-5 relevant hashtags)
- Facebook post (250-300 characters with call-to-action)
- Email subject line and preview text
- SMS snippet (max 160 characters)

Format the response as JSON with this structure:
{
  "mlsDescription": "...",
  "instagramCaption": "...",
  "facebookPost": "...",
  "emailSubject": "...",
  "emailPreview": "...",
  "smsSnippet": "...",
  "powerWords": ["word1", "word2", ...],
  "keyEmotions": ["emotion1", "emotion2", ...]
}`;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert real estate copywriter who creates compelling, conversion-focused listing descriptions.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseAIResponse(
  response: string,
  style: 'luxury' | 'family-friendly' | 'investment'
): Omit<DescriptionStyle, 'style' | 'title'> {
  try {
    // Clean up response (remove markdown code blocks if present)
    let cleaned = response.trim();
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    const parsed = JSON.parse(cleaned);

    const mlsDescription = parsed.mlsDescription || '';
    const wordCount = mlsDescription.split(/\s+/).length;
    const characterCount = mlsDescription.length;

    // Simple readability score (Flesch-Kincaid approximation)
    const sentences = mlsDescription.split(/[.!?]+/).length;
    const words = wordCount;
    const syllables = estimateSyllables(mlsDescription);
    const readabilityScore = Math.max(
      0,
      Math.min(100, 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words))
    );

    return {
      mlsDescription,
      instagramCaption: parsed.instagramCaption || '',
      facebookPost: parsed.facebookPost || '',
      emailVersion: `${parsed.emailSubject || 'New Listing Alert'}\n\n${parsed.emailPreview || mlsDescription.substring(0, 300)}`,
      smsSnippet: parsed.smsSnippet || mlsDescription.substring(0, 160),
      powerWords: parsed.powerWords || [],
      keyEmotions: parsed.keyEmotions || [],
      wordCount,
      characterCount,
      readabilityScore: Math.round(readabilityScore),
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);

    // Fallback: return basic structure
    return {
      mlsDescription: response.substring(0, 1000),
      instagramCaption: response.substring(0, 150),
      facebookPost: response.substring(0, 300),
      emailVersion: response.substring(0, 500),
      smsSnippet: response.substring(0, 160),
      powerWords: [],
      keyEmotions: [],
      wordCount: response.split(/\s+/).length,
      characterCount: response.length,
      readabilityScore: 70,
    };
  }
}

function estimateSyllables(text: string): number {
  // Simple syllable estimation
  const words = text.toLowerCase().split(/\s+/);
  let syllables = 0;

  words.forEach((word) => {
    const vowelGroups = word.match(/[aeiouy]+/g);
    syllables += vowelGroups ? vowelGroups.length : 1;
  });

  return syllables;
}

function getStyleTitle(style: 'luxury' | 'family-friendly' | 'investment'): string {
  const titles = {
    luxury: 'Luxury & Prestige',
    'family-friendly': 'Warm & Welcoming',
    investment: 'Smart Investment',
  };
  return titles[style];
}
