// src/content/index.js
import { NaiManager } from "./nai-manager";
import { SidebarInjector } from "./sidebar-injector";

/**
 * NaiKit 콘텐츠 스크립트 메인 클래스
 * 확장 프로그램의 콘텐츠 스크립트 부분을 관리
 */
class NaiKitContent {
  constructor() {
    this.naiManager = new NaiManager();
    this.sidebarInjector = new SidebarInjector();
    this.initialized = false;
  }

  /**
   * 콘텐츠 스크립트 초기화
   * @returns {Promise<boolean>} 초기화 성공 여부
   */
  async initialize() {
    try {
      console.log("NaiKit 콘텐츠 스크립트 초기화 중...");

      // NovelAI 인터페이스 확인
      if (!this.isNovelAIImagePage()) {
        console.log("NovelAI 이미지 생성 페이지가 아닙니다");
        return false;
      }

      // NovelAI 인터페이스 관리자 초기화
      const naiInitialized = await this.naiManager.initialize();
      if (!naiInitialized) {
        throw new Error("NovelAI 인터페이스 초기화 실패");
      }

      // 사이드바 주입
      const sidebarInitialized = await this.sidebarInjector.initialize();
      if (!sidebarInitialized) {
        throw new Error("사이드바 주입 실패");
      }

      // 초기화 완료
      this.initialized = true;
      console.log("NaiKit 콘텐츠 스크립트 초기화 완료");

      return true;
    } catch (error) {
      console.error("NaiKit 콘텐츠 스크립트 초기화 실패:", error);
      return false;
    }
  }

  /**
   * NovelAI 이미지 생성 페이지인지 확인
   * @returns {boolean} NovelAI 이미지 생성 페이지 여부
   */
  isNovelAIImagePage() {
    return window.location.href.includes("novelai.net/image");
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    if (!this.initialized) return;

    // NaiManager 정리
    this.naiManager.cleanup();

    // 사이드바 정리
    this.sidebarInjector.cleanup();

    this.initialized = false;
  }
}

// 콘텐츠 스크립트 인스턴스 생성 및 초기화
const naiKitContent = new NaiKitContent();

// 페이지 로드 여부에 따라 다르게 처리
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    naiKitContent.initialize();
  });
} else {
  naiKitContent.initialize();
}

// 페이지 언로드 시 정리
window.addEventListener("beforeunload", () => {
  naiKitContent.cleanup();
});
