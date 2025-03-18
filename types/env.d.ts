/// <reference types="vite/client" />

/**
 * Vite에서 정의된 환경 변수에 대한 타입 선언
 */
interface ImportMetaEnv {
  /**
   * 현재 모드 (development, production, test)
   */
  readonly MODE: string;

  /**
   * 앱 버전
   */
  readonly VITE_APP_VERSION: string;

  /**
   * 앱 이름
   */
  readonly VITE_APP_NAME: string;

  /**
   * API 기본 URL
   */
  readonly VITE_API_BASE_URL: string;

  /**
   * 로깅 레벨
   */
  readonly VITE_LOG_LEVEL: "debug" | "info" | "warn" | "error";

  /**
   * 애널리틱스 활성화 여부
   */
  readonly VITE_ANALYTICS_ENABLED: string;

  /**
   * 스토리지 키 접두사
   */
  readonly VITE_STORAGE_KEY_PREFIX: string;
}

/**
 * ImportMeta 인터페이스 확장
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
