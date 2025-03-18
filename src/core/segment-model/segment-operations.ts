/**
 * 세그먼트 조작 함수
 *
 * 세그먼트 트리를 안전하게 탐색하고 조작하는 순수 함수 모음
 */

import {
  Segment,
  TextSegment,
  WeightedSegment,
  PresetSegment,
  InlineWildcardSegment,
  isTextSegment,
  isWeightedSegment,
  isInlineWildcardSegment,
  isPresetSegment,
} from "./types";
import { createTextSegment, calculateDisplayValue } from "./segment-factory";

/**
 * 세그먼트 트리에서 ID로 세그먼트 찾기
 *
 * @param root 루트 세그먼트
 * @param id 찾을 세그먼트 ID
 * @returns 찾은 세그먼트 또는 null
 */
export function findSegmentById(root: Segment, id: string): Segment | null {
  // 현재 세그먼트가 찾는 세그먼트인 경우
  if (root.id === id) return root;

  // 자식 세그먼트 검색
  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      const found = findSegmentById(child, id);
      if (found) return found;
    }
  }

  // 찾지 못한 경우
  return null;
}

/**
 * 세그먼트 업데이트 함수 (불변성 유지)
 * 모든 세그먼트 타입의 무결성을 보장하고 타입 안전성을 완벽히 유지합니다.
 *
 * @param segment 업데이트할 세그먼트
 * @param updates 업데이트 내용
 * @returns 업데이트된 새 세그먼트
 * @throws {Error} 유효하지 않은 입력이나 업데이트 시
 */
