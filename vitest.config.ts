import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      // Edge-function helpers. CI only runs `deno check` over
      // supabase/functions, which type-checks but executes nothing — so pure
      // logic like the SSRF guard's address-range matching had no test at all.
      // Only files that avoid Deno globals at module scope can be covered here.
      'supabase/functions/**/*.test.ts',
      // Cloudflare Pages Functions. These have no Workers globals at module
      // scope, so the crawler-detection and meta-injection logic (US-114) runs
      // here rather than only in production, where nobody would notice it
      // breaking until an unfurl came back blank.
      'functions/**/*.test.ts',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // src/integrations/supabase/client.ts throws at module load when these are
    // unset. Any test that transitively imports it — even one only exercising
    // pure functions, as feature-flags.test.ts does — fails to collect without
    // them. These are inert placeholders: no test performs real network I/O,
    // and suites that exercise queries mock the client outright.
    env: {
      VITE_SUPABASE_URL: 'http://localhost:54321',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
      VITE_FUNCTIONS_URL: 'http://localhost:54321/functions/v1',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.d.ts', '**/*.config.*', '**/types/**'],
      // Coverage baseline (2026-05-17), measured over test-imported files:
      // statements ~71.5%, branches ~63.5%, functions ~70.9%, lines ~73.1%.
      // Thresholds are intentionally set low (15%) so CI gates against
      // regressions without blocking day-to-day development. Raise these
      // incrementally as test coverage grows toward the measured baseline.
      thresholds: {
        lines: 15,
        functions: 15,
        branches: 15,
        statements: 15,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
