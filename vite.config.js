import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-ignore - vite-plugin-pwa has type declaration issues
import { VitePWA } from 'vite-plugin-pwa';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'icons/*.png'],
            manifest: {
                name: 'masterPOS - Point of Sale System',
                short_name: 'masterPOS',
                description: 'A modern Point of Sale system for retail businesses',
                theme_color: '#0f172a',
                background_color: '#f1f5f9',
                display: 'standalone',
                orientation: 'landscape-primary',
                scope: '/',
                start_url: '/',
                icons: [
                    {
                        src: 'icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173
    }
});
