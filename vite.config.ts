import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { visualizer } from 'rollup-plugin-visualizer';
// Cache bust: 2026-01-02 - Performance optimization

// Bundle size baseline (2026-05-17, production build, minified, pre-gzip).
// Budgets enforced by scripts/check-bundle-size.mjs in CI:
//   - app/route chunks: max 500 KB
//   - *-vendor chunks:   max 600 KB
// Largest chunks at baseline:
//   three-vendor   820 KB  (lazy-loaded 3D; documented exception — only
//                            loaded on hero sections, never on first paint)
//   export-vendor  594 KB  (jspdf/html2canvas; lazy, under vendor budget)
//   index          407 KB  (entry)
//   charts-vendor  402 KB  (recharts; lazy, dashboard only)
//   supabase       175 KB  | react-vendor 164 KB | animation-vendor 185 KB
// ANALYZE=true `vite build` writes dist/stats.html and opens it.
const ANALYZE = process.env.ANALYZE === 'true';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Security headers plugin for development
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('X-Frame-Options', 'SAMEORIGIN');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
          next();
        });
      },
    },
    // Bundle visualizer — only when ANALYZE=true (off in CI/normal builds)
    ANALYZE &&
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable source maps for production (needed for Sentry error tracking)
    // These are hidden source maps that won't expose source code to users
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        format: 'es',
        // Manual chunk splitting for better caching and smaller initial bundle
        manualChunks: {
          // React core - rarely changes, cache well
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Supabase client - used everywhere
          supabase: ['@supabase/supabase-js'],
          // UI framework - Radix components
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
            '@radix-ui/react-toast',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-alert-dialog',
          ],
          // Heavy 3D libraries - lazy loaded
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // Charts - only needed in dashboard
          'charts-vendor': ['recharts'],
          // Animation libraries
          'animation-vendor': ['framer-motion', 'gsap', '@gsap/react'],
          // PDF/Export - only needed for exports
          'export-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          // Markdown rendering - only needed for blog
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
          // Firebase - only needed for push notifications
          'firebase-vendor': ['firebase/app', 'firebase/messaging'],
          // Form handling
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // State management
          'state-vendor': ['zustand', '@tanstack/react-query'],
          // Date utilities
          'date-vendor': ['date-fns'],
        },
      },
    },
    minify: 'esbuild',
    target: 'esnext',
    // Increase chunk size warning limit since we're intentionally creating vendor chunks
    chunkSizeWarningLimit: 600,
  },
}));
