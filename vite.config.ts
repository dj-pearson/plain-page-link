import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// Cache bust: 2025-12-07-v2

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
            },
        },
        minify: 'esbuild',
        target: 'esnext',
    },
}));
