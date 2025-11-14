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
                manualChunks(id) {
                    // React core libraries
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
                        return 'react-vendor';
                    }

                    // Radix UI components
                    if (id.includes('@radix-ui/react-')) {
                        return 'ui-components';
                    }

                    // Our custom UI components and theme utilities
                    if (id.includes('/src/components/ui/') || id.includes('/src/lib/themes') || id.includes('/src/components/LoadingSpinner') || id.includes('/src/components/PasswordStrengthIndicator') || id.includes('/src/components/SEOHead')) {
                        return 'ui-components';
                    }

                    // Chart and visualization libraries
                    if (id.includes('recharts')) {
                        return 'charts';
                    }

                    // 3D libraries - split Three.js core separately
                    if (id.includes('node_modules/three/')) {
                        return 'three';
                    }
                    if (id.includes('@react-three/')) {
                        return 'three-addons';
                    }

                    // Form and validation
                    if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('node_modules/zod/')) {
                        return 'forms';
                    }

                    // State management and data fetching
                    if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
                        return 'data';
                    }

                    // Supabase
                    if (id.includes('@supabase/supabase-js')) {
                        return 'supabase';
                    }

                    // Icons
                    if (id.includes('lucide-react')) {
                        return 'icons';
                    }

                    // Utilities
                    if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('date-fns') || id.includes('sonner')) {
                        return 'utils';
                    }
                },
            },
        },
        // Increase chunk size warning limit (Three.js is inherently large)
        chunkSizeWarningLimit: 1000,
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
