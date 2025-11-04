// Global ambient declarations to fix TS types from workbox/vite-plugin-pwa

// ExtendableEvent & Service Worker minimal types
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(promise: Promise<Response>): void;
}

declare var self: ServiceWorkerGlobalScope;

declare const ExtendableEvent: {
  prototype: ExtendableEvent;
  new (...args: any[]): ExtendableEvent;
};

// Missing optional peer deps from vite-plugin-pwa type declarations
declare module '@vite-pwa/assets-generator/api';
declare module '@vite-pwa/assets-generator/config';

// Unconfig types
declare type Args<T = any> = T extends (...args: infer A) => any ? A : never;
