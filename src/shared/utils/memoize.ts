/**
 * 메모이제이션 유틸리티
 */

/**
 * 함수 결과를 캐싱하는 메모이제이션 유틸리티
 *
 * @param fn 메모이제이션할 함수
 * @param keyFn 캐시 키 생성 함수 (기본값: 인자를 JSON 문자열로 변환)
 * @returns 메모이제이션된 함수
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key) as ReturnType<T>;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * 고성능 LRU 캐싱 메모이제이션 유틸리티
 *
 * 모든 작업(조회, 삽입, 삭제)에 O(1) 시간 복잡도를 보장하며
 * 메모리 사용량을 최소화하는 최적화된 구현
 *
 * @param fn 메모이제이션할 함수
 * @param maxSize 최대 캐시 크기 (기본값: 100)
 * @param keyFn 캐시 키 생성 함수
 * @returns 메모이제이션된 함수
 */
export function memoizeWithLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxSize: number = 100,
  keyFn: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  // 유효성 검사: 캐시 크기가 유효하지 않으면 메모이제이션 없이 원래 함수 반환
  if (maxSize <= 0) return fn;

  // 성능 최적화: 캐시 크기가 1이면 단일 항목 캐시 사용
  if (maxSize === 1) {
    let cachedKey: string | null = null;
    let cachedValue: ReturnType<T> | null = null;

    return ((...args: Parameters<T>): ReturnType<T> => {
      const key = keyFn(...args);

      if (cachedKey === key && cachedValue !== null) {
        return cachedValue;
      }

      const result = fn(...args);
      cachedKey = key;
      cachedValue = result;
      return result;
    }) as T;
  }

  /**
   * ES6 Map은 삽입 순서를 보존하므로 별도의 순서 추적이 필요 없음
   * Map에서 항목을 삭제하고 다시 삽입하면 해당 항목이 맵의 끝으로 이동
   * 따라서 맵의 첫 번째 항목이 항상 가장 오래된(LRU) 항목
   */
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);

    // 캐시 히트 처리: 항목을 삭제하고 다시 삽입하여 맵의 끝으로 이동
    if (cache.has(key)) {
      const value = cache.get(key)!;
      // 성능 최적화: 항목 재정렬
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    // 캐시 최대 크기 초과 시 가장 오래된 항목 제거
    if (cache.size >= maxSize) {
      // Maps.keys()는 삽입 순서대로 키를 반환
      const iterator = cache.keys();
      const firstItem = iterator.next();

      // TypeScript 타입 안전성 보장
      if (!firstItem.done && firstItem.value !== undefined) {
        cache.delete(firstItem.value);
      }
    }

    // 새 결과 계산 및 캐싱
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
