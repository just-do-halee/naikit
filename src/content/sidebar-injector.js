// src/content/sidebar-injector.js
import { initMessaging, MessageTypes } from "../modules/messaging";

/**
 * 사이드바 주입 클래스
 * NovelAI 페이지에 사이드바 UI를 주입
 */
export class SidebarInjector {
  constructor() {
    this.sidebarContainer = null;
    this.sidebarFrame = null;
    this.toggleButton = null;
    this.messenger = null;
    this.resizeObserver = null;
  }

  /**
   * 사이드바 주입 초기화
   * @returns {Promise<boolean>} 성공 여부
   */
  async initialize() {
    try {
      // 메시징 시스템 초기화
      this.messenger = initMessaging("content");

      // NovelAI 페이지에 사이드바 주입
      await this.inject();

      // 사이드바와 NovelAI 간의 크기 동기화
      this.setupResizeObserver();

      return true;
    } catch (error) {
      console.error("사이드바 주입 실패:", error);
      return false;
    }
  }

  /**
   * 사이드바 DOM 요소 주입
   * @returns {Promise<void>}
   */
  async inject() {
    // 기존 인터페이스 요소 찾기
    const promptsSection = await this.waitForElement(
      ".novelai-image-generation-interface"
    );

    if (!promptsSection) {
      throw new Error("NovelAI 프롬프트 섹션을 찾을 수 없습니다");
    }

    // 사이드바 컨테이너 생성
    this.sidebarContainer = document.createElement("div");
    this.sidebarContainer.id = "naikit-sidebar-container";
    this.sidebarContainer.className = "naikit-sidebar-container";

    // 사이드바 프레임 생성
    this.sidebarFrame = document.createElement("iframe");
    this.sidebarFrame.id = "naikit-sidebar-frame";
    this.sidebarFrame.className = "naikit-sidebar-frame";
    this.sidebarFrame.src = chrome.runtime.getURL("sidebar.html");
    this.sidebarFrame.allowTransparency = true;

    // 토글 버튼 생성
    this.toggleButton = document.createElement("div");
    this.toggleButton.id = "naikit-toggle-button";
    this.toggleButton.className = "naikit-toggle-button";
    this.toggleButton.innerHTML = "◀";
    this.toggleButton.title = "사이드바 토글";

    // 토글 버튼 이벤트 리스너
    this.toggleButton.addEventListener("click", () => this.toggleSidebar());

    // 사이드바 컨테이너에 요소 추가
    this.sidebarContainer.appendChild(this.sidebarFrame);
    this.sidebarContainer.appendChild(this.toggleButton);

    // 페이지에 삽입
    promptsSection.parentNode.insertBefore(
      this.sidebarContainer,
      promptsSection
    );

    // CSS 주입
    this.injectStyles();

    // 사이드바 통신 설정
    this.setupSidebarCommunication();
  }

