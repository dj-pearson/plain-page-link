/// <reference types="vite/client" />

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
