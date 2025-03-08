// vite.config.js
import { defineConfig } from "vite";
import webExtension from "@samrum/vite-plugin-web-extension";
import path from "path";

export default defineConfig({
  plugins: [
    webExtension({
      manifest: {
        manifest_version: 3,
        name: "NaiKit - NovelAI 이미지 생성 확장",
        version: "1.0.0",
        description:
          "NovelAI의 이미지 생성 인터페이스를 향상시키는 확장 프로그램",

        action: {
          default_icon: {
            16: "icons/icon16.png",
            48: "icons/icon48.png",
            128: "icons/icon128.png",
          },
          default_title: "NaiKit",
        },

        background: {
          service_worker: "src/background/index.js",
          type: "module",
        },

        content_scripts: [
          {
            matches: ["*://*.novelai.net/image*"],
            js: ["src/content/index.js"],
            css: ["src/styles/content.css"],
            run_at: "document_idle",
          },
        ],

        web_accessible_resources: [
          {
            resources: [
              "sidebar.html",
              "src/sidebar/**",
              "src/styles/*.css",
              "icons/*.png",
            ],
            matches: ["*://*.novelai.net/*"],
          },
        ],

        permissions: ["storage", "tabs"],
        host_permissions: ["*://*.novelai.net/*"],
      },

      // 확장 진입점 설정
      entrypoints: {
        background: "src/background/index.js",
        content: "src/content/index.js",
        sidebar: "src/sidebar/index.js",
      },
    }),
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
  },
});
