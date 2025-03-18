/**
 * 공통 유틸리티 모듈
 *
 * 애플리케이션 전체에서 사용되는 유틸리티 함수 모음
 */

// 타입 안전성 유틸리티
export * from "./type-safety";

// 메모이제이션 유틸리티
export * from "./memoize";

// React Hooks
import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a referenced element
 * @param ref Reference to the element to monitor
 * @param handler Function to call when a click outside is detected
 */
export function useOnClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void
): void {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
}
