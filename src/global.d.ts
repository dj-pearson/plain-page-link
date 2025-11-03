/// <reference lib="webworker" />

// Global shims for PWA types used by workbox and vite-plugin-pwa
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

declare module '@vite-pwa/assets-generator/api' {
  export type GenerateResult = any;
}

declare module '@vite-pwa/assets-generator/config' {
  export type AssetsGeneratorContext = any;
}