export function updateSegment<T extends Segment>(
  segment: T,
  updates: Partial<Omit<T, "type" | "id">>
): T {
  // 1. 입력 유효성 검사
  if (!segment) {
    throw new Error("Cannot update undefined or null segment");
  }

  // 2. 업데이트 객체 안전한 복사 (type과 id 속성 보호)
  const safeUpdates: Partial<Omit<T, "type" | "id">> = { ...updates };
  // 타입 시스템을 우회한 수정 시도 방지
  delete (safeUpdates as any).type;
  delete (safeUpdates as any).id;

  // 3. 기본 세그먼트 복사 (얕은 복사)
  const result = { ...segment } as T;

  // 4. 세그먼트 타입별 특화 처리
  if (isTextSegment(segment)) {
    const textResult = result as unknown as TextSegment;
    const textUpdates = safeUpdates as Partial<TextSegment>;

    // 4.1 TextSegment 특화 처리
    if (textUpdates.content !== undefined) {
      // null/undefined는 빈 문자열로 정규화
      textResult.content = textUpdates.content ?? "";
    }
  } else if (isWeightedSegment(segment)) {
    // WeightedSegment 처리: 완전히 새로운 접근법

    // 1. 기존 값들과 업데이트 값들 추출
    const oldBracketType = segment.bracketType;
    const oldBracketLevel = segment.bracketLevel;

    // 2. 새 값 계산 (정규화 포함)
    let newBracketType = oldBracketType;
    let newBracketLevel = oldBracketLevel;
    let needsDisplayValueUpdate = false;

    if ((safeUpdates as Partial<WeightedSegment>).bracketType !== undefined) {
      const updatedType = (safeUpdates as Partial<WeightedSegment>)
        .bracketType!;
      if (updatedType !== "increase" && updatedType !== "decrease") {
        throw new Error(`Invalid bracketType: ${updatedType}`);
      }
      newBracketType = updatedType;
      needsDisplayValueUpdate = true;
    }

    if ((safeUpdates as Partial<WeightedSegment>).bracketLevel !== undefined) {
      const rawLevel = (safeUpdates as Partial<WeightedSegment>).bracketLevel!;
      // 명시적 정규화
      newBracketLevel = Math.min(78, Math.abs(rawLevel));

      if (rawLevel !== newBracketLevel) {
        console.warn(
          `bracketLevel normalized from ${rawLevel} to ${newBracketLevel}`
        );
      }
      needsDisplayValueUpdate = true;
    }

    // 3. 새 displayValue 계산
    let newDisplayValue = segment.displayValue;
    if (needsDisplayValueUpdate) {
      newDisplayValue = calculateDisplayValue(newBracketLevel, newBracketType);
    }

    // 4. 완전히 새로운 객체 생성 (스프레드 연산자로 일관성 보장)
    const updatedSegment = {
      ...segment, // 기존 세그먼트의 모든 속성 복사
      bracketType: newBracketType, // 새 값으로 명시적 덮어쓰기
      bracketLevel: newBracketLevel, // 정규화된 값으로 명시적 덮어쓰기
      displayValue: newDisplayValue, // 재계산된 값으로 명시적 덮어쓰기
    };

    // 5. 결과에 사용할 객체
    return updatedSegment as T;
  } else if (isPresetSegment(segment)) {
    const presetResult = result as unknown as PresetSegment;
    const presetUpdates = safeUpdates as Partial<PresetSegment>;

    // 4.3 PresetSegment 특화 처리
    // 이름 업데이트
    if (presetUpdates.name !== undefined) {
      if (!presetUpdates.name) {
        throw new Error("Preset name cannot be empty");
      }
      presetResult.name = presetUpdates.name;
    }

    // 모드 업데이트
    if (presetUpdates.mode !== undefined) {
      if (presetUpdates.mode !== "random" && presetUpdates.mode !== "fixed") {
        throw new Error(`Invalid preset mode: ${presetUpdates.mode}`);
      }

      presetResult.mode = presetUpdates.mode;

      // 모드에 따른 일관성 확보
      if (presetUpdates.mode === "fixed") {
        // fixed 모드인데 selected 값이 없고, 값 목록이 있는 경우
        if (
          !presetResult.selected &&
          presetResult.metadata?.values &&
          presetResult.metadata.values.length > 0
        ) {
          presetResult.selected = presetResult.metadata.values[0];
        }
        // fixed 모드인데 selected 값이 없고, 값 목록도 없는 경우
        else if (!presetResult.selected) {
          // 업데이트에 selected 값이 있으면 사용
          if (presetUpdates.selected) {
            presetResult.selected = presetUpdates.selected;
          }
          // 아무것도 없으면 오류
          else {
            throw new Error("Fixed mode preset requires a selected value");
          }
        }
      }
    }

    // selected 업데이트
    if (presetUpdates.selected !== undefined) {
      if (presetResult.mode === "fixed" && !presetUpdates.selected) {
        throw new Error("Fixed mode preset cannot have empty selected value");
      }

      presetResult.selected = presetUpdates.selected;
    }
  } else if (isInlineWildcardSegment(segment)) {
    const wildcardResult = result as unknown as InlineWildcardSegment;
    const wildcardUpdates = safeUpdates as Partial<InlineWildcardSegment>;

    // 4.4 InlineWildcardSegment 특화 처리
    if (wildcardUpdates.options !== undefined) {
      // 옵션 배열 유효성 검사
      if (!Array.isArray(wildcardUpdates.options)) {
        throw new Error("Options must be an array");
      }

      // 빈 문자열 옵션 필터링
      const validOptions = wildcardUpdates.options.filter(
        (opt) => opt !== undefined && opt !== null && opt.trim() !== ""
      );

      if (validOptions.length === 0) {
        throw new Error("Inline wildcard must have at least one valid option");
      }

      wildcardResult.options = validOptions;
    }
  }

  // 5. 공통 속성 업데이트
  // 5.1 children 배열 깊은 복사 (null/undefined 안전하게 처리)
  if ("children" in safeUpdates) {
    if (safeUpdates.children === undefined || safeUpdates.children === null) {
      result.children = undefined;
    } else {
      result.children = [...safeUpdates.children];
    }
  } else if (result.children) {
    // 원본 children 배열 복사 (얕은 복사)
    result.children = [...result.children];
  }

  // 5.2 metadata 깊은 병합 (재귀적)
  if ("metadata" in safeUpdates && safeUpdates.metadata !== undefined) {
    result.metadata = deepMergeMetadata(result.metadata, safeUpdates.metadata);
  }

  // 5.3 나머지 일반 속성들 복사
  for (const key in safeUpdates) {
    if (
      key !== "type" &&
      key !== "id" &&
      key !== "children" &&
      key !== "metadata"
    ) {
      // 안전한 타입 처리를 위한 방식 사용
      (result as unknown as Record<string, unknown>)[key] = (safeUpdates as Record<string, unknown>)[key];
    }
  }

  return result;
}

/**
 * metadata 객체를 깊은 병합하는 유틸리티 함수
 * null/undefined 안전하게 처리
 */
