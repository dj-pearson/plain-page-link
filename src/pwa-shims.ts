/// <reference lib="webworker" />

// Runtime-ignored global shims so TS can typecheck PWA libs
export {};

declare global {
  interface ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void;
  }

  interface FetchEvent extends Event {
    readonly request: Request;
    respondWith(response: Promise<Response> | Response): void;
  }

  var ExtendableEvent: {
    prototype: ExtendableEvent;
    new(type: string, eventInitDict?: any): ExtendableEvent;
  };

  var FetchEvent: {
    prototype: FetchEvent;
    new(type: string, eventInitDict?: any): FetchEvent;
  };
}

declare module '@vite-pwa/assets-generator/api' {
  export type GenerateResult = any;
}

declare module '@vite-pwa/assets-generator/config' {
  export type AssetsGeneratorContext = any;
}
