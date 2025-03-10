import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import webExtension from "@samrum/vite-plugin-web-extension";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "NaiKit",
        version: "0.1.0",
        description: "NovelAI 이미지 생성 경험을 향상시키는 확장 프로그램",

        action: {
          default_icon: {
            "16": "icons/icon16.png",
            "48": "icons/icon48.png",
            "128": "icons/icon128.png",
          },
          default_title: "NaiKit",
        },

        background: {
          service_worker: "src/background/index.ts",
          type: "module",
        },

        content_scripts: [
          {
            matches: ["*://*.novelai.net/image*"],
            js: ["src/content/index.ts"],
            run_at: "document_idle",
          },
        ],

        web_accessible_resources: [
          {
            resources: ["sidebar.html", "assets/*"],
            matches: ["*://*.novelai.net/*"],
          },
        ],

        permissions: ["storage", "tabs"],
        host_permissions: ["*://*.novelai.net/*"],
      },
    }) as any,
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // 빌드 설정
  build: {
    // 디버깅용 소스맵 (개발 모드에서만)
    sourcemap: process.env.NODE_ENV !== "production",
    // 출력 디렉토리
    outDir: "dist",
    // 번들 최적화
    minify: process.env.NODE_ENV === "production",
    // CSS 처리
    cssCodeSplit: false,
    // 메모리 사용 최적화
    assetsInlineLimit: 4096,
    // 청크 사이즈 경고 임계값 설정
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "zustand-vendor": ["zustand", "immer"],
          utils: ["nanoid", "lodash-es", "zod"],
        },
      },
    },
  },
});
