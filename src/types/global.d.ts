// Global type declarations for PWA and service worker functionality

/// <reference lib="webworker" />

// Service Worker Events
declare interface ExtendableEvent extends Event {
  waitUntil(f: Promise<any>): void;
}

declare interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

declare interface InstallEvent extends ExtendableEvent {}

declare interface ActivateEvent extends ExtendableEvent {}

declare interface SyncEvent extends ExtendableEvent {
  tag: string;
  lastChance: boolean;
}

declare interface NotificationEvent extends ExtendableEvent {
  notification: Notification;
  action: string;
}

declare interface PushEvent extends ExtendableEvent {
  data: PushMessageData | null;
}

// Workbox types
declare module 'workbox-*' {
  const workbox: any;
  export = workbox;
}

// Vite PWA plugin types  
declare module 'vite-plugin-pwa' {
  export interface VitePWAOptions {
    registerType?: 'autoUpdate' | 'prompt';
    includeAssets?: string[];
    manifest?: {
      name?: string;
      short_name?: string;
      description?: string;
      theme_color?: string;
      background_color?: string;
      display?: string;
      orientation?: string;
      scope?: string;
      start_url?: string;
      icons?: Array<{
        src: string;
        sizes: string;
        type: string;
        purpose?: string;
      }>;
      [key: string]: any;
    };
    workbox?: {
      globPatterns?: string[];
      runtimeCaching?: Array<{
        urlPattern: RegExp | string;
        handler: string;
        options?: any;
      }>;
      [key: string]: any;
    };
    [key: string]: any;
  }
  
  export function VitePWA(options?: VitePWAOptions): any;
}

// PWA Assets Generator (missing module)
declare module '@vite-pwa/assets-generator/api' {
  export interface ImageAssetsInstructions {
    [key: string]: any;
  }
  export interface IconAsset {
    [key: string]: any;
  }
  export interface FaviconLink {
    [key: string]: any;
  }
  export interface HtmlLink {
    [key: string]: any;
  }
  export interface AppleSplashScreenLink {
    [key: string]: any;
  }
  export interface HtmlLinkPreset {
    [key: string]: any;
  }
}

declare module '@vite-pwa/assets-generator/config' {
  export interface BuiltInPreset {
    [key: string]: any;
  }
  export interface Preset {
    [key: string]: any;
  }
}

// Global PWA variables
declare global {
  interface Window {
    __PWA_SW_REGISTERED__?: boolean;
    workbox?: any;
    __WB_MANIFEST?: any;
  }
  
  // Service Worker global scope
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: any;
    skipWaiting(): void;
    clients: Clients;
  }
}

export {};