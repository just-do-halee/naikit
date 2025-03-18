/**
 * 메시징 서비스
 *
 * 확장 프로그램 내 컴포넌트 간 통신을 위한 메시징 시스템
 */
import { nanoid } from "nanoid";
import { ENV } from "@/config/env";

export type MessageSource = "content" | "sidebar" | "background";

export interface Message<T = any> {
  type: string;
  payload: T;
  source: MessageSource;
  target: MessageSource | undefined;
  id: string;
  timestamp: number;
}

export type MessageHandler<T = any> = (payload: T, message: Message<T>) => void;

/**
 * 메시지 핸들러 저장소
 */
const handlers: Record<string, Set<MessageHandler>> = {};
const globalHandlers: Set<(message: Message) => void> = new Set();

/**
 * 메시징 인터페이스
 */
export interface Messenger {
  sendMessage<T>(type: string, payload: T, target?: MessageSource): void;
  onMessage<T>(type: string, handler: MessageHandler<T>): () => void;
  onMessage(handler: (message: Message) => void): () => void;
}

/**
 * 메시징 시스템 생성
 *
 * @param source 메시지 소스
 */
export function createMessenger(source: MessageSource): Messenger {
  return {
    /**
     * 메시지 전송
     */
    sendMessage<T>(type: string, payload: T, target?: MessageSource): void {
      const message: Message<T> = {
        type,
        payload,
        source,
        target,
        id: nanoid(),
        timestamp: Date.now(),
      };

      // 브라우저 메시징 사용 (chrome.runtime.sendMessage)
      if (target === "background") {
        chrome.runtime.sendMessage(message);
      }
      // 웹 메시징 사용 (window.postMessage)
      else {
        window.postMessage(message, "*");
      }
    },

    /**
     * 메시지 핸들러 등록
     */
    onMessage<T>(
      typeOrHandler: string | ((message: Message) => void),
      handler?: MessageHandler<T>
    ): () => void {
      // 글로벌 핸들러 등록
      if (typeof typeOrHandler === "function") {
        const globalHandler = typeOrHandler;
        globalHandlers.add(globalHandler);

        // 구독 해제 함수 반환
        return () => {
          globalHandlers.delete(globalHandler);
        };
      }

      // 타입별 핸들러 등록
      const type = typeOrHandler;
      const typeHandler = handler as MessageHandler;

      if (!handlers[type]) {
        handlers[type] = new Set();
      }

      handlers[type].add(typeHandler);

      // 구독 해제 함수 반환
      return () => {
        handlers[type]?.delete(typeHandler);

        // 핸들러가 없으면 Set도 정리
        if (handlers[type]?.size === 0) {
          delete handlers[type];
        }
      };
    },
  };
}

/**
 * 메시징 시스템 초기화
 * 글로벌 메시지 리스너 설정
 */
export function setupMessaging(): void {
  // Window 메시지 리스너
  window.addEventListener("message", (event) => {
    processMessage(event.data);
  });

  // 크롬 런타임 메시지 리스너
  if (chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((message) => {
      processMessage(message);
    });
  }

  if (ENV.IS_DEV) {
    console.log("🔄 Messaging system initialized");
  }
}

/**
 * 메시지 처리 함수
 */
function processMessage(data: any): void {
  // 유효한 메시지 형식인지 확인
  if (!data || !data.type || !data.source) {
    return;
  }

  const message = data as Message;

  // 글로벌 핸들러 실행
  globalHandlers.forEach((handler) => {
    try {
      handler(message);
    } catch (error) {
      console.error("Error in global message handler:", error);
    }
  });

  // 타입별 핸들러 실행
  const typeHandlers = handlers[message.type];
  if (typeHandlers) {
    typeHandlers.forEach((handler) => {
      try {
        handler(message.payload, message);
      } catch (error) {
        console.error(
          `Error in message handler for type "${message.type}":`,
          error
        );
      }
    });
  }
}
