// Fix TS build for workbox types without editing tsconfig
// Minimal declarations to satisfy vite-plugin-pwa/workbox
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(promise: Promise<Response>): void;
}

declare var self: ServiceWorkerGlobalScope;