  /**
   * 요소가 DOM에 나타날 때까지 대기
   * @param {string} selector - CSS 선택자
   * @param {number} timeout - 타임아웃 (밀리초)
   * @returns {Promise<Element>} 찾은 요소
   */
  waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      // 이미 존재하는지 확인
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error(`요소를 찾을 수 없음: ${selector}`));
      }, timeout);

      // DOM 변화 감시
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          clearTimeout(timeoutId);
          obs.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  /**
   * 스타일 주입
   */
  injectStyles() {
    const styleElement = document.createElement("style");
    styleElement.id = "naikit-styles";
    styleElement.textContent = `
      .naikit-sidebar-container {
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 350px;
        z-index: 1000;
        display: flex;
        flex-direction: row;
        transition: transform 0.3s ease;
      }
      
      .naikit-sidebar-container.collapsed {
        transform: translateX(-100%);
      }
      
      .naikit-sidebar-frame {
        width: 100%;
        height: 100%;
        border: none;
        background-color: #1f1f2f;
      }
      
      .naikit-toggle-button {
        position: absolute;
        right: -20px;
        top: 50%;
        transform: translateY(-50%);
        width: 20px;
        height: 40px;
        background-color: #2c2c44;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        border-radius: 0 4px 4px 0;
        font-size: 12px;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
      }
      
      .naikit-toggle-button:hover {
        background-color: #3c3c64;
      }
      
      /* NovelAI 인터페이스 조정 */
      .novelai-image-generation-interface {
        margin-left: 350px;
        transition: margin-left 0.3s ease;
      }
      
      .naikit-sidebar-container.collapsed + .novelai-image-generation-interface {
        margin-left: 0;
      }
    `;

    document.head.appendChild(styleElement);
  }

  /**
   * 사이드바 토글
   */
  toggleSidebar() {
    this.sidebarContainer.classList.toggle("collapsed");

    // 토글 버튼 아이콘 변경
    if (this.sidebarContainer.classList.contains("collapsed")) {
      this.toggleButton.innerHTML = "▶";
    } else {
      this.toggleButton.innerHTML = "◀";
    }

    // 이벤트 발생
    this.dispatchSidebarEvent("toggle", {
      collapsed: this.sidebarContainer.classList.contains("collapsed"),
    });
  }

  /**
   * 사이드바 크기 변경 관찰자 설정
   */
  setupResizeObserver() {
    // NovelAI 인터페이스 찾기
    const naiInterface = document.querySelector(
      ".novelai-image-generation-interface"
    );
    if (!naiInterface) return;

    // ResizeObserver API 사용
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // NovelAI 인터페이스 크기가 변경되면 사이드바 높이 조정
        if (entry.target === naiInterface) {
          this.sidebarContainer.style.height = `${entry.contentRect.height}px`;
        }
      }
    });

    // 관찰 시작
    this.resizeObserver.observe(naiInterface);
  }

  /**
   * 사이드바 iframe과의 통신 설정
   */
  setupSidebarCommunication() {
    // iframe이 로드된 후 설정
    this.sidebarFrame.addEventListener("load", () => {
      // 사이드바 iframe의 contentWindow 확인
      if (!this.sidebarFrame.contentWindow) {
        console.error("사이드바 iframe contentWindow를 찾을 수 없습니다");
        return;
      }

      // 메시지 수신 리스너
      window.addEventListener("message", this.handleSidebarMessage.bind(this));
    });
  }

  /**
   * 사이드바에서 온 메시지 처리
   * @param {MessageEvent} event - 메시지 이벤트
   */
  handleSidebarMessage(event) {
    // 출처 확인
    if (event.source !== this.sidebarFrame.contentWindow) {
      return;
    }

    // 메시지 형식 확인
    if (
      !event.data ||
      !event.data.type ||
      event.data.from !== "naikit-sidebar"
    ) {
      return;
    }

    // 메시지 처리
    const { type, payload } = event.data;

    // 배경 스크립트로 전달
    this.messenger.sendMessage(type, payload);
  }

  /**
   * 사이드바 이벤트 발생
   * @param {string} type - 이벤트 타입
   * @param {Object} payload - 이벤트 데이터
   */
  dispatchSidebarEvent(type, payload = {}) {
    if (!this.sidebarFrame || !this.sidebarFrame.contentWindow) {
      return;
    }

    this.sidebarFrame.contentWindow.postMessage(
      {
        type,
        payload,
        from: "naikit-content",
      },
      "*"
    );
  }

  /**
   * 리소스 정리
   */
  cleanup() {
    // ResizeObserver 해제
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    // 이벤트 리스너 해제
    window.removeEventListener("message", this.handleSidebarMessage);

    // DOM 요소 제거
    if (this.sidebarContainer && this.sidebarContainer.parentNode) {
      this.sidebarContainer.parentNode.removeChild(this.sidebarContainer);
    }

    // 스타일 제거
    const styleElement = document.getElementById("naikit-styles");
    if (styleElement && styleElement.parentNode) {
      styleElement.parentNode.removeChild(styleElement);
    }
  }
}
