/**
 * Types for the pure helpers src/route-weight.test.ts imports.
 *
 * The script itself stays plain .mjs — it runs under node in CI with no build
 * step — but tsc typechecks the test that reads public/_headers through it.
 */
export interface HeaderRule {
  pattern: string;
  headers: Record<string, string>;
}

export function parseHeaders(): Promise<HeaderRule[]>;
export function matches(pattern: string, path: string): boolean;
export function headersFor(rules: HeaderRule[], path: string): Record<string, string>;
