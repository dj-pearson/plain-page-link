import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
                // Manual chunk splitting for better caching and parallel loading
                manualChunks: (id) => {
                    // Core React - rarely changes, cache well
                    if (id.includes('node_modules/react/') ||
                        id.includes('node_modules/react-dom/') ||
                        id.includes('node_modules/react-router')) {
                        return 'vendor-react';
                    }
                    // Three.js and 3D - large bundle, load separately
                    if (id.includes('node_modules/three/') ||
                        id.includes('node_modules/@react-three/')) {
                        return 'vendor-three';
                    }
                    // Animation libraries
                    if (id.includes('node_modules/gsap/') ||
                        id.includes('node_modules/framer-motion/')) {
                        return 'vendor-animation';
                    }
                    // UI components - Radix primitives
                    if (id.includes('node_modules/@radix-ui/')) {
                        return 'vendor-ui';
                    }
                    // Data fetching and state
                    if (id.includes('node_modules/@tanstack/') ||
                        id.includes('node_modules/@supabase/') ||
                        id.includes('node_modules/zustand/')) {
                        return 'vendor-data';
                    }
                    // Charts - only loaded on dashboard/admin pages
                    if (id.includes('node_modules/recharts/') ||
                        id.includes('node_modules/d3-')) {
                        return 'vendor-charts';
                    }
                },
            },
        },
        minify: 'esbuild',
        target: 'esnext',
    },
}));
