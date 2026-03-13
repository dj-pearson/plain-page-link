// pSEO (Programmatic SEO) Types

export const PSEO_PAGE_TYPES = [
  'city-directory',
  'city-specialty',
  'city-buyers-agent',
  'city-listing-agent',
  'state-directory',
  'neighborhood-directory',
  'city-situation',
] as const;

export type PSEOPageType = typeof PSEO_PAGE_TYPES[number];

export const PSEO_PAGE_TYPE_LABELS: Record<PSEOPageType, string> = {
  'city-directory': 'City Agent Directory',
  'city-specialty': 'City + Specialty Directory',
  'city-buyers-agent': "City Buyer's Agent Directory",
  'city-listing-agent': 'City Listing Agent Directory',
  'state-directory': 'State Agent Hub',
  'neighborhood-directory': 'Neighborhood Directory',
  'city-situation': 'Life Situation Directory',
};

export const PSEO_QUEUE_STATUSES = [
  'pending',
  'processing',
  'complete',
  'failed',
  'insufficient_data',
] as const;

export type PSEOQueueStatus = typeof PSEO_QUEUE_STATUSES[number];

export const PSEO_TAXONOMY_TYPES = [
  'city',
  'state',
  'neighborhood',
  'specialty',
  'situation',
  'property_type',
] as const;

export type PSEOTaxonomyType = typeof PSEO_TAXONOMY_TYPES[number];

export const PSEO_ERROR_TYPES = [
  'api_error',
  'validation_failed',
  'quality_check_failed',
  'timeout',
  'parse_error',
] as const;

export type PSEOErrorType = typeof PSEO_ERROR_TYPES[number];

// Database row types

export interface PSEOPage {
  id: string;
  page_type: PSEOPageType;
  url_path: string;
  combination: Record<string, string>;
  content: Record<string, unknown>;
  is_published: boolean;
  quality_score: number;
  agent_count: number;
  content_hash: string | null;
  generated_at: string;
  published_at: string | null;
  updated_at: string;
  next_refresh_at: string | null;
  generation_model: string;
  error_count: number;
}

export interface PSEOQueueItem {
  id: string;
  page_type: string;
  combination: Record<string, string>;
  priority: number;
  status: PSEOQueueStatus;
  queued_at: string;
  processed_at: string | null;
  error_message: string | null;
  attempt_count: number;
}

export interface PSEOTaxonomyItem {
  id: string;
  taxonomy_type: PSEOTaxonomyType;
  display_name: string;
  parent_id: string | null;
  context: Record<string, unknown>;
  is_active: boolean;
  tier: number;
  created_at: string;
  updated_at: string;
}

export interface PSEOGenerationError {
  id: string;
  page_type: string;
  combination: Record<string, string>;
  error_type: PSEOErrorType;
  error_detail: string | null;
  quality_check_failures: Record<string, unknown> | null;
  raw_response: string | null;
  created_at: string;
}

export interface PSEOPrompt {
  id: string;
  page_type: string;
  system_prompt: string;
  user_prompt_template: string;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Stats / dashboard types

export interface PSEOStats {
  totalPages: number;
  publishedPages: number;
  draftPages: number;
  avgQualityScore: number;
  queuePending: number;
  queueProcessing: number;
  queueFailed: number;
  recentErrors: number;
  pagesByType: Record<string, number>;
}

// Queue creation input

export interface PSEOQueueInput {
  page_type: PSEOPageType;
  combination: Record<string, string>;
  priority?: number;
}
