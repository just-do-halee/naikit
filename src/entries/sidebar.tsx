import React from "react";
import { createRoot } from "react-dom/client";
import App, { AxionProvider } from "@/features/sidebar/App";
import { initializeServices } from "@/services/init";
import { setupErrorTracking } from "@/services/monitoring/error-tracking";
import { ENV, DEV } from "@/config/env";

// Import Tailwind CSS first so component styles can override it
import "../styles/tailwind.css";
// Import component-specific styles
import "../styles/segments.css";
import "../styles/editor.css";

/**
 * 사이드바 앱 초기화 함수
 */
async function initializeSidebarApp() {
  console.log(
    `🚀 Initializing ${ENV.APP_NAME} sidebar app v${ENV.APP_VERSION}`
  );

  // 에러 추적 및 로깅 초기화
  setupErrorTracking("sidebar");

  // 개발 모드 로그
  DEV.log("Development mode enabled with logging level:", ENV.LOG_LEVEL);
  
  // For production, we don't need to log all stylesheets
  // Just ensure all our stylesheets are properly loaded
  const stylesheets = document.styleSheets;
  DEV.log(`${stylesheets.length} stylesheets loaded`);
  
  // Only log details in development mode to help debugging
  if (ENV.IS_DEV) {
    const safeStylesheetInfo = Array.from(stylesheets).map(sheet => {
      let rulesInfo: string | number = 'N/A';
      try {
        // Only try to access cssRules if sheet is same-origin
        if (!sheet.href || sheet.href.startsWith(window.location.origin)) {
          rulesInfo = sheet.cssRules ? sheet.cssRules.length : 0;
        }
      } catch (_) {
        // Silently handle security errors for cross-origin sheets
      }
      
      return {
        href: sheet.href,
        disabled: sheet.disabled,
        rules: rulesInfo
      };
    });
    
    DEV.log("Detailed stylesheet info:", safeStylesheetInfo);
  }

  // 서비스 초기화 (스토리지, 메시징 등)
  await initializeServices();

  // DOM에 앱 마운트
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <AxionProvider>
        <App />
      </AxionProvider>
    </React.StrictMode>
  );

  // 부모 창에 로드 완료 알림
  window.parent.postMessage({ type: "SIDEBAR_LOADED" }, "*");
}

// 앱 초기화 실행
initializeSidebarApp().catch((error) => {
  console.error("Failed to initialize sidebar app:", error);

  // 에러 UI 표시
  document.body.innerHTML = `
    <div class="error-container">
      <h1 style="color: #F7768E; font-size: 1.25rem; font-weight: bold;">${ENV.APP_NAME} 로드 실패</h1>
      <p style="margin-top: 0.5rem; font-size: 0.875rem;">페이지를 새로고침하거나 확장 프로그램을 재설치해 보세요.</p>
      <div style="margin-top: 1rem; padding: 0.5rem; background: #1A1B26; border-radius: 0.25rem; font-size: 0.75rem; overflow: auto;">
        ${error.message}
      </div>
    </div>
  `;
});
