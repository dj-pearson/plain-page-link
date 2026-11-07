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
import {
  VENDOR_CHUNKS,
  chunkForPackage as chunkOf,
  packageOf,
  vendorChunkFor,
} from '@/config/vendor-chunks';

/**
 * The rule itself is imported (src/config/vendor-chunks.ts). vite.config.ts is
 * only read as text: importing it loads esbuild, which refuses to start under
 * jsdom (its TextEncoder returns another realm's Uint8Array).
 */
const viteSource = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');

describe('manualChunks (US-244)', () => {
  it('found the table', () => {
    expect(VENDOR_CHUNKS.length).toBeGreaterThan(5);
    expect(chunkOf('react')).toBe('react-vendor');
  });

  it('is the rule vite.config.ts actually uses', () => {
    expect(viteSource).toContain("from './src/config/vendor-chunks'");
    expect(viteSource).toContain('return vendorChunkFor(id);');
  });

  it('attributes a module id to its innermost package', () => {
    expect(packageOf('/app/src/components/ui/button.tsx')).toBeUndefined();
    expect(packageOf('/app/node_modules/react-dom/client.js')).toBe('react-dom');
    expect(packageOf('/app/node_modules/@radix-ui/react-dialog/dist/index.mjs')).toBe(
      '@radix-ui/react-dialog'
    );
    expect(packageOf('/app/node_modules/recharts/node_modules/d3-scale/src/index.js')).toBe(
      'd3-scale'
    );
    // Transitive dependencies are not welded into their parent's chunk.
    expect(vendorChunkFor('/app/node_modules/recharts/node_modules/d3-scale/src/index.js')).toBe(
      undefined
    );
    expect(vendorChunkFor('/app/src/pages/Landing.tsx')).toBeUndefined();
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

  it('routes every other Radix package to ui-vendor by prefix (US-288)', () => {
    // The internal primitives the named components are built on, which the
    // old by-name list never mentioned.
    for (const pkg of [
      '@radix-ui/react-dismissable-layer',
      '@radix-ui/react-focus-scope',
      '@radix-ui/react-popper',
      '@radix-ui/react-presence',
      '@radix-ui/react-primitive',
      '@radix-ui/react-portal',
      '@radix-ui/number',
      // and one this project does not use yet
      '@radix-ui/react-tooltip',
    ]) {
      expect(chunkOf(pkg), pkg).toBe('ui-vendor');
    }
    expect(vendorChunkFor('/app/node_modules/@radix-ui/react-slot/dist/index.mjs')).toBe(
      'react-vendor'
    );
    // A prefix is a scope, not a substring.
    expect(chunkOf('@radix-uix/anything')).toBeUndefined();
    expect(chunkOf('radix-ui')).toBeUndefined();
  });

  it('never files one package into two chunks', () => {
    // First match wins, so an overlap is silent. The only intended one is the
    // two Radix packages react-vendor names ahead of the '@radix-ui/' prefix.
    const seen = new Map<string, string>();
    for (const [chunk, entries] of VENDOR_CHUNKS) {
      for (const entry of entries) {
        expect(seen.get(entry), `${entry} in ${chunk}`).toBeUndefined();
        seen.set(entry, chunk);
      }
    }
    const prefixes = [...seen.keys()].filter((e) => e.endsWith('/'));
    const shadowed = [...seen.keys()].filter((e) =>
      prefixes.some((p) => p !== e && e.startsWith(p))
    );
    expect(shadowed.sort()).toEqual(['@radix-ui/react-compose-refs', '@radix-ui/react-slot']);
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
      'ListingDetails',
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

  it('ListingPage loads its modals lazily too (US-275)', () => {
    const page = source('src/pages/public/ListingPage.tsx');
    for (const module of ['LeadFormModal', 'CalendlyModal', 'ui/dialog']) {
      expect(staticImportOf(page, module), module).toBe(false);
    }
    expect(page).toMatch(/lazy\(\(\) =>\s*import\('@\/components\/profile\/LeadFormModal'\)/);
  });

  it('LeadCaptureCTA does not pull the lead form in statically either', () => {
    const cta = source('src/components/profile/LeadCaptureCTA.tsx');
    expect(staticImportOf(cta, 'LeadFormModal')).toBe(false);
  });
});
