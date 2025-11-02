/// <reference lib="webworker" />

// PWA and Service Worker type declarations
declare interface ExtendableEvent extends Event {
  waitUntil(f: any): void;
}

declare interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response>): void;
}

declare interface InstallEvent extends ExtendableEvent {}

declare interface ActivateEvent extends ExtendableEvent {}

// Vite PWA plugin types
declare module 'vite-plugin-pwa' {
  export interface VitePWAOptions {
    registerType?: 'autoUpdate' | 'prompt';
    includeAssets?: string[];
    manifest?: any;
    workbox?: any;
  }
  
  export function VitePWA(options?: VitePWAOptions): any;
}

// Global service worker registration
declare global {
  interface Window {
    __PWA_SW_REGISTERED__?: boolean;
  }
}

export {};