/**
 * US-244: the entry and public-profile chunks carry only what the page uses.
 *
 * The real measurement is a build (entry 219 -> 183 KB gzip, profile route
 * 166.5 -> 115.6 KB beyond it). These hold the two decisions that produced
 * it, so a later edit cannot quietly undo one of them:
 *   - manualChunks keeps @radix-ui/react-slot out of ui-vendor (Button imports
 *     it, so ui-vendor rode into the entry chunk) and GSAP out of the chunk
 *     framer-motion lives in;
 *   - the profile page and its lead-capture section import their modals
 *     lazily, never statically.
 * LazyModal's own behaviour is in src/components/profile/LazyModal.test.tsx.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * VENDOR_CHUNKS as written in vite.config.ts, evaluated. Read from source
 * rather than imported: importing the config loads esbuild, which refuses to
 * start under jsdom (its TextEncoder returns another realm's Uint8Array).
 */
const viteSource = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');
const tableSource = viteSource.match(/const VENDOR_CHUNKS[^=]*=\s*(\[[\s\S]*?\n\]);/)?.[1];
const VENDOR_CHUNKS = new Function(`return ${tableSource}`)() as [string, string[]][];
const chunkOf = (pkg: string) => VENDOR_CHUNKS.find(([, pkgs]) => pkgs.includes(pkg))?.[0];

describe('manualChunks (US-244)', () => {
  it('found the table', () => {
    expect(VENDOR_CHUNKS.length).toBeGreaterThan(5);
    expect(chunkOf('react')).toBe('react-vendor');
  });

  it('puts framer-motion and GSAP in separate chunks', () => {
    expect(chunkOf('framer-motion')).toBe('motion-vendor');
    expect(chunkOf('gsap')).toBe('gsap-vendor');
    expect(chunkOf('@gsap/react')).toBe('gsap-vendor');
    expect(VENDOR_CHUNKS.map(([name]) => name)).not.toContain('animation-vendor');
  });

  it('files Slot with React rather than with the rest of Radix', () => {
    // Button imports Slot and every page renders a Button.
    expect(chunkOf('@radix-ui/react-slot')).toBe('react-vendor');
    expect(chunkOf('@radix-ui/react-compose-refs')).toBe('react-vendor');
    expect(chunkOf('@radix-ui/react-dialog')).toBe('ui-vendor');
  });

  it('still gives the preload helper a home in react-vendor (US-163)', () => {
    expect(viteSource).toContain("if (id.includes('vite/preload-helper')) return 'react-vendor';");
  });
});

describe('profile modals are lazy (US-244)', () => {
  const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
  // A value import (not `import type`) of the module — what would put it on
  // the page's static graph.
  const staticImportOf = (code: string, module: string) =>
    new RegExp(`^import\\s+(?!type\\b)[^;]*from\\s+['"][^'"]*${module}['"]`, 'm').test(code);

  it('FullProfilePage imports none of them statically', () => {
    const page = source('src/pages/public/FullProfilePage.tsx');
    for (const module of [
      'ListingDetailModal',
      'LeadFormModal',
      'CalendlyModal',
      'HomeValuationForm',
      'HomeValuationDialog',
      'CustomBlocksSection',
      'ui/dialog',
    ]) {
      expect(staticImportOf(page, module), module).toBe(false);
    }
    expect(page).toMatch(/lazy\(\(\) =>\s*import\('@\/components\/profile\/LeadFormModal'\)/);
  });

  it('LeadCaptureCTA does not pull the lead form in statically either', () => {
    const cta = source('src/components/profile/LeadCaptureCTA.tsx');
    expect(staticImportOf(cta, 'LeadFormModal')).toBe(false);
  });
});
