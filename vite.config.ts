import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
    },
    plugins: [
        react(),
        mode === "development" && componentTagger(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["favicon.ico", "robots.txt", "icons/*.png"],
            manifest: {
                name: "AgentBio Admin",
                short_name: "AgentBio",
                description:
                    "Manage your real estate link-in-bio profile on the go",
                theme_color: "#2563eb",
                background_color: "#ffffff",
                display: "standalone",
                orientation: "portrait",
                scope: "/",
                start_url: "/",
                icons: [
                    {
                        src: "/icons/icon-72.png",
                        sizes: "72x72",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-96.png",
                        sizes: "96x96",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-128.png",
                        sizes: "128x128",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-144.png",
                        sizes: "144x144",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-152.png",
                        sizes: "152x152",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-192.png",
                        sizes: "192x192",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-384.png",
                        sizes: "384x384",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                    {
                        src: "/icons/icon-512.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "any maskable",
                    },
                ],
            },
            workbox: {
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 300, // 5 minutes
                            },
                            networkTimeoutSeconds: 10,
                        },
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "images-cache",
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 2592000, // 30 days
                            },
                        },
                    },
                ],
            },
        }),
    ].filter(Boolean),
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
