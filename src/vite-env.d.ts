/// <reference types="vite/client" />
/// <reference path="./global.d.ts" />
/// <reference path="./types/global-serviceworker.d.ts" />
/// <reference path="./types/vite-pwa.d.ts" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_APP_URL: string;
    readonly VITE_GOOGLE_MAPS_API_KEY?: string;
    readonly VITE_STRIPE_PUBLIC_KEY?: string;
    readonly VITE_ANALYTICS_ENABLED?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
