/**
 * Types for the pure helpers src/dashboard-weight.test.ts imports. The script
 * stays plain .mjs so CI runs it under node with no build step.
 */
export interface ManifestChunk {
  file: string;
  name?: string;
  src?: string;
  isEntry?: boolean;
  isDynamicEntry?: boolean;
  imports?: string[];
  dynamicImports?: string[];
}
export type Manifest = Record<string, ManifestChunk>;

export interface DashboardRoute {
  src: string;
  maxKb: number;
  /** Measured beyond the entry only (it is what the routes are measured beyond). */
  isLayout?: boolean;
  /** Further sources whose closure is already loaded when this one loads. */
  beyond?: string[];
}

export interface BannedRule {
  why: string;
  allow: string[];
}

export const DASHBOARD_ROUTES: DashboardRoute[];
export const ROUTE_MUST_NOT_INCLUDE: Record<string, BannedRule>;

export function entryKey(manifest: Manifest): string;
export function resolveKey(manifest: Manifest, src: string): string;
export function staticClosure(manifest: Manifest, key: string): Set<string>;
export function weighBeyond(
  manifest: Manifest,
  key: string,
  baseKeys: string[],
  sizeOf: (file: string) => number
): { file: string; bytes: number }[];
export function bannedIn(
  files: string[],
  banned: Record<string, BannedRule>,
  src: string
): { prefix: string; file: string; why: string }[];
