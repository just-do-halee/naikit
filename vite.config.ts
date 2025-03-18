import {
  defineConfig,
  loadEnv,
  ConfigEnv,
  UserConfig,
  PluginOption,
} from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import webExtension from "@samrum/vite-plugin-web-extension";
import { visualizer } from "rollup-plugin-visualizer";
import pkg from "./package.json";

// 환경 변수 로드 및 가공 함수
function prepareEnv(mode: string) {
  // .env 파일에서 환경 변수 로드
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production";

  // 추가적인 환경 변수 설정
  return {
    ...env,
    VITE_APP_VERSION: pkg.version,
    VITE_APP_NAME: env.VITE_APP_NAME || "NaiKit",
    MODE: mode,
    VITE_LOG_LEVEL: env.VITE_LOG_LEVEL || (isProd ? "error" : "debug"),
  };
}
export default defineConfig(({ mode }) => {
  const env = prepareEnv(mode);
  const isProd = mode === "production";
  const analyze = process.env.ANALYZE === "true";

  return {
    // 플러그인 설정
    plugins: [
      react({
        babel: {
          plugins: isProd
            ? [["transform-remove-console", { exclude: ["error", "warn"] }]]
            : [],
        },
      }),
      webExtension({
        manifest: {
          manifest_version: 3,
          name: env.VITE_APP_NAME,
          version: pkg.version,
          description:
            pkg.description ||
            "NovelAI 이미지 생성 경험을 향상시키는 확장 프로그램",

          action: {
            default_icon: {
              "16": "assets/icons/icon16.png",
              "48": "assets/icons/icon48.png",
              "128": "assets/icons/icon128.png",
            },
            default_title: env.VITE_APP_NAME,
          },

          content_scripts: [
            {
              matches: ["*://novelai.net/image*"],
              js: ["src/entries/content.ts"],
              run_at: "document_end",
            },
          ],

          web_accessible_resources: [
            {
              resources: ["pages/sidebar.html", "pages/sidebar-loader.js", "assets/*", "src/entries/*"],
              matches: ["*://*.novelai.net/*"],
            },
          ],

          permissions: ["storage", "scripting", "activeTab"],

          host_permissions: ["*://*.novelai.net/*"],
        },
      }),
      analyze &&
        visualizer({
          filename: "stats.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean) as PluginOption[],

    // 경로 별칭
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@core": path.resolve(__dirname, "./src/core"),
        "@state": path.resolve(__dirname, "./src/state"),
        "@features": path.resolve(__dirname, "./src/features"),
        "@ui": path.resolve(__dirname, "./src/ui"),
        "@services": path.resolve(__dirname, "./src/services"),
        "@shared": path.resolve(__dirname, "./src/shared"),
        "@config": path.resolve(__dirname, "./src/config"),
        "@styles": path.resolve(__dirname, "./src/styles"),
      },
    },

    // 빌드 설정
    build: {
      sourcemap: !isProd,
      minify: isProd ? "terser" : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
      rollupOptions: {
        input: {
          sidebar: path.resolve(__dirname, "public/pages/sidebar.html"),
          content: path.resolve(__dirname, "src/entries/content.ts"),
          sidebar_entry: path.resolve(__dirname, "src/entries/sidebar.tsx"),
        },
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",
          // 코드 분할 최적화
          manualChunks: {
            "vendor-react": ["react", "react-dom"],
            "vendor-utils": ["nanoid", "lodash-es"],
          },
        },
      },
    },
  };
});
