/**
 * Type Safety Utilities
 * 
 * This file provides utilities for working with TypeScript types safely,
 * particularly when dealing with state management and type assertions.
 */

/**
 * Asserts that a value exists (is not null or undefined)
 * Throws an error with the provided message if the value is null or undefined
 * 
 * @param value The value to check
 * @param message Error message to display if assertion fails
 * @throws {Error} If the value is null or undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string = "Value is null or undefined"
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Asserts that a condition is true
 * Throws an error with the provided message if the condition is false
 * 
 * @param condition The condition to check
 * @param message Error message to display if assertion fails
 * @throws {Error} If the condition is false
 */
export function assertCondition(
  condition: boolean,
  message: string
): asserts condition {
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
export function assertIndexExists<T>(
  array: T[],
  index: number,
  message?: string
): asserts index is number {
  if (index < 0 || index >= array.length) {
    throw new Error(
      message ||
        `Index ${index} is out of bounds for array of length ${array.length}`
    );
  }
}

/**
 * 객체에 특정 속성이 존재함을 보장하는 함수
 *
 * @param obj 검증할 객체
 * @param prop 검증할 속성 이름
 * @param message 에러 메시지
 * @throws {Error} 해당 속성이 객체에 존재하지 않는 경우
 */
export function assertPropertyExists<T, K extends PropertyKey>(
  obj: T,
  prop: K,
  message?: string
): asserts obj is T & Record<K, unknown> {
  if (!obj || !Object.prototype.hasOwnProperty.call(obj, prop)) {
    throw new Error(
      message || `Property ${String(prop)} does not exist on object`
    );
  }
}

/**
 * Checks if a value is of the expected type at runtime
 *
 * @param value The value to check
 * @param expectedType The name of the expected type
 * @param message Optional error message
 * @throws {Error} If the value is not of the expected type
 */
export function checkType<T>(
  value: unknown,
  expectedType: string,
  message?: string
): asserts value is T {
  if (typeof value !== expectedType) {
    throw new Error(message || `Expected ${expectedType}, got ${typeof value}`);
  }
}

/**
 * 값이 빈 문자열이 아님을 보장하는 함수
 *
 * @param value 검증할 문자열
 * @param message 에러 메시지
 * @throws {Error} 값이 빈 문자열인 경우
 */
export function assertNotEmpty(
  value: string,
  message?: string
): asserts value is string {
  if (value.trim() === "") {
    throw new Error(
      message || `Expected non-empty string, but got empty string`
    );
  }
}

/**
 * 값이 지정된 범위 내에 있음을 보장하는 함수
 *
 * @param value 검증할 숫자
 * @param min 최소값 (포함)
 * @param max 최대값 (포함)
 * @param message 에러 메시지
 * @throws {Error} 값이 지정된 범위를 벗어나는 경우
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): asserts value is number {
  if (value < min || value > max) {
    throw new Error(
      message || `Value ${value} is not in range [${min}, ${max}]`
    );
  }
}

/**
 * Type definition for DeepReadonly types from Axion
 * This helps in working with Axion state types
 */
export type DeepReadonly<T> = 
  T extends (infer U)[] ? ReadonlyArray<DeepReadonly<U>> :
  T extends Function ? T :
  T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } :
  T;

/**
 * Type guard that checks if a value is an object and has a property
 */
export function hasProperty<K extends string>(
  obj: unknown, 
  prop: K
): obj is Record<K, unknown> {
  return isObject(obj) && prop in obj;
}

/**
 * Creates a deep clone with proper type narrowing
 * Safe way to handle readonly objects without type assertions
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  
  // Clone arrays recursively
  if (Array.isArray(obj)) {
    // We need to use type assertion here since TypeScript doesn't
    // infer that map returns the same type structure
    // This is one place where an assertion is actually necessary
    return Array.from(obj).map(deepClone) as unknown as T;
  }
  
  // Clone objects recursively
  const result = Object.create(Object.getPrototypeOf(obj));
  
  Object.keys(obj).forEach(key => {
    if (hasProperty(obj, key)) {
      result[key] = deepClone(obj[key]);
    }
  });
  
  return result;
}

/**
 * Type guard for non-null objects
 */
export function isObject<T extends object>(value: unknown): value is T {
  return typeof value === 'object' && value !== null;
}

/**
 * Type guard for checking if value is a record
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return isObject(value) && !Array.isArray(value);
}

/**
 * Type guard for checking if value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Creates a type-safe shallow copy of an object
 * This is safer than using spread operators on unknown types
 */
export function shallowCopy<T extends Record<string, unknown>>(obj: T): T {
  if (!isRecord(obj)) {
    throw new Error("Value is not a valid record object");
  }
  
  return Object.assign({}, obj);
}

/**
 * Safely gets a property from an unknown object with type checking
 */
export function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  if (!isObject(obj)) {
    throw new Error("Cannot access property of non-object value");
  }
  
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    throw new Error(`Property ${String(key)} does not exist on object`);
  }
  
  return obj[key];
}

/**
 * Runtime type checking function for checking exact type matches
 * Note: TypeScript's type system is structural, not nominal, so this
 * has limitations compared to static analysis, but helps for runtime.
 */
export function assertType<T>(
  value: unknown, 
  typeGuard: (v: unknown) => v is T,
  errorMessage = "Value does not match expected type"
): T {
  if (!typeGuard(value)) {
    throw new Error(errorMessage);
  }
  
  return value; // No assertion needed due to type guard narrowing
}

/**
 * Type guard for checking if a value is of a specific primitive type
 */
export function isPrimitiveOfType<T>(
  value: unknown, 
  type: 'string' | 'number' | 'boolean' | 'bigint' | 'symbol' | 'undefined' | 'function'
): value is T {
  return typeof value === type;
}

/**
 * Create a safe way to get properties from a deeply nested structure
 * Returns undefined if any part of the path is missing
 */
export function safeGet<T>(obj: unknown, ...path: string[]): T | undefined {
  let current: unknown = obj;
  
  for (const key of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    if (!isObject(current) || !(key in current)) {
      return undefined;
    }
    
    current = (current as Record<string, unknown>)[key];
  }
  
  return current as T;
}