function deepMergeMetadata(
  target: Record<string, unknown> | undefined,
  source: Record<string, unknown>
): Record<string, unknown> {
  // 원본이 없는 경우, 소스 객체 복사본 반환
  if (!target) {
    return { ...source };
  }

  // 결과 객체 (원본 객체 복사)
  const result = { ...target };

  // 소스 객체의 모든 속성 순회
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      // 두 값 모두 객체인 경우 재귀적 병합
      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        targetValue &&
        typeof targetValue === "object" &&
        !Array.isArray(sourceValue) &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMergeMetadata(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      }
      // 객체 아닌 경우 또는 배열인 경우 그냥 복사 (배열은 깊은 복사)
      else if (Array.isArray(sourceValue)) {
        result[key] = [...sourceValue];
      }
      // 일반 값은 그대로 복사
      else {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * 세그먼트에 자식 세그먼트 삽입 (불변성 유지)
 *
 * @param parent 부모 세그먼트
 * @param newSegment 삽입할 새 세그먼트
 * @param index 삽입 위치 (기본값: 마지막)
 * @returns 업데이트된 부모 세그먼트
 */
export function insertSegment<T extends Segment>(
  parent: T,
  newSegment: Segment,
  index: number = -1
): T {
  // 새 children 배열 생성
  const children = [...(parent.children || [])];

  // 지정된 위치에 세그먼트 삽입
  if (index === -1 || index >= children.length) {
    children.push(newSegment);
  } else {
    children.splice(index, 0, newSegment);
  }

  // 업데이트된 새 세그먼트 반환
  return {
    ...parent,
    children,
  } as T;
}

/**
 * 세그먼트 트리에서 세그먼트 제거 (불변성 유지)
 *
 * @param root 루트 세그먼트
 * @param id 제거할 세그먼트 ID
 * @returns [업데이트된 루트 세그먼트, 제거 성공 여부]
 */
export function removeSegment(root: Segment, id: string): [Segment, boolean] {
  // 자식이 없는 경우
  if (!root.children || root.children.length === 0) {
    return [root, false];
  }

  // 직접 자식인지 확인
  const index = root.children.findIndex((child) => child.id === id);

  if (index !== -1) {
    // 직접 자식인 경우, 제거하고 새 세그먼트 반환
    const newChildren = [...root.children];
    newChildren.splice(index, 1);

    return [
      {
        ...root,
        children: newChildren,
      },
      true,
    ];
  }

  // 자식들 검색
  const newChildren = [...root.children];
  let found = false;

  for (let i = 0; i < newChildren.length; i++) {
    const children = newChildren[i];
    if (!children) continue;
    const [updatedChild, childFound] = removeSegment(children, id);
    if (childFound) {
      newChildren[i] = updatedChild;
      found = true;
      break;
    }
  }

  // 결과 반환
  return [
    {
      ...root,
      children: newChildren,
    },
    found,
  ];
}

/**
 * 텍스트 세그먼트 분할 (불변성 유지)
 *
 * @param segment 분할할 텍스트 세그먼트
 * @param position 분할 위치
 * @returns [왼쪽 세그먼트, 오른쪽 세그먼트]
 */
export function splitTextSegment(
  segment: TextSegment,
  position: number
): [TextSegment, TextSegment] {
  if (!isTextSegment(segment)) {
    throw new Error("Only text segments can be split");
  }

  // 문자 단위로 분할하기 위해 Array.from 사용하여 코드포인트 기준으로 처리
  const chars = Array.from(segment.content);

  if (position < 0 || position > chars.length) {
    throw new Error(
      `Invalid split position: ${position}. Content length: ${chars.length}`
    );
  }

  // 문자 단위로 텍스트 분할
  const leftContent = chars.slice(0, position).join("");
  const rightContent = chars.slice(position).join("");

  // 새 세그먼트 생성
  const leftSegment: TextSegment = {
    ...segment,
    content: leftContent,
  };

  const rightSegment = createTextSegment(rightContent);

  return [leftSegment, rightSegment];
}

/**
 * 인접한 텍스트 세그먼트 병합 (불변성 유지)
 *
 * @param parent 부모 세그먼트
 * @returns [업데이트된 부모 세그먼트, 변경 여부]
 */
export function mergeAdjacentTextSegments(parent: Segment): [Segment, boolean] {
  // 자식이 없거나 하나뿐인 경우
  if (!parent.children || parent.children.length < 2) {
    return [parent, false];
  }

  const newChildren = [...parent.children]; // 불변성을 위한 복사
  let modified = false;

  // 인접한 텍스트 세그먼트 병합
  for (let i = 0; i < newChildren.length - 1; i++) {
    const current = newChildren[i];
    const next = newChildren[i + 1];

    if (isTextSegment(current) && isTextSegment(next)) {
      // 텍스트 세그먼트 병합
      const mergedSegment: TextSegment = {
        ...current,
        content: current.content + next.content,
      };

      // 병합된 세그먼트로 교체하고 다음 세그먼트 제거
      newChildren.splice(i, 2, mergedSegment);

      modified = true;
      i--; // 인덱스 조정 (다음 반복에서 병합된 세그먼트 이후 검사)
    }
  }

  // 결과 반환
  return [
    {
      ...parent,
      children: newChildren,
    },
    modified,
  ];
}

/**
 * 세그먼트 트리 특정 조건의 세그먼트 찾기
 *
 * @param root 루트 세그먼트
 * @param predicate 검색 조건 함수
 * @returns 조건에 맞는 세그먼트 배열
 */
export function findSegments(
  root: Segment,
  predicate: (segment: Segment) => boolean
): Segment[] {
  const results: Segment[] = [];

  // 현재 세그먼트가 조건에 맞는 경우
  if (predicate(root)) {
    results.push(root);
  }

  // 자식 세그먼트 검색
  if (root.children && root.children.length > 0) {
    for (const child of root.children) {
      const childResults = findSegments(child, predicate);
      results.push(...childResults);
    }
  }

  return results;
}
/**
 * 세그먼트 트리 최적화
 * - 빈 텍스트 세그먼트 제거
 * - 인접한 텍스트 세그먼트 병합
 * - 트리 구조 전체 최적화
 *
 * @param root 최적화할 루트 세그먼트
 * @returns 최적화된 세그먼트
 */
export function optimizeSegmentTree(root: Segment): Segment {
  // 자식이 없는 경우 그대로 반환
  if (!root.children || root.children.length === 0) {
    return root;
  }

  // 빈 텍스트 세그먼트 필터링
  let newChildren = root.children.filter(
    (child) => !(isTextSegment(child) && child.content === "")
  );

  // 재귀적으로 자식 최적화 (깊이 우선)
  newChildren = newChildren.map(optimizeSegmentTree);

  // 결과 세그먼트 구성
  let result: Segment = {
    ...root,
    children: newChildren,
  };

  // 반복적으로 병합 시도
  let modified = true;
  const MAX_ITERATIONS = 100; // 안전장치: 무한 루프 방지
  let iterations = 0;

  while (modified && iterations < MAX_ITERATIONS) {
    iterations++;

    // 1. 현재 레벨에서 인접 텍스트 세그먼트 병합
    let mergeModified = true;
    while (mergeModified && result.children && result.children.length > 1) {
      const [mergedResult, changed] = mergeAdjacentTextSegments(result);
      result = mergedResult;
      mergeModified = changed;
    }

    // 2. 자식들을 다시 재귀적으로 최적화
    if (result.children && result.children.length > 0) {
      const reoptimizedChildren = result.children.map(optimizeSegmentTree);

      // 변경 여부 확인 (ID 기반 단순 비교)
      const childrenChanged = hasChildrenChanged(
        result.children,
        reoptimizedChildren
      );

      if (childrenChanged) {
        // 자식이 변경되었으면 다시 병합 시도
        result = {
          ...result,
          children: reoptimizedChildren,
        };
        modified = true;
      } else {
        // 더 이상 변경이 없으면 종료
        modified = false;
      }
    } else {
      modified = false;
    }
  }

  // 안전장치: 최대 반복 횟수 초과 시 경고
  if (iterations >= MAX_ITERATIONS) {
    console.warn(
      "Maximum optimization iterations reached in optimizeSegmentTree"
    );
  }

  return result;
}

/**
 * 두 세그먼트 배열 간 변경 여부 확인 (성능 최적화를 위해 ID 위주 비교)
 */
function hasChildrenChanged(
  oldChildren: Segment[],
  newChildren: Segment[]
): boolean {
  if (oldChildren.length !== newChildren.length) {
    return true;
  }

  for (let i = 0; i < oldChildren.length; i++) {
    // 로컬 변수에 할당하여 타입 가드 효과 강화
    const oldChild = oldChildren[i];
    const newChild = newChildren[i];

    // ID나 타입 변경 확인
    if (oldChild.id !== newChild.id || oldChild.type !== newChild.type) {
      return true;
    }

    // 텍스트 세그먼트 비교 - 로컬 변수 사용
    if (isTextSegment(oldChild) && isTextSegment(newChild)) {
      if (oldChild.content !== newChild.content) {
        return true;
      }
    }

    // 가중치 세그먼트 비교 - 로컬 변수 사용
    if (isWeightedSegment(oldChild) && isWeightedSegment(newChild)) {
      if (
        oldChild.bracketType !== newChild.bracketType ||
        oldChild.bracketLevel !== newChild.bracketLevel
      ) {
        return true;
      }
    }

    // 자식 세그먼트 재귀적 비교
    const oldGrandchildren = oldChild.children || [];
    const newGrandchildren = newChild.children || [];

    if (hasChildrenChanged(oldGrandchildren, newGrandchildren)) {
      return true;
    }
  }

  return false;
}
