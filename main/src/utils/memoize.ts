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
 * 최대 크기 제한이 있는 메모이제이션 유틸리티
 * LRU(Least Recently Used) 전략으로 캐시 크기 관리
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
  const cache = new Map<string, ReturnType<T>>();
  const keyTimeMap = new Map<string, number>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn(...args);
    
    // 캐시 히트
    if (cache.has(key)) {
      keyTimeMap.set(key, Date.now());
      return cache.get(key) as ReturnType<T>;
    }
    
    // 캐시 최대 크기 초과 시 가장 오래된 항목 제거
    if (cache.size >= maxSize) {
      let oldestKey = key;
      let oldestTime = Date.now();
      
      keyTimeMap.forEach((time, k) => {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = k;
        }
      });
      
      cache.delete(oldestKey);
      keyTimeMap.delete(oldestKey);
    }
    
    // 새 결과 계산 및 캐싱
    const result = fn(...args);
    cache.set(key, result);
    keyTimeMap.set(key, Date.now());
    
    return result;
  }) as T;
}
