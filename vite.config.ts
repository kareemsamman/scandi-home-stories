import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        // Cache images aggressively — serve from cache first, update in background
        runtimeCaching: [
          {
            // Supabase storage images (object/public and render/image endpoints)
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // External images (Unsplash, CDN, etc.)
            urlPattern: /^https:\/\/(images\.unsplash\.com|.*\.cloudinary\.com|.*cdn\.).*\.(png|jpg|jpeg|webp)/i,
            handler: "CacheFirst",
            options: {
              cacheName: "external-images",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // App JS/CSS bundles
            urlPattern: /\.(js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
        // Pre-cache the app shell
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      manifest: {
        name: "A.M.G PERGOLA LTD",
        short_name: "AMG Pergola",
        description: "פרגולות ופתרונות הצללה מתקדמים",
        theme_color: "#111111",
        background_color: "#ffffff",
        display: "standalone",
        lang: "he",
        icons: [
          { src: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
