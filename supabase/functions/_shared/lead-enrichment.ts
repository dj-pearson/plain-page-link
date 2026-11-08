/**
 * Step two of a lead form (US-228).
 *
 * submit-lead creates the lead from step one and returns a single-use token;
 * step two sends that token with the optional qualifiers. This module holds
 * the token helpers and decides what step two may write — only the qualifier
 * columns and form_data, never who the lead belongs to or how to reach them.
 */
import { sanitizeString, validateStringLength } from './validation.ts';
import { appendVisitorMessage } from './lead-repeat.ts';

export const ENRICH_TOKEN_TTL_MINUTES = 30;
export const ENRICH_TOKEN_RE = /^[0-9a-f]{64}$/;

export function generateEnrichToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashEnrichToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface EnrichmentUpdate {
  columns: Record<string, unknown>;
  formData: Record<string, unknown>;
  errors: string[];
}

const TEXT_COLUMNS: Record<string, number> = {
  price_range: 100,
  timeline: 100,
  property_address: 500,
  message: 2000,
};

/** The columns and form answers step two may set, sanitised. */
export function buildEnrichment(raw: Record<string, unknown>): EnrichmentUpdate {
  const columns: Record<string, unknown> = {};
  const errors: string[] = [];

  for (const [column, max] of Object.entries(TEXT_COLUMNS)) {
    const value = raw[column];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string' || !validateStringLength(value, 0, max)) {
      errors.push(`${column} must be text under ${max} characters`);
      continue;
    }
    columns[column] = sanitizeString(value);
  }
  if (raw.preapproved !== undefined) {
    if (typeof raw.preapproved !== 'boolean') errors.push('Pre-approval status must be a boolean');
    else columns.preapproved = raw.preapproved;
  }

  const formData: Record<string, unknown> = {};
  const fd = raw.form_data;
  if (fd && typeof fd === 'object' && !Array.isArray(fd)) {
    for (const [key, value] of Object.entries(fd as Record<string, unknown>)) {
      if (Object.keys(formData).length >= 40) break;
      if (value === null || value === undefined || value === '') continue;
      const k = sanitizeString(key).slice(0, 64);
      if (typeof value === 'boolean' || typeof value === 'number') formData[k] = value;
      else if (typeof value === 'string') formData[k] = sanitizeString(value).slice(0, 1000);
    }
  }

  return { columns, formData, errors };
}

/** The lead as step two finds it: what step one already stored. */
export interface EnrichTarget {
  message: string | null;
  form_data: Record<string, unknown> | null;
}

/**
 * The columns step two writes onto the lead (updated_at and the token reset
 * are the caller's).
 *
 * The qualifiers are step two's to set, but leads.message is what the visitor
 * wrote in step one, often the very text the agent was just emailed about.
 * Writing buildEnrichment's message straight over it threw that away (US-565),
 * the same overwrite US-513 fixed for the repeat fold, so a step-two message
 * is appended to the step-one message instead. form_data answers are merged,
 * a later answer to the same question winning.
 */
export function enrichmentUpdate(target: EnrichTarget, enrichment: EnrichmentUpdate): Record<string, unknown> {
  const { message: incomingMessage, ...qualifiers } = enrichment.columns;
  const update: Record<string, unknown> = {
    ...qualifiers,
    form_data: { ...(target.form_data ?? {}), ...enrichment.formData },
  };
  if (typeof incomingMessage === 'string') {
    const { message, isNew } = appendVisitorMessage(target.message, incomingMessage);
    if (isNew) update.message = message;
  }
  return update;
}
