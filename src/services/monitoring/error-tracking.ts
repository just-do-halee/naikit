/**
 * 에러 추적 서비스
 * 애플리케이션 오류 모니터링 및 로깅
 */
import { ENV } from "@/config/env";

type ContextType = "sidebar" | "content" | "background";

/**
 * 에러 추적 초기화
 *
 * @param context 실행 컨텍스트 (sidebar, content, background)
 */
export function setupErrorTracking(context: ContextType): void {
  // 전역 오류 처리기 설정
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handlePromiseRejection);

  if (ENV.IS_DEV) {
    console.log(`🔍 Error tracking initialized for ${context} context`);
  }

  /**
   * 일반 오류 처리 함수
   */
  function handleError(event: ErrorEvent): void {
    logError({
      type: "runtime",
      message: event.message,
      source: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
      stack: event.error?.stack,
      context,
    });
  }

  /**
   * 처리되지 않은 Promise 거부 처리 함수
   */
  function handlePromiseRejection(event: PromiseRejectionEvent): void {
    const error = event.reason;

    logError({
      type: "promise",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    });
  }
}

/**
 * 오류 로깅 함수
 */
export function logError(errorInfo: {
  type: string;
  message: string;
  source?: string | undefined;
  lineNumber?: number | undefined;
  columnNumber?: number | undefined;
  stack?: string | undefined;
  context: ContextType;
}): void {
  // 콘솔에 오류 로깅
  console.error("🚨 Error:", errorInfo);

  // 프로덕션 환경에서만 오류 보고
  if (ENV.IS_PROD) {
    // 여기서 실제 오류 추적 서비스로 보고 가능
    // 예: Sentry, LogRocket 등
  }
}
