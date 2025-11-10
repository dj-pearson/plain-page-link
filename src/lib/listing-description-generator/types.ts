/**
 * Types for AI Listing Description Generator
 */

export type PropertyType =
  | 'single-family'
  | 'condo'
  | 'townhouse'
  | 'multi-family'
  | 'land'
  | 'commercial';

export type TargetBuyer =
  | 'first-time'
  | 'luxury'
  | 'investor'
  | 'family'
  | 'downsizer'
  | 'relocating';

export type DescriptionStyle =
  | 'luxury'
  | 'family-friendly'
  | 'investment';

export interface PropertyFeature {
  id: string;
  label: string;
  category: 'interior' | 'exterior' | 'location' | 'upgrades';
}

export interface PropertyDetails {
  // Basic Info
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  price: number;

  // Location
  address?: string;
  city: string;
  state: string;
  neighborhood?: string;
  zipCode?: string;

  // Features
  selectedFeatures: string[]; // IDs of selected features
  uniqueSellingPoints: string; // Free text from agent

  // Context
  targetBuyer: TargetBuyer;
  yearBuilt?: number;
  lotSize?: number;

  // Optional
  hoa?: number;
  parking?: string;
  heating?: string;
  cooling?: string;
}

export interface GeneratedDescription {
  style: DescriptionStyle;
  title: string;
  description: string;

  // Multiple formats
  mlsDescription: string; // 500-1000 words
  instagramCaption: string; // 150 chars with hashtags
  facebookPost: string; // 300 chars with call-to-action
  emailVersion: string; // HTML-friendly
  smsSnippet: string; // 160 chars

  // Metadata
  wordCount: number;
  characterCount: number;
  powerWords: string[]; // Highlighted impactful words
  keyEmotions: string[]; // Emotions triggered
  readabilityScore: number;
}

export interface ListingAnalysis {
  propertyDetails: PropertyDetails;
  descriptions: GeneratedDescription[];
  generatedAt: string;
  id: string;
}

export interface EmailCaptureData {
  email: string;
  firstName: string;
  brokerageName?: string;
  phoneNumber?: string;
  listingId: string;
  capturedAt: string;
}

export interface AnalyticsEvent {
  eventType:
    | 'generator_started'
    | 'generator_completed'
    | 'email_captured'
    | 'description_copied'
    | 'shared'
    | 'trial_clicked';
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  timestamp: string;
}

// Predefined features list
export const PROPERTY_FEATURES: PropertyFeature[] = [
  // Interior
  { id: 'updated-kitchen', label: 'Updated Kitchen', category: 'interior' },
  { id: 'granite-countertops', label: 'Granite Countertops', category: 'interior' },
  { id: 'hardwood-floors', label: 'Hardwood Floors', category: 'interior' },
  { id: 'fireplace', label: 'Fireplace', category: 'interior' },
  { id: 'open-floor-plan', label: 'Open Floor Plan', category: 'interior' },
  { id: 'master-suite', label: 'Master Suite', category: 'interior' },
  { id: 'walk-in-closets', label: 'Walk-in Closets', category: 'interior' },
  { id: 'high-ceilings', label: 'High Ceilings', category: 'interior' },
  { id: 'modern-appliances', label: 'Modern Appliances', category: 'interior' },
  { id: 'finished-basement', label: 'Finished Basement', category: 'interior' },

  // Exterior
  { id: 'pool', label: 'Pool', category: 'exterior' },
  { id: 'spa', label: 'Spa/Hot Tub', category: 'exterior' },
  { id: 'large-yard', label: 'Large Yard', category: 'exterior' },
  { id: 'deck-patio', label: 'Deck/Patio', category: 'exterior' },
  { id: 'outdoor-kitchen', label: 'Outdoor Kitchen', category: 'exterior' },
  { id: 'garage', label: 'Attached Garage', category: 'exterior' },
  { id: 'landscaping', label: 'Professional Landscaping', category: 'exterior' },
  { id: 'mountain-views', label: 'Mountain Views', category: 'exterior' },
  { id: 'water-views', label: 'Water Views', category: 'exterior' },
  { id: 'privacy', label: 'Private/Secluded', category: 'exterior' },

  // Location
  { id: 'near-schools', label: 'Near Schools', category: 'location' },
  { id: 'near-shopping', label: 'Near Shopping', category: 'location' },
  { id: 'walkable', label: 'Walkable Neighborhood', category: 'location' },
  { id: 'near-transit', label: 'Near Public Transit', category: 'location' },
  { id: 'golf-course', label: 'Golf Course Community', category: 'location' },
  { id: 'gated-community', label: 'Gated Community', category: 'location' },
  { id: 'downtown', label: 'Downtown Location', category: 'location' },
  { id: 'quiet-street', label: 'Quiet Street', category: 'location' },

  // Upgrades
  { id: 'smart-home', label: 'Smart Home Features', category: 'upgrades' },
  { id: 'solar-panels', label: 'Solar Panels', category: 'upgrades' },
  { id: 'energy-efficient', label: 'Energy Efficient', category: 'upgrades' },
  { id: 'new-roof', label: 'New Roof', category: 'upgrades' },
  { id: 'new-hvac', label: 'New HVAC', category: 'upgrades' },
  { id: 'new-windows', label: 'New Windows', category: 'upgrades' },
  { id: 'renovated', label: 'Recently Renovated', category: 'upgrades' },
  { id: 'wine-cellar', label: 'Wine Cellar', category: 'upgrades' },
];

// Power words for real estate
export const POWER_WORDS = [
  'stunning', 'impeccable', 'pristine', 'luxurious', 'spectacular',
  'charming', 'elegant', 'sophisticated', 'custom', 'exquisite',
  'immaculate', 'premier', 'exclusive', 'private', 'serene',
  'spacious', 'bright', 'airy', 'meticulously', 'thoughtfully',
  'coveted', 'sought-after', 'rare', 'unique', 'exceptional',
  'breathtaking', 'magnificent', 'gorgeous', 'beautiful', 'picturesque'
];
