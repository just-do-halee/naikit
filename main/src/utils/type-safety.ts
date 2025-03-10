/**
 * 타입 안전성 관련 유틸리티 함수
 */

/**
 * 값이 null 또는 undefined가 아님을 보장하는 함수
 * 
 * @param value 검증할 값
 * @param message 에러 메시지
 * @throws {Error} 값이 null 또는 undefined인 경우
 */
export function assertExists<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * 조건이 참임을 보장하는 함수
 * 
 * @param condition 검증할 조건
 * @param message 에러 메시지
 * @throws {Error} 조건이 거짓인 경우
 */
export function assertCondition(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * 배열의 특정 인덱스에 요소가 존재함을 보장하는 함수
 * 
 * @param array 검증할 배열
 * @param index 검증할 인덱스
 * @param message 에러 메시지
 * @throws {Error} 해당 인덱스에 요소가 없는 경우
 */
export function assertIndexExists<T>(array: T[], index: number, message: string): asserts index is number {
  if (index < 0 || index >= array.length) {
    throw new Error(message || `Index ${index} is out of bounds for array of length ${array.length}`);
  }
}

/**
 * 객체에 특정 속성이 존재함을 보장하는 함수
 * 
 * @param obj 검증할 객체
 * @param prop 검증할 속성 이름
 * @param message 에러 메시지
 */
export function assertPropertyExists<T, K extends PropertyKey>(
  obj: T, 
  prop: K, 
  message: string
): asserts obj is T & Record<K, unknown> {
  if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
    throw new Error(message || `Property ${String(prop)} does not exist on object`);
  }
}

/**
 * 값이 특정 타입임을 런타임에 확인하는 함수
 * 
 * @param value 확인할 값
 * @param expectedType 기대하는 타입 이름
 * @param message 에러 메시지
 */
export function assertType<T>(
  value: unknown, 
  expectedType: string, 
  message: string
): asserts value is T {
  if (typeof value !== expectedType) {
    throw new Error(message || `Expected ${expectedType}, got ${typeof value}`);
  }
}
