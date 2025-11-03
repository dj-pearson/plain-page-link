// Minimal shims to satisfy Workbox and vite-plugin-pwa types in the app build
// These declarations do not affect runtime behavior

// Service Worker event shims
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends Event {
  readonly request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

declare var ExtendableEvent: {
  prototype: ExtendableEvent;
  new(type: string, eventInitDict?: any): ExtendableEvent;
};

declare var FetchEvent: {
  prototype: FetchEvent;
  new(type: string, eventInitDict?: any): FetchEvent;
};

// Missing module types for vite-plugin-pwa optional generators
declare module '@vite-pwa/assets-generator/api' {
  export type GenerateResult = any;
}

declare module '@vite-pwa/assets-generator/config' {
  export type AssetsGeneratorContext = any;
}
