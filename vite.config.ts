import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// Cache bust: 2026-01-02 - Performance optimization

export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
    },
    plugins: [
        react(),
        mode === "development" && componentTagger(),
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
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            output: {
                format: 'es',
                // Manual chunk splitting for better caching and smaller initial bundle
                manualChunks: {
                    // React core - rarely changes, cache well
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                    // Supabase client - used everywhere
                    'supabase': ['@supabase/supabase-js'],
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
