import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ||
    (env.VITE_API_BASE_URL?.startsWith("http")
      ? env.VITE_API_BASE_URL
      : "http://localhost:5000");

  return {
  resolve: {
    alias: [
      {
        find: "components",
        replacement: path.resolve(__dirname, "src/components"),
      },
      {
        find: "pages",
        replacement: path.resolve(__dirname, "src/pages"),
      },
      {
        find: "hooks",
        replacement: path.resolve(__dirname, "src/hooks"),
      },
      {
        find: "store",
        replacement: path.resolve(__dirname, "src/store"),
      },
      {
        find: "services",
        replacement: path.resolve(__dirname, "src/services"),
      },
      {
        find: "styles",
        replacement: path.resolve(__dirname, "src/styles"),
      },
      {
        find: "assets",
        replacement: path.resolve(__dirname, "src/assets"),
      },
      {
        find: "config",
        replacement: path.resolve(__dirname, "src/config"),
      },
      {
        find: "constant",
        replacement: path.resolve(__dirname, "src/constant"),
      },
      {
        find: "utils",
        replacement: path.resolve(__dirname, "src/utils"),
      },
      {
        find: "theme",
        replacement: path.resolve(__dirname, "src/theme"),
      },
    ],
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: [
          "import",
          "global-builtin",
          "color-functions",
        ],
      },
    },
  },

  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["appIcon.svg", "robots.txt"],
      manifest: {
        short_name: "MyPWA",
        name: "My Progressive Web App",
        start_url: ".",
        display: "standalone",
        theme_color: "#000000",
        background_color: "#ffffff",
        icons: [
          {
            src: "appIcon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "appIcon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
    server: {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/master": {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
