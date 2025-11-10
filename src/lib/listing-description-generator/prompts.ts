/**
 * AI Prompt Engineering for Listing Descriptions
 * Creates sophisticated prompts for different buyer personas
 */

import { PropertyDetails, DescriptionStyle, PROPERTY_FEATURES } from './types';

export function buildPrompt(details: PropertyDetails, style: DescriptionStyle): string {
  const baseContext = buildBaseContext(details);
  const stylePrompt = getStylePrompt(style, details);

  return `${stylePrompt}

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

function buildBaseContext(details: PropertyDetails): string {
  const features = details.selectedFeatures
    .map(id => PROPERTY_FEATURES.find(f => f.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  return `Property Details:
- Type: ${formatPropertyType(details.propertyType)}
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

Target Buyer: ${formatTargetBuyer(details.targetBuyer)}`;
}

function getStylePrompt(style: DescriptionStyle, details: PropertyDetails): string {
  const prompts: Record<DescriptionStyle, string> = {
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

Target Audience: Affluent professionals, executives, luxury homebuyers who value quality, exclusivity, and prestige. They appreciate fine details and exceptional craftsmanship.`,

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

Target Audience: Young families, parents with children, buyers looking for a forever home where they can build memories and raise their kids.`,

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

Target Audience: Real estate investors, landlords, house flippers, buyers looking for rental income or appreciation potential. They make decisions based on numbers and ROI.`,
  };

  return prompts[style];
}

function formatPropertyType(type: string): string {
  const formatted: Record<string, string> = {
    'single-family': 'Single-Family Home',
    'condo': 'Condominium',
    'townhouse': 'Townhouse',
    'multi-family': 'Multi-Family',
    'land': 'Land',
    'commercial': 'Commercial Property',
  };
  return formatted[type] || type;
}

function formatTargetBuyer(buyer: string): string {
  const formatted: Record<string, string> = {
    'first-time': 'First-time homebuyers',
    'luxury': 'Luxury homebuyers',
    'investor': 'Real estate investors',
    'family': 'Growing families',
    'downsizer': 'Downsizers/Empty nesters',
    'relocating': 'Relocating professionals',
  };
  return formatted[buyer] || buyer;
}

/**
 * Parse AI response and structure it
 */
export function parseAIResponse(response: string): {
  mlsDescription: string;
  instagramCaption: string;
  facebookPost: string;
  emailSubject?: string;
  emailPreview?: string;
  smsSnippet: string;
  powerWords: string[];
  keyEmotions: string[];
} {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(response);
    return {
      mlsDescription: parsed.mlsDescription || '',
      instagramCaption: parsed.instagramCaption || '',
      facebookPost: parsed.facebookPost || '',
      emailSubject: parsed.emailSubject,
      emailPreview: parsed.emailPreview,
      smsSnippet: parsed.smsSnippet || '',
      powerWords: parsed.powerWords || [],
      keyEmotions: parsed.keyEmotions || [],
    };
  } catch (error) {
    // Fallback: extract descriptions from plain text
    console.error('Failed to parse AI response as JSON:', error);

    // Extract sections using regex patterns
    const mlsMatch = response.match(/MLS[^\n]*:?\s*(.+?)(?=Instagram|Facebook|Email|SMS|$)/is);
    const instaMatch = response.match(/Instagram[^\n]*:?\s*(.+?)(?=Facebook|Email|SMS|$)/is);
    const fbMatch = response.match(/Facebook[^\n]*:?\s*(.+?)(?=Email|SMS|$)/is);
    const smsMatch = response.match(/SMS[^\n]*:?\s*(.+?)(?=$)/is);

    return {
      mlsDescription: mlsMatch?.[1]?.trim() || response.substring(0, 500),
      instagramCaption: instaMatch?.[1]?.trim() || '',
      facebookPost: fbMatch?.[1]?.trim() || '',
      smsSnippet: smsMatch?.[1]?.trim() || '',
      powerWords: [],
      keyEmotions: [],
    };
  }
}

/**
 * Validate and clean generated descriptions
 */
export function validateDescription(description: string, maxLength?: number): string {
  let cleaned = description.trim();

  // Remove any JSON artifacts
  cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');

  // Truncate if needed
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength - 3) + '...';
  }

  return cleaned;
}

/**
 * Generate power words from description
 */
export function extractPowerWords(description: string): string[] {
  const powerWords = [
    'stunning', 'impeccable', 'pristine', 'luxurious', 'spectacular',
    'charming', 'elegant', 'sophisticated', 'custom', 'exquisite',
    'immaculate', 'premier', 'exclusive', 'private', 'serene',
    'spacious', 'bright', 'airy', 'meticulously', 'thoughtfully',
    'coveted', 'sought-after', 'rare', 'unique', 'exceptional',
    'breathtaking', 'magnificent', 'gorgeous', 'beautiful', 'picturesque',
    'modern', 'updated', 'renovated', 'designer', 'resort-style'
  ];

  const found: string[] = [];
  const lowerDesc = description.toLowerCase();

  powerWords.forEach(word => {
    if (lowerDesc.includes(word) && !found.includes(word)) {
      found.push(word);
    }
  });

  return found;
}
