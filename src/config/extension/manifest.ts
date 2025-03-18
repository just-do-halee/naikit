import pkg from "../../../package.json";

export function getManifest(
  env: Record<string, string>
): chrome.runtime.ManifestV3 {
  return {
    manifest_version: 3,
    name: env.VITE_APP_NAME || "NaiKit",
    version: pkg.version,
    description:
      pkg.description || "NovelAI 이미지 생성 경험을 향상시키는 확장 프로그램",

    action: {
      default_icon: {
        "16": "assets/icons/icon16.png",
        "48": "assets/icons/icon48.png",
        "128": "assets/icons/icon128.png",
      },
      default_title: env.VITE_APP_NAME || "NaiKit",
    },

    content_scripts: [
      {
        matches: ["*://novelai.net/image"],
        js: ["src/entries/content.ts"],
        run_at: "document_end",
        all_frames: false,
      },
    ],

    web_accessible_resources: [
      {
        resources: ["pages/sidebar.html", "assets/*"],
        matches: ["*://*.novelai.net/*"],
      },
    ],

    permissions: ["storage", "scripting", "activeTab"],

    host_permissions: ["*://*.novelai.net/*"],

    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  };
}
