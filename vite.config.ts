// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";
import sass from "sass";

export default defineConfig({
  base: "/",
  build: {
    target: "esnext",
  },

  plugins: [
    wasm(),
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        replaceAttrValues: { "#ecf0f5": "currentColor" },
      },
    }),
    VitePWA({
      manifest: {
        icons: [
          {
            src: "/pwa_logo_512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],

        name: "svg-crdt-editor",
        short_name: "vecrdt",
        start_url: "/",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#ffffff",
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /.*\.(?:js|css|html|png|svg|woff2?)$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets",
            },
          },
        ],
        navigateFallback: "/",
      },
    }),
  ],

  css: {
    preprocessorOptions: {
      scss: {
        implementation: sass,
      },
    },
  },

  worker: {
    format: "es",
    plugins: () => [wasm()],
  },
});
