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
                manualChunks: {
                    // React core libraries
                    'react-vendor': ['react', 'react-dom', 'react-router-dom'],

                    // UI component library
                    'ui-components': [
                        '@radix-ui/react-accordion',
                        '@radix-ui/react-alert-dialog',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-label',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-progress',
                        '@radix-ui/react-select',
                        '@radix-ui/react-separator',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-switch',
                        '@radix-ui/react-tabs',
                        '@radix-ui/react-toast',
                    ],

                    // Chart and visualization libraries
                    'charts': [
                        'recharts',
                    ],

                    // 3D libraries (if used)
                    'three': [
                        'three',
                        '@react-three/fiber',
                        '@react-three/drei',
                    ],

                    // Form and validation
                    'forms': [
                        'react-hook-form',
                        '@hookform/resolvers',
                        'zod',
                    ],

                    // State management and data fetching
                    'data': [
                        '@tanstack/react-query',
                        'zustand',
                    ],

                    // Supabase
                    'supabase': [
                        '@supabase/supabase-js',
                    ],

                    // Icons
                    'icons': [
                        'lucide-react',
                    ],

                    // Utilities
                    'utils': [
                        'clsx',
                        'tailwind-merge',
                        'date-fns',
                        'sonner',
                    ],
                },
            },
        },
        // Increase chunk size warning limit to avoid warnings for large chunks
        chunkSizeWarningLimit: 600,
        // Enable minification
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: mode === 'production',
                drop_debugger: mode === 'production',
            },
        },
    },
}));
