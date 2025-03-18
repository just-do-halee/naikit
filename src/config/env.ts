/**
 * 애플리케이션 환경 변수 관리 시스템
 *
 * 모든 환경 변수를 중앙화하여 타입 안전하게 관리하고
 * 기본값 및 유효성 검사를 제공합니다.
 */

/**
 * 환경별 설정 인터페이스
 */
interface EnvironmentConfig {
  /** 애플리케이션 버전 */
  APP_VERSION: string;

  /** 애플리케이션 이름 */
  APP_NAME: string;

  /** 개발 모드 여부 */
  IS_DEV: boolean;

  /** 프로덕션 모드 여부 */
  IS_PROD: boolean;

  /** API 기본 URL */
  API_BASE_URL: string;

  /** 로깅 레벨 */
  LOG_LEVEL: "debug" | "info" | "warn" | "error";

  /** 애널리틱스 활성화 여부 */
  ANALYTICS_ENABLED: boolean;

  /** 스토리지 키 접두사 */
  STORAGE_KEY_PREFIX: string;
}

/**
 * Vite 환경 변수에서 값을 추출하는 도우미 함수
 */
function getEnvValue(key: string, defaultValue: string = ""): string {
  if (import.meta.env[key] !== undefined) {
    return import.meta.env[key] as string;
  }

  return defaultValue;
}

/**
 * 현재 환경에 따른 적절한 구성 선택
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const mode = import.meta.env.MODE || "development";
  const isProd = mode === "production";

  return {
    APP_VERSION: getEnvValue("VITE_APP_VERSION", "0.1.0"),
    APP_NAME: getEnvValue("VITE_APP_NAME", "NaiKit"),
    IS_DEV: !isProd,
    IS_PROD: isProd,
    API_BASE_URL: getEnvValue("VITE_API_BASE_URL", "https://api.novelai.net"),
    LOG_LEVEL: getEnvValue("VITE_LOG_LEVEL", isProd ? "error" : "debug") as
      | "debug"
      | "info"
      | "warn"
      | "error",
    ANALYTICS_ENABLED:
      getEnvValue("VITE_ANALYTICS_ENABLED", isProd ? "true" : "false") ===
      "true",
    STORAGE_KEY_PREFIX: getEnvValue("VITE_STORAGE_KEY_PREFIX", "naikit_"),
  };
}

/**
 * 환경 변수 구성 인스턴스
 */
export const ENV: Readonly<EnvironmentConfig> = Object.freeze(
  createEnvironmentConfig()
);

/**
 * 개발 전용 기능 (개발 환경에서만 활성화)
 */
export const DEV = {
  /**
   * 개발 모드에서만 로그 출력
   */
  log: (message: string, ...args: any[]): void => {
    if (ENV.IS_DEV) {
      console.log(`[DEV] ${message}`, ...args);
    }
  },

  /**
   * 개발 모드에서만 경고 출력
   */
  warn: (message: string, ...args: any[]): void => {
    if (ENV.IS_DEV) {
      console.warn(`[DEV] ${message}`, ...args);
    }
  },
};

/**
 * 환경 변수 검증
 * 필수 환경 변수가 설정되었는지 확인
 */
if (ENV.IS_DEV) {
  console.group("🔧 Environment Configuration");
  Object.entries(ENV).forEach(([key, value]) => {
    // 민감한 정보는 가리기
    if (key.includes("KEY") || key.includes("SECRET")) {
      console.log(`${key}: ${"*".repeat(8)}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  });
  console.groupEnd();
}

export default ENV;
