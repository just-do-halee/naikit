// modules/messaging/messaging.js
import { MessageTypes } from "./message-types.js";

/**
 * 메시징 시스템 초기화
 * @param {string} context - 메시징 컨텍스트 ('background', 'content', 'sidebar')
 * @returns {Object} 메시징 유틸리티 객체
 */
export function initMessaging(context) {
  /**
   * 백그라운드로 메시지 전송
   * @param {string} type - 메시지 타입
   * @param {Object} payload - 메시지 데이터
   * @returns {Promise<any>} 응답 프로미스
   */
  function sendToBackground(type, payload = {}) {
    return new Promise((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(
          { type, payload, source: context },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error("메시지 전송 오류:", chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      } catch (error) {
        console.error("메시지 전송 예외:", error);
        reject(error);
      }
    });
  }

  /**
   * 콘텐츠 스크립트로 메시지 전송 (백그라운드에서만 호출 가능)
   * @param {number} tabId - 대상 탭 ID
   * @param {string} type - 메시지 타입
   * @param {Object} payload - 메시지 데이터
   * @returns {Promise<any>} 응답 프로미스
   */
  function sendToContent(tabId, type, payload = {}) {
    if (context !== "background") {
      throw new Error("sendToContent는 백그라운드에서만 호출 가능합니다");
    }

    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(
          tabId,
          { type, payload, source: context },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "콘텐츠 메시지 전송 오류:",
                chrome.runtime.lastError
              );
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      } catch (error) {
        console.error("콘텐츠 메시지 전송 예외:", error);
        reject(error);
      }
    });
  }

  /**
   * 사이드바로 메시지 전송 (콘텐츠 스크립트에서만 호출 가능)
   * @param {string} type - 메시지 타입
   * @param {Object} payload - 메시지 데이터
   * @returns {boolean} 전송 성공 여부
   */
  function sendToSidebar(type, payload = {}) {
    if (context !== "content") {
      throw new Error("sendToSidebar는 콘텐츠 스크립트에서만 호출 가능합니다");
    }

    const sidebarFrame = document.getElementById("naikit-sidebar-frame");
    if (!sidebarFrame) {
      console.warn("사이드바 프레임을 찾을 수 없습니다. 초기화 중일 수 있습니다.");
      return false;
    }

    const sidebarWindow = sidebarFrame.contentWindow;
    if (!sidebarWindow) {
      console.error("사이드바 프레임 window에 접근할 수 없습니다");
      return false;
    }

    sidebarWindow.postMessage(
      {
        type,
        payload,
        source: context,
        from: "naikit-content",
      },
      "*"
    );
    
    return true;
  }

  /**
   * 메시지 리스너 등록
   * @param {string} type - 메시지 타입
   * @param {Function} handler - 메시지 핸들러 함수
   */
  function onMessage(type, handler) {
    if (context === "sidebar") {
      // 사이드바는 window.addEventListener('message')를 사용
      window.addEventListener("message", (event) => {
        // 출처 검증
        if (
          event.data &&
          event.data.type === type &&
          event.data.from === "naikit-content"
        ) {
          const response = handler(event.data.payload);

          // 응답이 필요하면 이후 구현
        }
      });
    } else {
      // 백그라운드와 콘텐츠는 chrome.runtime.onMessage를 사용
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.type === type) {
          try {
            const response = handler(message.payload, sender);

            // 프로미스 응답 처리
            if (response instanceof Promise) {
              response
                .then((result) => sendResponse(result))
                .catch((error) => {
                  console.error("메시지 핸들러 오류:", error);
                  sendResponse({ error: error.message });
                });

              return true; // 비동기 응답 표시
            }

            // 동기 응답
            sendResponse(response);
          } catch (error) {
            console.error("메시지 핸들러 예외:", error);
            sendResponse({ error: error.message });
          }
        }

        return false; // 동기 응답 종료
      });
    }
  }

  /**
   * 모든 탭에 메시지 브로드캐스트 (백그라운드에서만 호출 가능)
   * @param {string} type - 메시지 타입
   * @param {Object} payload - 메시지 데이터
   */
  function broadcastToAllTabs(type, payload = {}) {
    if (context !== "background") {
      throw new Error("broadcastToAllTabs는 백그라운드에서만 호출 가능합니다");
    }

    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.url && tab.url.includes("novelai.net/image")) {
          try {
            chrome.tabs.sendMessage(tab.id, { type, payload, source: context });
          } catch (error) {
            console.error(`탭 ${tab.id}로 브로드캐스트 실패:`, error);
          }
        }
      }
    });
  }

  /**
   * 재시도 로직이 포함된 메시지 전송
   * @param {Function} sendFunction - 메시지 전송 함수
   * @param {Array} args - 전송 함수 인자
   * @param {number} retries - 재시도 횟수
   * @param {number} delay - 재시도 간격 (밀리초)
   * @returns {Promise<any>} 응답 프로미스
   */
  function sendWithRetry(sendFunction, args, retries = 3, delay = 500) {
    return new Promise((resolve, reject) => {
      function attempt(remainingRetries) {
        sendFunction(...args)
          .then(resolve)
          .catch((error) => {
            if (remainingRetries > 0) {
              console.warn(
                `메시지 전송 재시도 (남은 횟수: ${remainingRetries})...`
              );
              setTimeout(() => attempt(remainingRetries - 1), delay);
            } else {
              reject(error);
            }
          });
      }

      attempt(retries);
    });
  }

  // 컨텍스트별 메시징 유틸리티 반환
  return {
    sendMessage: (type, payload) => sendToBackground(type, payload),
    sendMessageWithRetry: (type, payload, retries, delay) =>
      sendWithRetry(sendToBackground, [type, payload], retries, delay),
    onMessage,

    // 컨텍스트별 추가 기능
    ...(context === "background" && {
      sendToContent,
      sendToContentWithRetry: (tabId, type, payload, retries, delay) =>
        sendWithRetry(sendToContent, [tabId, type, payload], retries, delay),
      broadcastToAllTabs,
    }),

    ...(context === "content" && {
      sendToSidebar,
    }),
  };
}
